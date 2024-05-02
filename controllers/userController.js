import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import * as Helper from "../services/HelperFunction.js";
import * as validateUser from "../services/SchemaValidate/userSchema.js";
import { Constants } from "../services/Constants.js";
import { Logs } from "../middleware/log.js";
import uploadToS3 from "../services/s3Services.js";
import Notification from "../models/notificationModel.js";
import { userCommonAggregation } from "../services/userService.js";
import mongoose from "mongoose";
import Address from "../models/addressModel.js";

export const changePassword = async (req, res, next) => {
  try {
    if (
      Helper.validateRequest(validateUser.changePasswordSchema, req.body, res)
    )
      return;
    const { old_password, new_password } = req.body;
    const hashedPassword = await bcrypt.hash(new_password, 10);
    const user = await User.findOne({
      email: req.user.email,
      role: { $eq: null },
    });

    if (user) {
      const is_correct_password = await bcrypt.compare(
        old_password,
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
        return Helper.errorMsg(res, Constants.INCORRECT_PASSWORD, 404);
      }
    } else {
      Logs(req, Constants.INCORRECT_PASSWORD, next);
      return Helper.errorMsg(res, Constants.INVALID_TOKEN, 401);
    }
  } catch (err) {
    console.log(err);
    Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
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
    if (Helper.validateRequest(validateUser.updateUserSchema, req.body, res))
      return;
    const file = req.files?.file;
    const cover_photo = req.files?.cover_photo;
    let url, cover_url;
    if (file) {
      const filenamePrefix = Date.now();
      const extension = file.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(file.data, filename, file.mimetype);
      url = filename;
    }
    if (cover_photo) {
      const filenamePrefix = Date.now();
      const extension = cover_photo.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(cover_photo.data, filename, cover_photo.mimetype);
      cover_url = filename;
    }
    await User.findByIdAndUpdate(req.user._id, {
      ...(file && { profile_pic: url }),
      ...(cover_photo && { cover_photo: cover_url }),
      ...req.body,
    });
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, {});
  } catch (err) {
    console.log(err);
    Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
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
