// import mongoose from "mongoose";
// import Notification from "../models/notificationModel.js";
// import Message from "../models/messageModel.js";
// import Request from "../models/requestModel.js";
// import User from "../models/userModel.js";
// import uploadToS3 from "../services/s3Services.js";
// import * as Helper from "../services/HelperFunction.js";
// import * as validatePost from "../services/SchemaValidate/userSchema.js";
// import { Logs } from "../middleware/log.js";
// import { Constants, SocketEvent } from "../services/Constants.js";
// import { Notifications } from "../middleware/notification.js";
// import { emitSocketEvent, onlineUsers } from "../socket.js";
// // import sightengine from "sightengine";
// import { sendPushNotification } from "../services/firebaseService.js";

// const messageCommonAggregation = () => {
//   return [
//     {
//       $lookup: {
//         from: "users",
//         foreignField: "_id",
//         localField: "sender_id",
//         as: "sender",
//         pipeline: [
//           {
//             $project: {
//               first_name: 1,
//               last_name: 1,
//               profile_pic: 1,
//               _id: 1,
//             },
//           },
//         ],
//       },
//     },
//     {
//       $addFields: {
//         sender: { $first: "$sender" },
//       },
//     },
//   ];
// };
// const sender = (req) => {
//   return {
//     _id: req.user._id,
//     name: req.user.first_name + " " + req.user.last_name,
//     profile_pic: req.user.profile_pic,
//   };
// };
// const chatCommonAggregation = () => {
//   return [
//     {
//       // lookup for the participants present
//       $lookup: {
//         from: "users",
//         foreignField: "_id",
//         localField: "users",
//         as: "participants",
//         pipeline: [
//           {
//             $project: {
//               password: 0,
//               createdAt: 0,
//               updatedAt: 0,
//               __v: 0,
//               status: 0,
//               blocked_user: 0,
//               email_verified: 0,
//             },
//           },
//         ],
//       },
//     },
//     {
//       // lookup for the group chats
//       $lookup: {
//         from: "messages",
//         foreignField: "_id",
//         localField: "last_message",
//         as: "last_message",
//         pipeline: [
//           {
//             // get details of the sender
//             $lookup: {
//               from: "users",
//               foreignField: "_id",
//               localField: "sender_id",
//               as: "sender",
//               pipeline: [
//                 {
//                   $project: {
//                     first_name: 1,
//                     last_name: 1,
//                     profile_pic: 1,
//                   },
//                 },
//               ],
//             },
//           },
//           {
//             $addFields: {
//               sender: { $first: "$sender" },
//             },
//           },
//         ],
//       },
//     },
//     {
//       $addFields: {
//         last_message: { $first: "$last_message" },
//       },
//     },
//   ];
// };
// export const sendFriendRequest = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.userIdSchema, req.body, res))
//       return;
//     const user = await User.findById(req.body.user_id);
//     if (!user) {
//       Logs(req, Constants.INVALID_ID, next);
//       return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//     }
//     const rqst = await Request.findOneAndUpdate(
//       {
//         from_user_id: req.user._id,
//         to_user_id: req.body.user_id,
//       },
//       { status: Constants.ACTIVE, sent_time: Date.now() },
//       { upsert: true }
//     );
//     Logs(req, Constants.REQUEST_SENT, next);
//     return Helper.successMsg(res, Constants.REQUEST_SENT, rqst);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const cancelFriendRequest = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.userIdSchema, req.body, res))
//       return;
//     const rqst = await Request.findOneAndUpdate(
//       {
//         from_user_id: req.body.user_id,
//         to_user_id: req.user._id,
//         status: Constants.ACTIVE,
//       },
//       { status: Constants.INACTIVE }
//     );
//     if (!rqst) {
//       Logs(req, Constants.INVALID_ID, next);
//       return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//     }
//     Logs(req, Constants.DATA_UPDATED, next);
//     return Helper.successMsg(res, Constants.DATA_UPDATED, rqst);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const cancelSentFriendRequest = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.userIdSchema, req.body, res))
//       return;
//     const rqst = await Request.findOneAndUpdate(
//       {
//         from_user_id: req.user._id,
//         to_user_id: req.body.user_id,
//         status: Constants.ACTIVE,
//       },
//       { status: Constants.INACTIVE }
//     );
//     if (!rqst) {
//       Logs(req, Constants.INVALID_ID, next);
//       return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//     }
//     Logs(req, Constants.DATA_UPDATED, next);
//     return Helper.successMsg(res, Constants.DATA_UPDATED, rqst);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const acceptFriendRequest = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.userIdSchema, req.body, res))
//       return;
//     const { user_id } = req.body;
//     const id = req.user._id;
//     const [user, rqst] = await Promise.all([
//       User.findById(user_id),
//       Request.findOneAndDelete({
//         from_user_id: user_id,
//         to_user_id: id,
//       }),
//     ]);
//     if (!user || !rqst || rqst.status === Constants.INACTIVE) {
//       Logs(req, Constants.INVALID_ID, next);
//       return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//     }
//     Promise.all([
//       User.findByIdAndUpdate(
//         id,
//         {
//           $addToSet: { my_network: { user_id: user_id } },
//         },
//         {
//           new: true,
//         }
//       ),
//       User.findByIdAndUpdate(
//         user_id,
//         {
//           $addToSet: { my_network: { user_id: id } },
//         },
//         {
//           new: true,
//         }
//       ),
//     ]);
//     Logs(req, Constants.DATA_SAVED, next);
//     const sender = {
//       _id: req.user._id,
//       name: req.user.first_name + " " + req.user.last_name,
//       profile_pic: req.user.profile_pic,
//     };
//     Notifications(
//       req,
//       sender,
//       user_id,
//       SocketEvent.ACCEPT_REQUEST_EVENT,
//       " accepted your friend request",
//       Constants.ACCEPT_REQUEST,
//       {}
//     );
//     return Helper.successMsg(res, Constants.DATA_SAVED, rqst);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getAllReciedFriendRequest = async (req, res) => {
//   try {
//     const aggregate = [
//       {
//         $match: {
//           to_user_id: req.user._id,
//           status: Constants.ACTIVE,
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "from_user_id",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       {
//         $unwind: {
//           path: "$user",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $addFields: {
//           first_name: "$user.first_name",
//           last_name: "$user.last_name",
//           profile_pic: "$user.profile_pic",
//         },
//       },
//       {
//         $project: {
//           updatedAt: 0,
//           createdAt: 0,
//           status: 0,
//           user: 0,
//           _id: 0,
//           __v: 0,
//           to_user_id: 0,
//         },
//       },
//       {
//         $sort: {
//           createdAt: -1,
//         },
//       },
//     ];
//     const rqst = await Request.aggregate(aggregate);
//     return Helper.successMsg(res, Constants.DATA_GET, rqst);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getAllSentFriendRequest = async (req, res) => {
//   try {
//     const aggregate = [
//       {
//         $match: {
//           from_user_id: req.user._id,
//           status: Constants.ACTIVE,
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "to_user_id",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       {
//         $unwind: {
//           path: "$user",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $addFields: {
//           first_name: "$user.first_name",
//           last_name: "$user.last_name",
//         },
//       },
//       {
//         $project: {
//           updatedAt: 0,
//           createdAt: 0,
//           status: 0,
//           user: 0,
//           _id: 0,
//           __v: 0,
//         },
//       },
//       {
//         $sort: {
//           createdAt: -1,
//         },
//       },
//     ];
//     const rqst = await Request.aggregate(aggregate);
//     return Helper.successMsg(res, Constants.DATA_GET, rqst);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// //Friends or Mynetwork section

// export const getAllFriends = async (req, res) => {
//   try {
//     // const aggregate = [
//     //   {
//     //     $match: {
//     //       _id: req.user._id,
//     //     },
//     //   },
//     //   {
//     //     $unwind: {
//     //       path: "$my_network",
//     //       preserveNullAndEmptyArrays: true,
//     //     },
//     //   },
//     //   {
//     //     $lookup: {
//     //       from: "users",
//     //       localField: "my_network.user_id",
//     //       foreignField: "_id",
//     //       as: "network",
//     //     },
//     //   },
//     //   {
//     //     $unwind: {
//     //       path: "$network",
//     //       preserveNullAndEmptyArrays: true,
//     //     },
//     //   },
//     //   {
//     //     $group: {
//     //       _id: "$_id",
//     //       networks: {
//     //         $push: {
//     //           user_id: "$network._id",
//     //           first_name: "$network.first_name",
//     //           last_name: "$network.last_name",
//     //           profile_pic: "$network.profile_pic",
//     //           time: "$my_network.time",
//     //         },
//     //       },
//     //     },
//     //   },
//     //   {
//     //     $project: {
//     //       _id: 0,
//     //     },
//     //   },
//     // ];
//     const searchTerm = req.query.search || "";

//     // console.log("searchTerm",searchTerm);

//     const aggregate = [
//       {
//         $match: {
//           _id: req.user._id,
//         },
//       },
//       {
//         $unwind: {
//           path: "$my_network",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "my_network.user_id",
//           foreignField: "_id",
//           as: "network",
//         },
//       },
//       {
//         $unwind: {
//           path: "$network",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $match: {
//           $or: [
//             { "network.first_name": { $regex: searchTerm, $options: "i" } }, // Case-insensitive regex match for first name
//             { "network.last_name": { $regex: searchTerm, $options: "i" } }, // Case-insensitive regex match for last name
//             { "network.email": { $regex: searchTerm, $options: "i" } }, // Case-insensitive regex match for email
//           ],
//         },
//       },
//       {
//         $group: {
//           _id: "$_id",
//           networks: {
//             $push: {
//               user_id: "$network._id",
//               first_name: "$network.first_name",
//               last_name: "$network.last_name",
//               profile_pic: "$network.profile_pic",
//               time: "$my_network.time",
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//         },
//       },
//     ];

//     const users = await User.aggregate(aggregate);
//     return Helper.successMsg(res, Constants.DATA_GET, users);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const removeFriends = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.userIdSchema, req.body, res))
//       return;
//     const { user_id } = req.body;
//     console.log(req.user._id, user_id);
//     const [users, other_user] = await Promise.all([
//       User.findByIdAndUpdate(
//         req.user._id,
//         {
//           $pull: {
//             my_network: { user_id: user_id },
//           },
//         },
//         { new: true }
//       ),
//       User.findByIdAndUpdate(
//         user_id,
//         {
//           $pull: {
//             my_network: { user_id: req.user._id },
//           },
//         },
//         { new: true }
//       ),
//     ]);
//     if (!users || !other_user) {
//       Logs(req, Constants.INVALID_ID, next);
//       return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//     }
//     Logs(req, Constants.DATA_DELETED, next);
//     return Helper.successMsg(res, Constants.DATA_DELETED, {});
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const blockFriends = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.userIdSchema, req.body, res))
//       return;
//     const { user_id } = req.body;
//     const users = await User.findByIdAndUpdate(req.user._id, {
//       $pull: {
//         my_network: { user_id: user_id },
//       },
//       $addToSet: {
//         blocked_user: { user_id: user_id },
//       },
//     });
//     if (!users) {
//       Logs(req, Constants.INVALID_ID, next);
//       return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//     }
//     Logs(req, Constants.DATA_DELETED, next);
//     return Helper.successMsg(res, Constants.DATA_DELETED, users);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const unBlockUser = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.userIdSchema, req.body, res))
//       return;
//     const { user_id } = req.body;
//     const users = await User.findByIdAndUpdate(req.user._id, {
//       $pull: {
//         blocked_user: { user_id: user_id },
//       },
//     });
//     if (!users) {
//       Logs(req, Constants.INVALID_ID, next);
//       return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//     }
//     Logs(req, Constants.DATA_DELETED, next);
//     return Helper.successMsg(res, Constants.DATA_DELETED, users);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// //Group Section

// export const createGroup = async (req, res, next) => {
//   try {
//     const { user_id, ...rest } = req.body;
//     let obj;
//     console.log(user_id);
//     if (user_id) {
//       obj = {
//         user_id: JSON.parse(user_id),
//         ...rest,
//       };
//     } else {
//       obj = {
//         user_id: [],
//         ...rest,
//       };
//     }
//     if (Helper.validateRequest(validatePost.groupSchema, obj, res)) return;
//     let file;
//     let group_icon;
//     if (req.files?.file) {
//       file = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
//     } else {
//       file = null;
//     }
//     if (req.files?.group_icon) {
//       group_icon = Array.isArray(req.files.group_icon)
//         ? req.files.group_icon
//         : [req.files.group_icon];
//     } else {
//       group_icon = null;
//     }
//     let url;
//     let icon_url;
//     if (file && file.length > 0) {
//       url = await Promise.all(
//         file.map(async (item) => {
//           const filenamePrefix = Date.now();
//           const extension = item.name.split(".").pop();
//           const filename = filenamePrefix + "." + extension;
//           await uploadToS3(item.data, filename, item.mimetype);
//           return { filename, type: item.mimetype.split("/")[0]?.toUpperCase() };
//         })
//       );
//     }
//     if (group_icon && group_icon.length > 0) {
//       icon_url = await Promise.all(
//         group_icon.map(async (item) => {
//           const filenamePrefix = Date.now();
//           const extension = item.name.split(".").pop();
//           const filename = filenamePrefix + "." + extension;
//           await uploadToS3(item.data, filename, item.mimetype);
//           return filename;
//         })
//       );
//     }
//     const group = await Group.create({
//       school_id:req.user.school_id,
//       name: obj.name,
//       description: obj.description,
//       users: [req.user._id],
//       pending_invite: [...obj.user_id],
//       admin: [req.user._id],
//       media: url,
//       ...(icon_url && icon_url.length > 0 && { group_icon: icon_url[0] }),
//     });
//     if (!group) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 404);
//     }
//     Logs(req, Constants.DATA_SAVED, next);
//     const sender = {
//       _id: req.user._id,
//       name: req.user.first_name + " " + req.user.last_name,
//       profile_pic: req.user.profile_pic,
//     };
//     obj.user_id.forEach((participantObjectId) => {
//       if (participantObjectId.toString() === req.user._id.toString()) return;
//       Notifications(
//         req,
//         sender,
//         participantObjectId,
//         SocketEvent.GROUP_MEMBER_ADDED,
//         ` is added to ${obj.name} group`,
//         Constants.GROUP_MEMBER_ADDED,
//         group
//       );
//     });
//     return Helper.successMsg(res, Constants.DATA_SAVED, group);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateGroup = async (req, res, next) => {
//   try {
//     const { group_id, user_id, ...rest } = req.body;
//     let obj;
//     if (user_id) {
//       obj = {
//         user_id: JSON.parse(user_id),
//         group_id,
//         ...rest,
//       };
//     } else {
//       obj = {
//         user_id: [],
//         group_id,
//         ...rest,
//       };
//     }
//     if (Helper.validateRequest(validatePost.updateGroupSchema, obj, res))
//       return;
//     const participantsIds = await Group.findById(group_id).select(
//       "users admin -_id"
//     );
//     if (!participantsIds.admin.includes(req.user._id)) {
//       return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
//     }
//     let file;
//     if (req.files?.file) {
//       file = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
//     } else {
//       file = null;
//     }
//     let url;
//     if (file && file.length > 0) {
//       url = await Promise.all(
//         file.map(async (item) => {
//           const filenamePrefix = Date.now();
//           const extension = item.name.split(".").pop();
//           const filename = filenamePrefix + "." + extension;
//           await uploadToS3(item.data, filename, item.mimetype);
//           return { filename, type: item.mimetype.split("/")[0]?.toUpperCase() };
//         })
//       );
//     }

//     const pendingIds = obj.user_id.filter(
//       (item) => !participantsIds.users.includes(item)
//     );
//     const usersId = [
//       req.user._id,
//       ...obj.user_id.filter((item) => !pendingIds.includes(item)),
//     ];
//     const group = await Group.findByIdAndUpdate(
//       group_id,
//       {
//         name: obj.name,
//         description: obj.description,
//         ...(obj.notification_muted === true && {
//           $addToSet: { notification_muted: req.user._id },
//         }),
//         ...(obj.notification_muted === false && {
//           $pull: { notification_muted: req.user._id },
//         }),
//         ...(user_id &&
//           pendingIds &&
//           pendingIds.length > 0 && {
//             $addToSet: { pending_invite: { $each: pendingIds } },
//           }),
//         ...(user_id &&
//           usersId &&
//           usersId.length > 0 && {
//             $set: { users: [...new Set(usersId)] },
//           }),
//         ...(obj.admin && { admin: [req.user._id] }),
//         ...(url && url.length > 0 && { media: url }),
//       },
//       { new: true }
//     );
//     if (!group) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 404);
//     }
//     Logs(req, Constants.DATA_SAVED, next);
//     const chats = await Group.aggregate([
//       {
//         $match: {
//           _id: new mongoose.Types.ObjectId(group_id),
//         },
//       },
//       ...chatCommonAggregation(),
//     ]);
//     const sender = {
//       _id: req.user._id,
//       name: req.user.first_name + " " + req.user.last_name,
//       profile_pic: req.user.profile_pic,
//     };
//     pendingIds.forEach((participantObjectId) => {
//       if (participantObjectId.toString() === req.user._id.toString()) return;
//       Notifications(
//         req,
//         sender,
//         participantObjectId,
//         SocketEvent.GROUP_MEMBER_ADDED,
//         ` is added to ${group.name} group`,
//         Constants.GROUP_MEMBER_ADDED,
//         group
//       );
//     });
//     return Helper.successMsg(res, Constants.DATA_SAVED, chats);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteChat = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.deleteChatSchema, req.body, res))
//       return;
//     const { group_id, type } = req.body;
//     const group = await Group.findByIdAndUpdate(
//       group_id,
//       {
//         ...(type === "DELETE" && { $addToSet: { deleted_by: req.user._id } }),
//         ...(type === "EXIT" && { $pull: { users: req.user._id } }),
//       },
//       { new: true }
//     );
//     if (!group) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 404);
//     }
//     Logs(req, Constants.DATA_SAVED, next);
//     return Helper.successMsg(res, Constants.DATA_SAVED, group);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getGroupMembers = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validatePost.groupIdSchema, req.query, res))
//       return;
//     const members = await Group.findById(req.query.group_id)
//       .populate("admin", "_id first_name last_name")
//       .populate("users", "_id first_name last_name")
//       .select("-__v -createdAt -updatedAt -status");
//     return Helper.successMsg(res, Constants.DATA_GET, members);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getAllGroups = async (req, res) => {
//   try {
//     const page = req.query.page || 1;
//     const limit = 9;
//     const skip = (page - 1) * limit;
//     const members = await Group.find({
//       $or: [{ users: { $in: req.user._id } }, { admin: { $in: req.user._id } }],
//       status: Constants.ACTIVE,
//       is_group_chat: true,
//     })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate("users", "_id first_name last_name profile_pic");
//     return Helper.successMsg(res, Constants.DATA_GET, members);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getAllChats = async (req, res) => {
//   const chats = await Group.aggregate([
//     {
//       $match: {
//         status: Constants.ACTIVE,
//         $and: [
//           {
//             users: { $elemMatch: { $eq: req.user._id } },
//           },
//           { deleted_by: { $nin: [req.user._id] } },
//         ],
//       },
//     },
//     {
//       $sort: {
//         updatedAt: -1,
//       },
//     },
//     ...chatCommonAggregation(),
//   ]);

//   return Helper.successMsg(res, Constants.DATA_GET, chats);
// };
// // export const getAllChats = async (req, res) => {
// //   try {
// //     const members = await Group.find({
// //       $or: [{ users: { $in: req.user._id } }, { admin: { $in: req.user._id } }],
// //       status: Constants.ACTIVE
// //     })
// //       .populate("users", "_id first_name last_name profile_pic")
// //       .populate("last_message", "_id message media");
// //     return Helper.successMsg(res, Constants.DATA_GET, members);
// //   } catch (err) {
// //     console.log(err);
// //     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
// //   }
// // };
// export const deleteGroup = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validatePost.groupIdSchema, req.body, res))
//       return;
//     const members = await Group.findByIdAndUpdate(req.body.group_id, {
//       status: Constants.INACTIVE,
//     });
//     return Helper.successMsg(res, Constants.DATA_DELETED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const sendMessage = async (req, res) => {
//   try {
//     let obj;
//     const message_files = req.files?.message_file;
//     if (message_files) {
//       obj = {
//         message_file: message_files.data,
//         ...req.body,
//       };
//     } else {
//       obj = req.body;
//     }
//     if (Helper.validateRequest(validatePost.chatSchema, obj, res)) return;
//     const { group_id, message_text } = obj;
//     const selectedChat = await Group.findById(group_id);
//     if (!selectedChat) {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//     } else if (
//       !selectedChat.is_group_chat &&
//       selectedChat.deleted_by.length === 1
//     ) {
//       const deletedUserId = selectedChat.deleted_by[0];
//       console.log(56, deletedUserId);
//       await Group.findByIdAndUpdate(group_id, {
//         $pull: { deleted_by: deletedUserId },
//       });
//     }
//     let file;
//     if (message_files) {
//       file = Array.isArray(message_files) ? message_files : [message_files];
//     } else {
//       file = null;
//     }
//     let url;
//     if (file && file.length > 0) {
//       url = await Promise.all(
//         file.map(async (item) => {
//           const filenamePrefix = Date.now();
//           const extension = item.name.split(".").pop();
//           let type = "";
//           if (item.mimetype.startsWith("image")) {
//             type = "IMAGE";
//           } else if (item.mimetype.startsWith("video")) {
//             type = "VIDEO";
//           } else {
//             type = extension.toUpperCase();
//           }
//           const filename = filenamePrefix + "." + extension;
//           await uploadToS3(item.data, filename, item.mimetype);
//           return { filename, type };
//         })
//       );
//     }

//     // Create a new message instance with appropriate metadata
//     const links = Helper.extractUrls(message_text);
//     const message = await Message.create({
//       sender_id: req.user._id,
//       message: message_text,
//       links: links,
//       group_id: group_id,
//       media: url,
//     });

//     // update the chat's last message which could be utilized to show last message in the list item
//     const chat = await Group.findByIdAndUpdate(
//       group_id,
//       {
//         $set: {
//           last_message: message._id,
//         },
//       },
//       { new: true }
//     );
//     const onlineusers = Array.from(onlineUsers);
//     const setB = new Set(onlineusers);

//     const updatedUsersId = chat.users.filter(
//       (item) => !setB.has(item.toString())
//     );
//     if (updatedUsersId.length > 0) {
//       await User.updateMany(
//         { _id: { $in: updatedUsersId } },
//         {
//           $addToSet: { unread_messages: chat._id },
//         }
//       );
//     }
//     // structure the message
//     const messages = await Message.aggregate([
//       {
//         $match: {
//           _id: new mongoose.Types.ObjectId(message._id),
//         },
//       },
//       ...messageCommonAggregation(),
//     ]);
//     // Store the aggregation result
//     const receivedMessage = messages[0];

//     if (!receivedMessage) {
//       return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 400);
//     }
//     const sender = {
//       _id: req.user._id,
//       name: req.user.first_name + " " + req.user.last_name,
//       profile_pic: req.user.profile_pic,
//     };
//     // logic to emit socket event about the new message created to the other participants
//     chat.users.forEach(async (participantObjectId) => {
//       // here the chat is the raw instance of the chat in which participants is the array of object ids of users
//       // avoid emitting event to the user who is sending the message
//       if (participantObjectId.toString() === req.user._id.toString()) return;

//       // emit the receive message event to the other participants with received message as the payload
//       // if (!selectedChat.notification_muted) {
//       //   Notifications(
//       //     req,
//       //     sender,
//       //     participantObjectId,
//       //     SocketEvent.NEW_MESSAGE_EVENT,
//       //     " messaged you",
//       //     Constants.NEW_MESSAGE,
//       //     receivedMessage
//       //   );
//       // } else {
//       console.log(participantObjectId);
//       const unread_msg = await User.findById(participantObjectId)
//         .select("unread_messages -_id")
//         .lean();
//       console.log(unread_msg);
//       receivedMessage.unread_messages = unread_msg.unread_messages;
//       console.log(receivedMessage);
//       emitSocketEvent(
//         req,
//         participantObjectId.toString(),
//         SocketEvent.NEW_MESSAGE_EVENT,
//         receivedMessage,
//         sender
//       );
//       // }
//     });
//     return Helper.successMsg(res, Constants.DATA_SAVED, receivedMessage);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getMessages = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validatePost.groupIdSchema, req.query, res))
//       return;
//     const { group_id, page } = req.query;

//     const selectedChat = await Group.findById(group_id);

//     if (!selectedChat) {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//     }

//     // Only get messages if the logged in user is a part of the chat he is requesting messages of
//     if (!selectedChat.users?.includes(req.user?._id)) {
//       return Helper.errorMsg(res, Constants.NOT_EXIST_GROUP, 400);
//     }
//     const limit = 10;
//     const skip = page - 1 * limit || 0;
//     const messages = await Message.aggregate([
//       {
//         $match: {
//           group_id: new mongoose.Types.ObjectId(group_id),
//         },
//       },
//       {
//         $sort: {
//           createdAt: -1,
//         },
//       },
//       {
//         $skip: skip,
//       },
//       {
//         $limit: limit,
//       },
//       ...messageCommonAggregation(),
//       {
//         $sort: {
//           createdAt: 1,
//         },
//       },
//     ]);

//     return Helper.successMsg(res, Constants.DATA_GET, messages);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteMessage = async (req, res) => {};
// export const createOrGetAOneOnOneChat = async (req, res) => {
//   if (Helper.validateRequest(validatePost.userIdSchema, req.body, res)) return;
//   const { user_id } = req.body;
//   const receiver = await User.findById(user_id);
//   if (!receiver) {
//     return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//   }
//   if (receiver._id.toString() === req.user._id.toString()) {
//     return Helper.errorMsg(res, Constants.CANNOT_CHAT_YOURSELF, 400);
//   }

//   const chat = await Group.aggregate([
//     {
//       $match: {
//         is_group_chat: false, // avoid group chats. This controller is responsible for one on one chats
//         // Also, filter chats with participants having receiver and logged in user only
//         $and: [
//           {
//             users: { $elemMatch: { $eq: req.user._id } },
//           },
//           {
//             users: {
//               $elemMatch: { $eq: new mongoose.Types.ObjectId(user_id) },
//             },
//           },
//         ],
//       },
//     },
//     ...chatCommonAggregation(),
//   ]);

//   if (chat.length) {
//     // if we find the chat that means user already has created a chat
//     return Helper.successMsg(res, Constants.CHAT_RETRIEVED, chat[0]);
//   }

//   // if not we need to create a new one on one chat
//   const newChatInstance = await Group.create({
//     name: "One on one chat",
//     users: [req.user._id, new mongoose.Types.ObjectId(user_id)], // add receiver and logged in user as participants
//     admin: [req.user._id],
//     is_group_chat: false,
//   });

//   // structure the chat as per the common aggregation to keep the consistency
//   const createdChat = await Group.aggregate([
//     {
//       $match: {
//         _id: newChatInstance._id,
//       },
//     },
//     ...chatCommonAggregation(),
//   ]);

//   const payload = createdChat[0]; // store the aggregation result

//   if (!payload) {
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }

//   // logic to emit socket event about the new chat added to the participants
//   payload?.users?.forEach((participant) => {
//     if (participant._id.toString() === req.user._id.toString()) return; // don't emit the event for the logged in use as he is the one who is initiating the chat

//     // emit event to other participants with new chat as a payload
//     Notifications(
//       req,
//       sender(req),
//       participant._id,
//       SocketEvent.NEW_CHAT_EVENT,
//       " created a chat",
//       Constants.NEW_CHAT_CREATED,
//       payload
//     );
//   });
//   return Helper.successMsg(res, Constants.DATA_GET, payload);
// };
// export const getMediaAndLinksOFGroup = async (req, res) => {
//   try {
//     const { group_id } = req.query;
//     const pipeline = [
//       { $match: { group_id: new mongoose.Types.ObjectId(group_id) } },
//       {
//         $project: {
//           _id: 0,
//           media: 1,
//           links: 1,
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           media: { $push: "$media" },
//           links: { $push: "$links" },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           media: {
//             $reduce: {
//               input: "$media",
//               initialValue: [],
//               in: { $concatArrays: ["$$value", "$$this"] },
//             },
//           },
//           links: {
//             $reduce: {
//               input: "$links",
//               initialValue: [],
//               in: { $concatArrays: ["$$value", "$$this"] },
//             },
//           },
//         },
//       },
//     ];
//     const media = await Message.aggregate(pipeline);
//     return Helper.successMsg(res, Constants.DATA_GET, media[0]);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// export const acceptGroupRequest = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.groupRequestSchema, req.body, res))
//       return;
//     const { group_id, notification_id } = req.body;
//     const id = req.user._id;
//     const [group, rqst] = await Promise.all([
//       Group.findByIdAndUpdate(group_id, {
//         $addToSet: { users: id },
//         $pull: { pending_invite: id },
//       }),
//       Notification.findByIdAndDelete(notification_id),
//     ]);
//     if (!group || !rqst) {
//       Logs(req, Constants.INVALID_ID, next);
//       return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//     }
//     Logs(req, Constants.DATA_SAVED, next);
//     const sender = {
//       _id: req.user._id,
//       name: req.user.first_name + " " + req.user.last_name,
//       profile_pic: req.user.profile_pic,
//     };
//     Notifications(
//       req,
//       sender,
//       group.admin[0],
//       SocketEvent.ACCEPT_REQUEST_EVENT,
//       " accepted your group join request",
//       Constants.ACCEPT_REQUEST,
//       {}
//     );
//     const user = await User.findById(group.admin[0]);
//     console.log(55, user.device_token);
//     sendPushNotification(user.device_token, {
//       title: "BriddG",
//       body: `${
//         req.user.first_name + " " + req.user.last_name
//       } accepted group join request`,
//     });
//     return Helper.successMsg(res, Constants.DATA_SAVED, rqst);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const rejectGroupRequest = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.groupRequestSchema, req.body, res))
//       return;
//     const { group_id, notification_id } = req.body;
//     const id = req.user._id;
//     const [user, rqst] = await Promise.all([
//       Group.findByIdAndUpdate(group_id, {
//         $pull: { pending_invite: id },
//       }),
//       Notification.findByIdAndDelete(notification_id),
//     ]);
//     if (!user || !rqst) {
//       Logs(req, Constants.INVALID_ID, next);
//       return Helper.errorMsg(res, Constants.INVALID_ID, 404);
//     }
//     Logs(req, Constants.DATA_SAVED, next);
//     // const sender = {
//     //   _id: req.user._id,
//     //   name: req.user.first_name + " " + req.user.last_name,
//     //   profile_pic: req.user.profile_pic,
//     // };
//     // Notifications(
//     //   req,
//     //   sender,
//     //   user.admin[0],
//     //   SocketEvent.ACCEPT_REQUEST_EVENT,
//     //   " accepted your group join request",
//     //   Constants.ACCEPT_REQUEST,
//     //   {}
//     // );
//     return Helper.successMsg(res, Constants.DATA_SAVED, rqst);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getUnreadMessages = async (req, res) => {
//   try {
//     const unreadMsg = await User.findById(req.user._id)
//       .select("unread_messages")
//       .lean();
//     return Helper.successMsg(
//       res,
//       Constants.DATA_GET,
//       unreadMsg.unread_messages
//     );
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateUnreadMessages = async (req, res, next) => {
//   try {
//     const { group_id, reset } = req.body;
//     let updateQuery;

// if (!reset) {
//   updateQuery = {
//     $addToSet: { unread_messages: group_id }
//   };
// } else {
//   updateQuery = {
//     $set: { unread_messages: [] }
//   };
// }
//     const unreadMsg = await User.findByIdAndUpdate(req.user._id,updateQuery);
//     Logs(req, Constants.DATA_UPDATED, next);
//     return Helper.successMsg(res, Constants.DATA_UPDATED, {});
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
