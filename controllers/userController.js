import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcrypt";
import * as Helper from "../services/HelperFunction.js";
import * as validateUser from "../services/SchemaValidate/userSchema.js";
import { Constants } from "../services/Constants.js";
import { Logs } from "../middleware/log.js";
import { findMutualFriends } from "../services/userService.js";
import uploadToS3 from "../services/s3Services.js";
import Notification from "../models/notificationModel.js";
import { userCommonAggregation } from "../services/userService.js";
import mongoose from "mongoose";


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
    const user_id = req.user._id;
    const other_user_id = req.query.user_id;
    const page = req.query.page || 1;
    const limit = 10;
    const match_id = other_user_id ? other_user_id : user_id;
    const [users, post_count, request, other_users, post] = await Promise.all([
      // User.findOne({ _id: user_id })
      //   .populate("my_network.user_id", "_id first_name last_name profile_pic")
      //   .populate(
      //     "blocked_user.user_id",
      //     "_id first_name last_name profile_pic"
      //   ).populate("role","role")
      //   .select("-__v -createdAt -updatedAt -status -email_verified -password"),
      User.aggregate([{$match:{_id:new mongoose.Types.ObjectId(user_id)}},...userCommonAggregation("profile")]),
      Post.countDocuments({ posted_by: match_id, status: Constants.ACTIVE }),
      !other_user_id &&
        Request.find({ to_user_id: user_id, status: Constants.ACTIVE })
          .populate("from_user_id", "_id first_name last_name profile_pic ")
          .then(async (rqst) => {
            let obj;
            const result = await Promise.all(
              rqst.map(async (frnd) => {
                const mutual_friends = await findMutualFriends(
                  req.user._id,
                  frnd.from_user_id
                );
                obj = {
                  request: frnd,
                  mutual_friends,
                };
                return obj;
              })
            );
            return result;
          }),
      other_user_id &&
        User.findOne({ _id: other_user_id })
          .populate(
            "my_network.user_id",
            "_id first_name last_name profile_pic"
          )
          .populate("role", "_id role")
          .populate("blocked_user", "_id first_name last_name profile_pic")
          .select(
            "-__v -createdAt -updatedAt -status -email_verified -password"
          )
          .lean(),
      other_user_id &&
        Post.find({ posted_by: other_user_id, status: Constants.ACTIVE })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("likes", "_id first_name last_name profile_pic")
          .populate("shares", "_id first_name last_name profile_pic")
          .select("-__v -createdAt -updatedAt -status -report")
          .lean(),
    ]);

    let mutualFriends, result;
    if (other_user_id) {
      // const usersFriendIds = users.my_network.map((friend) =>{
      //   return friend.user_id
      // }
      // );
      // const otherUsersFriendIds = other_users.my_network.map((friend) =>
      //   friend.user_id
      // );
      // console.log({usersFriendIds,otherUsersFriendIds})
      // const mutualFriendIds = usersFriendIds.filter((id) =>
      //   otherUsersFriendIds.includes(id)
      // );
      // mutualFriends = users.my_network.filter((friend) =>
      //   mutualFriendIds.includes(friend._id.toString())
      // );
      mutualFriends = await findMutualFriends(user_id, other_user_id);
      mutualFriends = await Promise.all(
        mutualFriends.map(async (friend) => {
          const result = await findMutualFriends(user_id, friend.user_id._id);
          friend.user_id.mutual_friends = result ? result : [];
          return friend;
        })
      );
      const count = post.length;
      result = {
        user_details: other_users,
        mutual_friends: mutualFriends,
        posts: post,
        // has_next_page: limit * page < count,
        // next_page: page + 1,
        // has_previous_page: page > 1,
        // previous_page: page - 1,
        // last_page: Math.ceil(count / limit),
        // current_page: page,
      };
    }

    return Helper.successMsg(
      res,
      Constants.DATA_GET,
      other_user_id ? result : { users:users[0], post_count, request }
    );
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
    console.error(err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};

