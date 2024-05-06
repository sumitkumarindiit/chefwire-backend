import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import * as Helper from "../services/HelperFunction.js";
import * as validateUser from "../services/SchemaValidate/userSchema.js";
import { Constants } from "../services/Constants.js";
import { Logs } from "../middleware/log.js";
import uploadToS3 from "../services/s3Services.js";
import Notification from "../models/notificationModel.js";
import { validateCoupon, userCommonAggregation } from "../services/userService.js";
import mongoose from "mongoose";
import Address from "../models/addressModel.js";
import Review from "../models/reviewModel.js";
import Coupon from "../models/couponModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const changePassword = async (req, res, next) => {
  try {
    if (
      Helper.validateRequest(validateUser.changePasswordSchema, req.body, res)
    )
      return;
    const { oldPassword, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findById(req.user._id);

    if (user) {
      const is_correct_password = await bcrypt.compare(
        oldPassword,
        user.password
      );
      if (is_correct_password) {
        await User.findByIdAndUpdate(user._id, {
          password: hashedPassword,
        });
        Logs(req, Constants.PASSWORD_CHANGED, next);
        return Helper.successMsg(res, Constants.PASSWORD_CHANGED, {});
      } else {
        Logs(req, Constants.INCORRECT_PASSWORD, next);
        return Helper.errorMsg(res, Constants.INCORRECT_PASSWORD, 200);
      }
    } else {
      Logs(req, Constants.INCORRECT_PASSWORD, next);
      return Helper.errorMsg(res, Constants.INVALID_TOKEN, 401);
    }
  } catch (err) {
    return Helper.catchBlock(req, res, next, err);
  }
};
export const getUserProfile = async (req, res) => {
  try {
    if (
      Helper.validateRequest(validateUser.userIdSchemaOptional, req.query, res)
    )
      return;
    const userId = req.user._id;
    const otherUserId = req.query.userId;
    const [users] = await Promise.all([
      User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(
              otherUserId ? otherUserId : userId
            ),
          },
        },
        ...userCommonAggregation("profile"),
      ]),
    ]);

    return Helper.successMsg(res, Constants.DATA_FETCHED, users[0]);
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.userSearchQuery, req.query, res))
      return;
    const { name, group_id } = req.query;
    if (!name) {
      return Helper.successMsg(res, Constants.DATA_GET, []);
    }
    let participants = [];
    if (group_id) {
      participants = await Group.findById(group_id);
    }

    const { _id, my_network, blocked_user } = req.user;
    const blockListIds = blocked_user.map((item) => item.user_id);
    const friendListIds = my_network.map((item) => item.user_id);
    const participantsIds = participants?.users?.map((item) => item) || [];
    const pendingIds = participants?.pending_invite?.map((item) => item) || [];
    const excludedIds = [_id, ...blockListIds, ...pendingIds];
    // console.log(44,excludedIds);
    const result = await User.find({
      $and: [
        {
          $or: [
            { first_name: { $regex: name, $options: "i" } },
            { last_name: { $regex: name, $options: "i" } },
            { email: { $regex: name, $options: "i" } },
          ],
        },
        {
          _id: { $nin: excludedIds },
          status: Constants.ACTIVE,
          email_verified: true,
        },
      ],
    }).select("_id first_name last_name profile_pic email");
    return Helper.successMsg(res, Constants.DATA_GET, result);
  } catch (err) {
    console.error(err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const file = req.files?.profilePic;
    if (
      Helper.validateRequest(
        validateUser.updateUserSchema,
        { ...req.body, ...(file && { profilePic: file.data }) },
        res
      )
    )
      return;
    const isuser = await User.findById(req.user._id).select("email");
    if (isuser.email !== req.body.email) {
      const isEmail = await User.findOne({ email: req.body.email });
      if (isEmail) {
        return Helper.errorMsg(res, Constants.EMAIL_EXIST, 200);
      }
    }
    if (file) {
      const filenamePrefix = Date.now();
      const extension = file.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(file.data, filename, file.mimetype);
      req.body.profilePic = filename;
    }
    await User.findByIdAndUpdate(req.user._id, req.body);
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, {});
  } catch (err) {
    return Helper.catchBlock(req, res, next, err);
  }
};
export const addOrUpdateAddress = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validateUser.updateAddressSchema, req.body, res))
      return;
    const { addressType, ...objToSave } = req.body;
    const result = await Address.findOneAndUpdate(
      { addressId: req.user._id, addressType },
      objToSave,
      { new: true, upsert: true }
    );
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, result);
  } catch (err) {
    console.log(err);
    Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiver: req.user._id,
      status: Constants.ACTIVE,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("sender", "_id first_name last_name profile_pic")
      .select("-__v -status -updatedAt -receiver");
    return Helper.successMsg(res, Constants.DATA_GET, notifications);
  } catch (err) {
    console.error(err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const deleteNotifications = async (req, res) => {
  try {
    const notifications = await Notification.deleteMany({
      _id: { $in: req.body.notification_ids },
    });
    return Helper.successMsg(res, Constants.DATA_DELETED, notifications);
  } catch (err) {
    Helper.catchBlock(req, res, null, err);
  }
};
export const follow = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validateUser.userIdSchema, req.body, res))
      return;
    const { userId } = req.body;
    const user = await User.findById(userId).select("followers").lean();
    console.log(user);
    const isAlreadyFollowing = user.followers?.some((usr) =>
      usr.userId.equals(req.user._id)
    );
    if (isAlreadyFollowing) {
      return Helper.successMsg(res, Constants.DATA_UPDATED, {});
    }
    const [followUser, followedUser] = await Promise.all([
      User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { followings: { userId: userId } } },
        {
          new: true,
        }
      ),
      User.findOneAndUpdate(
        { _id: userId },
        { $addToSet: { followers: { userId: req.user._id } } },
        { new: true }
      ),
    ]);
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, {});
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const unFollow = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validateUser.userIdSchema, req.body, res))
      return;
    const { userId } = req.body;
    const [followingUser, followedUser] = await Promise.all([
      User.findByIdAndUpdate(
        req.user._id,
        { $pull: { followings: { userId: userId } } },
        {
          new: true,
        }
      ),
      User.findOneAndUpdate(
        { _id: userId },
        { $pull: { followers: { userId: req.user._id } } },
        { new: true }
      ),
    ]);
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, {});
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const getReviews = async (req, res, next) => {
  try {
    // if (Helper.validateRequest(validateUser.userIdSchema, req.body, res))
    //   return;
    // const { userId } = req.body;
    const aggregate = [
      {
        $match: { userId: req.user._id },
      },
      {
        $lookup: {
          from: "users",
          localField: "reviewedId",
          foreignField: "_id",
          as: "reviewed",
          pipeline: [
            {
              $project: {
                name: 1,
                profilePic: 1,
              },
            },
          ],
        },
      },
    ];
    const result = await Review.aggregate(aggregate);
    return Helper.successMsg(res, Constants.DATA_FETCHED, result);
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const getFollowerList = async (req, res, next) => {
  try {
    if (
      Helper.validateRequest(validateUser.userIdSchemaOptional, req.query, res)
    )
      return;
    const { userId } = req.query;
    let match = userId ? userId : req.user._id;

    const result = await User.findById(match)
      .select("followers")
      .populate("followers.userId", "name profilePic");
    return Helper.successMsg(res, Constants.DATA_FETCHED, result);
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const getFollowingList = async (req, res, next) => {
  try {
    if (
      Helper.validateRequest(validateUser.userIdSchemaOptional, req.query, res)
    )
      return;
    const { userId } = req.query;
    let match = userId ? userId : req.user._id;

    const result = await User.findById(match)
      .select("followings")
      .populate("followings.userId", "name profilePic");
    return Helper.successMsg(res, Constants.DATA_FETCHED, result);
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const checkCoupon = async (req, res) => {
  if (Helper.validateRequest(validateUser.couponIdSchema, req.query, res))
    return;
  const { couponId } = req.query;
  const coupon = await validateCoupon(req, couponId);
  if(!coupon){
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
  if (!coupon.status) {
    return Helper.errorMsg(res, coupon.message, 200);
  }
  return Helper.successMsg(res, coupon.message, coupon.data);
};
export const makePayment = async (req, res) => {
  try {
    const { products } = req.body;
    const lineItems = products.map((product) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: product.name,
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: product.quantity,
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer: req.user._id,
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    return Helper.successMsg(res, "Payment made successfully", {
      id: session.id,
    });
  } catch (err) {
    Helper.catchBlock(req, res, null, err);
  }
};
export const getSavedCards = async (req, res) => {
  try {
    const customer = await stripe.customers.retrieve(req.user._id);
    const savedCards = customer.sources.data.filter(
      (source) => source.object === "card"
    );
    return Helper.successMsg(res, Constants.DATA_FETCHED, savedCards);
  } catch (err) {
    Helper.catchBlock(req, res, null, err);
  }
};
export const deleteSavedCard = async (req, res) => {
  try {
    const detachedPaymentMethod = await stripe.paymentMethods.detach(
      req.body.paymentMethodId
    );
    if (detachedPaymentMethod && detachedPaymentMethod.id === paymentMethodId) {
      return Helper.successMsg(res, Constants.DATA_DELETED, {});
    } else {
      return Helper.errorMsg(res, Constants.DATA_NOT_DELETED, 200);
    }
  } catch (err) {
    Helper.catchBlock(req, res, null, err);
  }
};
