// import User from "../models/userModel.js";
// import Post from "../models/postModel.js";
// import Comment from "../models/commentModel.js";
// import Role from "../models/roleAndPermissionModel.js";
// import Otp from "../models/otpModel.js";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import * as Helper from "../services/HelperFunction.js";
// import * as validateUser from "../services/SchemaValidate/userSchema.js";
// import * as validate from "../services/SchemaValidate/adminSchema.js";
// import { Constants } from "../services/Constants.js";
// import Sib from "sib-api-v3-sdk";
// import mongoose from "mongoose";
// import Privacy from "../models/privacyModel.js";
// import { OtpMailTemplate } from "../services/emailTemplate.js";
// import Message from "../models/messageModel.js";
// import RoleModule from "../models/roleModuleModel.js";
// import { textModeration } from "../services/userService.js";
// import FaqCategory from "../models/faqCategoryModel.js";
// import Faq from "../models/faqModel.js";
// import Resource from "../models/resourceModel.js";

// //AUTH ROUTE
// export const authUser = (obj) => {
//   return jwt.sign(obj, process.env.JWT_SECRET);
// };
// export const signin = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validateUser.loginSchema, req.body, res)) return;
//     const { email, password } = req.body;
//     const otp = Helper.generateOTP();
//     const usr = await User.findOne({
//       email: email.toLowerCase(),
//       status: Constants.ACTIVE,
//     })
//       .populate("role", "role")
//       .lean();
//     if (!usr) {
//       return Helper.warningMsg(res, Constants.EMAIL_NOT_EXIST);
//     } else if (usr && (usr.role?.role === "user" || !usr.role?.role)) {
//       return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
//     } else {
//       const result = await bcrypt.compare(password, usr.password);
//       if (!result) {
//         return Helper.warningMsg(res, Constants.INCORRECT_PASSWORD);
//       } else {
//         const result = await Otp.findOneAndUpdate(
//           { user_id: usr._id },
//           { is_active: true, otp },
//           { upsert: true }
//         );
//         if (!result)
//           return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 404);
//         const mail = OtpMailTemplate(otp);
//         await Helper.sendEmail(email, mail, "Login OTP");
//         usr.token = authUser(usr);
//         return Helper.successMsg(res, Constants.OTP_SENT, usr);
//       }
//     }
//   } catch (err) {
//     console.error(err);
//     return res
//       .status(500)
//       .json({ Error: err, message: "Something went wrong" });
//   }
// };
// export const verifyOTP = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validateUser.verifyOtpSchema, req.body, res))
//       return;
//     const { email, otp } = req.body;
//     const user = await User.findOne({ email: email.toLowerCase() });
//     const permissions = await Role.findById(user.role).select(
//       "role permissions"
//     );
//     if (user) {
//       const result = await Otp.findOneAndUpdate(
//         {
//           user_id: user._id,
//           otp: otp,
//           is_active: true,
//         },
//         { is_active: false }
//       );
//       if (!result) {
//         return Helper.warningMsg(res, Constants.INVALID_OTP);
//       }
//       return Helper.successMsg(res, Constants.LOGIN_SUCCESS, {
//         user,
//         permissions,
//       });
//     } else {
//       return Helper.warningMsg(res, Constants.EMAIL_NOT_EXIST);
//     }
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, err, 500);
//   }
// };
// export const forgotPassword = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validateUser.forgotSchema, req.body, res))
//       return;
//     const { email } = req.body;
//     const otp = Helper.generateOTP();
//     const user = await User.findOne({
//       email: email.toLowerCase(),
//     });
//     if (user) {
//       const client = Sib.ApiClient.instance;
//       var apiKey = client.authentications["api-key"];
//       apiKey.apiKey = process.env.EMAIL_API_KEY;

//       const tranEmailApi = new Sib.TransactionalEmailsApi();
//       const sender = {
//         email: "sumitkumarindiit@gmail.com",
//         name: "BriddG",
//       };
//       const receivers = [
//         {
//           email: user.email,
//         },
//       ];
//       await Promise.all([
//         tranEmailApi.sendTransacEmail({
//           sender,
//           to: receivers,
//           subject: "Reset Password Otp",
//           htmlContent: `<p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>`,
//         }),
//         Forgot.findOneAndUpdate(
//           { user_id: user._id },
//           {
//             verification_string: otp,
//             user_id: user._id,
//             status: Constants.ACTIVE,
//           },
//           { upsert: true, new: true }
//         ),
//       ]);
//       return Helper.successMsg(res, Constants.EMAIL_SENT, user);
//     } else {
//       return Helper.errorMsg(res, Constants.EMAIL_NOT_EXIST, 404);
//     }
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, err, 500);
//   }
// };
// export const resetPassword = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.resetSchema, req.body, res)) return;
//     const { verification_string, email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 400);
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const forgot = await Forgot.findOneAndUpdate(
//       {
//         verification_string,
//         user_id: user._id,
//         status: Constants.INACTIVE,
//         is_active: true,
//       },
//       { is_active: false }
//     );
//     if (!forgot) return Helper.errorMsg(res, Constants.INVALID_OTP, 404);
//     await User.findByIdAndUpdate(forgot.user_id, {
//       password: hashedPassword,
//     });
//     return Helper.successMsg(res, Constants.PASSWORD_CHANGED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const changePassword = async (req, res, next) => {
//   try {
//     if (
//       Helper.validateRequest(validateUser.changePasswordSchema, req.body, res)
//     )
//       return;
//     const { old_password, new_password } = req.body;
//     const hashedPassword = await bcrypt.hash(new_password, 10);
//     const user = await User.findOne({ email: req.user.email });
//     if (user) {
//       const is_correct_password = await bcrypt.compare(
//         old_password,
//         user.password
//       );
//       if (is_correct_password) {
//         await User.findByIdAndUpdate(user._id, {
//           password: hashedPassword,
//         });
//         return Helper.successMsg(res, Constants.PASSWORD_CHANGED, {});
//       } else {
//         return Helper.errorMsg(res, Constants.INCORRECT_PASSWORD, 404);
//       }
//     } else {
//       return Helper.errorMsg(res, Constants.INVALID_TOKEN, 401);
//     }
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const resendOtp = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validateUser.emailSchema, req.body, res)) return;
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (user) {
//       const otp = Helper.generateOTP();
//       const result = await Otp.findOneAndUpdate({ user_id: user._id }, { otp });
//       const mail = OtpMailTemplate(otp);
//       await Helper.sendEmail(email, mail, "Forgot Password OTP");
//       if (result) {
//         return Helper.successMsg(res, Constants.OTP_SENT, {});
//       } else {
//         return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 404);
//       }
//     } else {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 401);
//     }
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const resendForgotOtp = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validateUser.emailSchema, req.body, res)) return;
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (user) {
//       const otp = Helper.generateOTP();
//       const result = await Forgot.findOneAndUpdate(
//         { user_id: user._id },
//         { verification_string: otp }
//       );
//       const mail = OtpMailTemplate(otp);
//       await Helper.sendEmail(email, mail, "Login OTP");
//       if (result) {
//         return Helper.successMsg(res, Constants.OTP_SENT, {});
//       } else {
//         return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 404);
//       }
//     } else {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 401);
//     }
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const verifyForgotOTP = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validateUser.verifyOtpSchema, req.body, res))
//       return;
//     const { email, otp } = req.body;
//     const user = await User.findOne({
//       email: email.toLowerCase(),
//     });
//     if (user) {
//       const result = await Forgot.findOneAndUpdate(
//         {
//           user_id: user._id,
//           verification_string: otp,
//           status: Constants.ACTIVE,
//         },
//         { status: Constants.INACTIVE, is_active: true }
//       );
//       if (!result) {
//         return Helper.warningMsg(res, Constants.INVALID_OTP);
//       }
//       return Helper.successMsg(res, Constants.OTP_VERIFIED, {});
//     } else {
//       return Helper.warningMsg(res, Constants.EMAIL_NOT_EXIST);
//     }
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, err, 500);
//   }
// };

// //USER ROUTE
// export const getProfile = async (req, res) => {
//   try {
//     const user_id = req.user._id;
//     const users = await User.findById(user_id).select(
//       "-__v -createdAt -updatedAt -status -email_verified -password"
//     );
//     const permissions = await Role.findById(users.role).select(
//       "role permissions"
//     );
//     return Helper.successMsg(res, Constants.DATA_GET, { users, permissions });
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getUserList = async (req, res) => {
//   try {
//     const { sort, filter, role, user_id } = req.query;
//     let projectOption = {
//       _id: 1,
//       first_name: 1,
//       last_name: 1,
//       profile_pic: 1,
//       email: 1,
//       status: 1,
//       role: 1,
//       createdAt: 1,
//       phone_number: 1,
//     };
//     let match = {
//       "role.role": { $in: ["user", null] },
//     };
//     if (role) {
//       match = {
//         "role.role": { $nin: ["student", "admission_officer", null] },
//       };
//     }
//     if (user_id) {
//       match = {
//         _id: new mongoose.Types.ObjectId(user_id),
//       };
//       projectOption = {
//         __v: 0,
//         updatedAt: 0,
//         createdAt: 0,
//         status: 0,
//       };
//     }
//     if (filter) {
//       match = {
//         ...match,
//         $or: [
//           { first_name: { $regex: filter, $options: "i" } },
//           { last_name: { $regex: filter, $options: "i" } },
//           { email: { $regex: filter, $options: "i" } },
//         ],
//       };
//     }
//     let sortOption = {
//       createdAt: -1,
//     };
//     if (sort) {
//       if (sort === "nameasc") {
//         sortOption = {
//           first_name: 1,
//         };
//       } else if (sort === "namedesc") {
//         sortOption = {
//           first_name: -1,
//         };
//       } else if (sort === "latestlast") {
//         sortOption = {
//           createdAt: 1,
//         };
//       }
//     }
//     const aggregate = [
//       {
//         $lookup: {
//           from: "roles",
//           localField: "role",
//           foreignField: "_id",
//           as: "role",
//           pipeline: [
//             {
//               $project: {
//                 role: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $unwind: {
//           path: "$role",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $match: match,
//       },
//       {
//         $project: projectOption,
//       },
//       {
//         $sort: sortOption,
//       },
//     ];
//     const users = await User.aggregate(aggregate);
//     return Helper.successMsg(res, Constants.DATA_GET, users);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const blockOrUnblockUser = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.blockOrUnblockSchema, req.body, res))
//       return;
//     const [user, result] = await Promise.all([
//       User.findById(req.body.user_id),
//       User.findByIdAndUpdate(req.body.user_id, { status: req.body.status }),
//     ]);
//     if (!user) {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, result);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getUserProfile = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validateUser.userIdSchema, req.query, res))
//       return;
//     const user_id = req.query.user_id;
//     const [users] = await Promise.all([
//       User.findOne({ _id: user_id })
//         .select(
//           "_id first_name last_name email country city state_code country_code state phone_number profile_pic zip_code"
//         )
//         .lean(),
//     ]);

//     return Helper.successMsg(res, Constants.DATA_GET, users);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// export const updateProfle = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validateUser.updateUserSchema, req.body, res))
//       return;
//     const { email } = req.body;
//     const isUser = await User.findById(req.user._id).select("email");
//     if (email !== isUser.email) {
//       const isEmail = await User.findOne({ email });
//       if (isEmail) {
//         return Helper.errorMsg(res, Constants.SIGNUP_ALREADY, 400);
//       }
//     }
//     const user = await User.findByIdAndUpdate(req.user._id, req.body, {
//       new: true,
//     }).select("-__v -createdAt -updatedAt -status");
//     return Helper.successMsg(res, Constants.DATA_UPDATED, user);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// //POST ROUTE

// export const getPosts = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.getPostSchema, req.query, res)) return;
//     const { post_id, user_id, filter, sort, is_admin_post } = req.query;
//     let sortOption = {
//       createdAt: -1,
//     };
//     let match = { is_admin_post: { $in: [false, null] } };
//     if (sort) {
//       if (sort === "latestlast") {
//         sortOption = {
//           createdAt: 1,
//         };
//       }
//     }
//     if (post_id) {
//       match = {
//         _id: new mongoose.Types.ObjectId(post_id),
//       };
//     }
//     if (user_id) {
//       match = {
//         "posted_by._id": new mongoose.Types.ObjectId(user_id),
//       };
//     }
//     if (is_admin_post) {
//       match = {
//         is_admin_post: true,
//       };
//     }
//     if (filter) {
//       match = {
//         $or: [
//           { status: { $regex: filter, $options: "i" } },
//           { "posted_by.first_name": { $regex: filter, $options: "i" } },
//           { "posted_by.last_name": { $regex: filter, $options: "i" } },
//           { "posted_by.email": { $regex: filter, $options: "i" } },
//         ],
//       };
//     }
//     const aggregate = [
//       {
//         $lookup: {
//           from: "users",
//           localField: "posted_by",
//           foreignField: "_id",
//           as: "posted_by",
//           pipeline: [
//             {
//               $project: {
//                 first_name: 1,
//                 last_name: 1,
//                 profile_pic: 1,
//                 email: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $unwind: {
//           path: "$posted_by",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $match: match,
//       },
//       {
//         $lookup: {
//           from: "comments",
//           let: { postId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [{ $eq: ["$post_id", "$$postId"] }],
//                 },
//               },
//             },
//             {
//               $count: "total_comments",
//             },
//           ],
//           as: "total_comments_count",
//         },
//       },
//       {
//         $unwind: {
//           path: "$total_comments_count",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $project: {
//           __v: 0,
//           updatedAt: 0,
//         },
//       },
//       {
//         $sort: sortOption,
//       },
//     ];
//     const posts = await Post.aggregate(aggregate);

//     return Helper.successMsg(
//       res,
//       Constants.DATA_GET,
//       posts
//       // other_user_id ? result : { users, post_count, request }
//     );
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getReports = async (req, res) => {
//   try {
//     const reports = await Post.find({ "report.0": { $exists: true } })
//       .populate("report.reported_by", "_id first_name last_name")
//       .populate("posted_by", "_id first_name last_name")
//       .select("-__v -updatedAt -createdAt")
//       .lean();
//     return Helper.successMsg(res, Constants.DATA_GET, reports);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deletePost = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.deletePostSchema, req.body, res))
//       return;
//     const { post_id, status } = req.body;
//     const [user, result] = await Promise.all([
//       Post.findById(post_id),
//       Post.findByIdAndUpdate(post_id, { status }, { new: true }),
//     ]);
//     if (!user) {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, result);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// //COMMENT ROUTE
// export const getComments = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.getCommentSchema, req.query, res))
//       return;
//     const { comment_id, user_id, filter, sort } = req.query;
//     let sortOption = {
//       createdAt: -1,
//     };
//     let match = {};
//     if (sort) {
//       if (sort === "latestlast") {
//         sortOption = {
//           createdAt: 1,
//         };
//       }
//       if (sort === "mostlikes") {
//         sortOption = {
//           total_likes: -1,
//         };
//       }
//       if (sort === "leastlikes") {
//         sortOption = {
//           total_likes: 1,
//         };
//       }
//       if (sort === "mostreports") {
//         sortOption = {
//           total_reports: -1,
//         };
//       }
//       if (sort === "leastreports") {
//         sortOption = {
//           total_reports: 1,
//         };
//       }
//     }
//     if (comment_id) {
//       match = {
//         _id: new mongoose.Types.ObjectId(comment_id),
//       };
//     }
//     if (user_id) {
//       match = {
//         "commented_by._id": new mongoose.Types.ObjectId(user_id),
//       };
//     }
//     if (filter) {
//       match = {
//         $or: [
//           { status: { $regex: filter, $options: "i" } },
//           { "commented_by.first_name": { $regex: filter, $options: "i" } },
//           { "commented_by.last_name": { $regex: filter, $options: "i" } },
//           { "commented_by.email": { $regex: filter, $options: "i" } },
//         ],
//       };
//     }
//     const aggregate = [
//       {
//         $lookup: {
//           from: "users",
//           localField: "commented_by",
//           foreignField: "_id",
//           as: "commented_by",
//           pipeline: [
//             {
//               $project: {
//                 first_name: 1,
//                 last_name: 1,
//                 email: 1,
//                 profile_pic: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $unwind: {
//           path: "$commented_by",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $match: match,
//       },
//       {
//         $lookup: {
//           from: "comments",
//           let: { postId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [{ $eq: ["$parent_id", "$$postId"] }],
//                 },
//               },
//             },
//             {
//               $count: "total_comments",
//             },
//           ],
//           as: "total_comments_count",
//         },
//       },
//       {
//         $unwind: {
//           path: "$total_comments_count",
//           preserveNullAndEmptyArrays: true,
//         },
//       },

//       {
//         $addFields: {
//           total_replies: {
//             $ifNull: ["$total_comments_count.total_comments", 0],
//           },
//           total_likes: { $size: "$likes" },
//           total_reports: {
//             $cond: {
//               if: { $isArray: "$report" },
//               then: { $size: "$report" },
//               else: 0,
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           __v: 0,
//           updatedAt: 0,
//           report: 0,
//           likes: 0,
//           total_comments_count: 0,
//         },
//       },
//       {
//         $sort: sortOption,
//       },
//     ];
//     // const posts = await Comment.find({ commented_by: user_id })
//     //   .select("-__v -updatedAt")
//     //   .lean();
//     const comments = await Comment.aggregate(aggregate);
//     return Helper.successMsg(
//       res,
//       Constants.DATA_GET,
//       comments
//       // other_user_id ? result : { users, post_count, request }
//     );
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteComment = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.deleteCommentSchema, req.body, res))
//       return;
//     const { comment_id, status } = req.body;
//     const [user, result] = await Promise.all([
//       Comment.findById(comment_id),
//       Comment.findByIdAndUpdate(comment_id, { status }, { new: true }),
//     ]);
//     if (!user) {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, result);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// //GROUP ROUTE
// export const getGroups = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.getGroupSchema, req.query, res)) return;
//     const { group_id, user_id, filter, sort } = req.query;
//     let sortOption = {
//       createdAt: -1,
//     };
//     let match = { is_group_chat: true };
//     if (sort) {
//       if (sort === "latestlast") {
//         sortOption = {
//           createdAt: 1,
//         };
//       }
//       if (sort === "mostmembers") {
//         sortOption = {
//           total_members: -1,
//         };
//       }
//       if (sort === "leastmembers") {
//         sortOption = {
//           total_members: 1,
//         };
//       }
//     }
//     if (group_id) {
//       match = {
//         _id: new mongoose.Types.ObjectId(group_id),
//       };
//     }
//     if (user_id) {
//       match = {
//         "admin._id": new mongoose.Types.ObjectId(user_id),
//         is_group_chat: true,
//       };
//     }
//     if (filter) {
//       match = {
//         is_group_chat: true,
//         $or: [
//           { status: { $regex: filter, $options: "i" } },
//           { "admin.first_name": { $regex: filter, $options: "i" } },
//           { "admin.last_name": { $regex: filter, $options: "i" } },
//           { "admin.email": { $regex: filter, $options: "i" } },
//         ],
//       };
//     }
//     const aggregate = [
//       {
//         $lookup: {
//           from: "users",
//           localField: "admin",
//           foreignField: "_id",
//           as: "admin",
//           pipeline: [
//             {
//               $project: {
//                 first_name: 1,
//                 last_name: 1,
//                 profile_pic: 1,
//                 email: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $unwind: {
//           path: "$admin",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $match: match,
//       },

//       {
//         $addFields: {
//           total_members: { $size: "$users" },
//           total_pending_invites: {
//             $cond: {
//               if: { $isArray: "$pending_invite" },
//               then: { $size: "$pending_invite" },
//               else: 0,
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           __v: 0,
//           updatedAt: 0,
//           users: 0,
//           pending_invite: 0,
//         },
//       },
//       {
//         $sort: sortOption,
//       },
//     ];
//     const groups = await Group.aggregate(aggregate);

//     return Helper.successMsg(
//       res,
//       Constants.DATA_GET,
//       groups
//       // other_user_id ? result : { users, post_count, request }
//     );
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteGroup = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.deleteGroupSchema, req.body, res))
//       return;
//     const { group_id, status } = req.body;
//     const [user, result] = await Promise.all([
//       Group.findById(group_id),
//       Group.findByIdAndUpdate(group_id, { status }, { new: true }),
//     ]);
//     if (!user) {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, result);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// //PROJECT ROUTE
// export const getProjects = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.getPassionSchema, req.query, res))
//       return;
//     const { passion_id, user_id, filter, sort } = req.query;
//     let sortOption = {
//       createdAt: -1,
//     };
//     let match = {};
//     if (sort) {
//       if (sort === "nameasc") {
//         sortOption = {
//           name: 1,
//         };
//       }
//       if (sort === "namedesc") {
//         sortOption = {
//           name: -1,
//         };
//       }
//       if (sort === "latestlast") {
//         sortOption = {
//           createdAt: 1,
//         };
//       }
//       if (sort === "mostposts") {
//         sortOption = {
//           total_posts: -1,
//         };
//       }
//       if (sort === "leastposts") {
//         sortOption = {
//           total_posts: 1,
//         };
//       }
//     }
//     if (passion_id) {
//       match = {
//         _id: new mongoose.Types.ObjectId(passion_id),
//       };
//     }
//     if (user_id) {
//       match = {
//         user_id: new mongoose.Types.ObjectId(user_id),
//       };
//     }
//     if (filter) {
//       match = {
//         $or: [
//           { status: { $regex: filter, $options: "i" } },
//           { "user.first_name": { $regex: filter, $options: "i" } },
//           { "user.last_name": { $regex: filter, $options: "i" } },
//           { "user.email": { $regex: filter, $options: "i" } },
//         ],
//       };
//     }
//     const aggregate = [
//       {
//         $lookup: {
//           from: "users",
//           localField: "user_id",
//           foreignField: "_id",
//           as: "user",
//           pipeline: [
//             {
//               $project: {
//                 first_name: 1,
//                 last_name: 1,
//                 profile_pic: 1,
//                 email: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $unwind: {
//           path: "$user",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "posts",
//           localField: "_id",
//           foreignField: "passion_id",
//           as: "post",
//           pipeline: [
//             {
//               $project: {
//                 description: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $match: match,
//       },

//       {
//         $addFields: {
//           total_posts: {
//             $cond: {
//               if: { $isArray: "$post" },
//               then: { $size: "$post" },
//               else: 0,
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           __v: 0,
//           updatedAt: 0,
//           user_id: 0,
//           post: 0,
//         },
//       },
//       {
//         $sort: sortOption,
//       },
//     ];
//     const passions = await Passion.aggregate(aggregate);

//     return Helper.successMsg(
//       res,
//       Constants.DATA_GET,
//       passions
//       // other_user_id ? result : { users, post_count, request }
//     );
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteProject = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.deleteProjectSchema, req.body, res))
//       return;
//     const { project_id, status } = req.body;
//     const [user, result] = await Promise.all([
//       Passion.findById(project_id),
//       Passion.findByIdAndUpdate(project_id, { status }, { new: true }),
//     ]);
//     if (!user) {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, result);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const createRole = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.createRoleSchema, req.body, res))
//       return;
//     if (
//       req.body.role.toLowerCase() === "user" ||
//       req.body.role.toLowerCase() === "student" ||
//       req.body.role.toLowerCase() === "admission_officer"
//     ) {
//       return Helper.errorMsg(res, Constants.ROLE_RESERVED, 400);
//     }
//     const isRole = await Role.findOne({ role: req.body.role });
//     if (isRole) {
//       return Helper.errorMsg(res, Constants.ROLE_NOT_AVAILABLE, 409);
//     }
//     const role = await Role.create(req.body);
//     if (!role) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_SAVED, role);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getRole = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.getRoleSchema, req.query, res)) return;
//     const { role_id, filter } = req.query;
//     let match = { role: { $nin: ["student", "admission_officer"] } };
//     if (role_id) {
//       match = { _id: new mongoose.Types.ObjectId(role_id) };
//     }
//     if (filter) {
//       match = {
//         role: { $nin: ["student", "admission_officer"] },
//         $or: [{ role: { $regex: filter, $options: "i" } }],
//       };
//     }
//     const aggregate = [
//       {
//         $match: match,
//       },
//       {
//         $project: {
//           __v: 0,
//         },
//       },
//     ];
//     const roles = await Role.aggregate(aggregate);
//     return Helper.successMsg(res, Constants.DATA_GET, roles);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateRole = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateRoleSchema, req.body, res))
//       return;
//     if (
//       req.body.role.toLowerCase() === "student" ||
//       req.body.role.toLowerCase() === "user" ||
//       req.body.role.toLowerCase() === "admission_officer"
//     ) {
//       return Helper.errorMsg(res, Constants.ROLE_RESERVED, 400);
//     }
//     const { role_id, ...rest } = req.body;
//     const currentRole = await Role.findById(role_id).select("role");
//     if (currentRole.role !== rest.role) {
//       const isRole = await Role.findOne({ role: rest.role });
//       if (isRole) {
//         return Helper.errorMsg(res, Constants.ROLE_NOT_AVAILABLE, 400);
//       }
//     }
//     const role = await Role.findByIdAndUpdate(role_id, rest, { new: true });
//     if (!role) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, role);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteRole = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.roleIdSchema, req.query, res)) return;
//     const isRole = await Role.findById(req.query.role_id);
//     if (!isRole) {
//       return Helper.errorMsg(res, Constants.ROLE_NOT_AVAILABLE, 400);
//     }
//     if (isRole.assigned_role > 0) {
//       return Helper.errorMsg(res, Constants.ROLE_NOT_DELETABLE, 400);
//     }
//     const role = await Role.findByIdAndDelete(req.query.role_id);
//     if (!role) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_DELETED, role);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const addOrgUser = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.addOrgUser, req.body, res)) return;
//     const { password, email, ...rest } = req.body;
//     const [isUser, role] = await Promise.all([
//       User.findOne({ email }),
//       Role.findById(rest.role),
//     ]);
//     if (isUser) {
//       return Helper.errorMsg(res, Constants.SIGNUP_ALREADY, 409);
//     }
//     if (!role) {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 400);
//     }
//     const hashedPwd = await bcrypt.hash(password, 10);
//     const user = await User.create({ ...rest, email, password: hashedPwd });
//     if (!user) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     await Role.findByIdAndUpdate(role._id, { $inc: { assigned_role: 1 } });
//     return Helper.successMsg(res, Constants.DATA_SAVED, user);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateOrgUser = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateUserSchema, req.body, res))
//       return;
//     const { role, email, user_id, ...rest } = req.body;
//     const [isUser, isRole] = await Promise.all([
//       User.findById(user_id),
//       Role.findById(role),
//     ]);
//     if (!isRole) {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 400);
//     }
//     if (!isUser) {
//       return Helper.errorMsg(res, Constants.INVALID_ID, 400);
//     }
//     if (email !== isUser.email) {
//       const isEmail = await User.findOne({ email });
//       if (isEmail) {
//         return Helper.errorMsg(res, Constants.SIGNUP_ALREADY, 400);
//       }
//     }
//     const user = await User.findByIdAndUpdate(
//       user_id,
//       { ...rest, email, role },
//       { new: true }
//     );
//     if (!user) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     if (role !== isUser.role.toString()) {
//       await Promise.all([
//         Role.findByIdAndUpdate(isUser.role, { $inc: { assigned_role: -1 } }),
//         Role.findByIdAndUpdate(role, { $inc: { assigned_role: 1 } }),
//       ]);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, role);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getPrivacy = async (req, res) => {
//   try {
//     const { detail } = req.query;
//     let selectOption = "-__v -updatedAt";
//     if (detail) {
//       selectOption = "name description";
//     }
//     const terms = await Privacy.find({ name: "privacy policy" }).select(
//       selectOption
//     );
//     return Helper.successMsg(res, Constants.DATA_GET, terms);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updatePrivacy = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.privacySchema, req.body, res)) return;
//     const privacy = await Privacy.findOneAndUpdate(
//       { name: "privacy policy" },
//       req.body
//     );
//     return Helper.successMsg(res, Constants.DATA_UPDATED, privacy);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// export const getTerms = async (req, res) => {
//   try {
//     const { detail } = req.query;
//     let selectOption = "-__v -updatedAt";
//     if (detail) {
//       selectOption = "name description";
//     }
//     const terms = await Privacy.find({ name: "terms and conditions" }).select(
//       selectOption
//     );
//     return Helper.successMsg(res, Constants.DATA_GET, terms);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateTerms = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.privacySchema, req.body, res)) return;
//     const terms = await Privacy.findOneAndUpdate(
//       { name: "terms and conditions" },
//       req.body
//     );
//     return Helper.successMsg(res, Constants.DATA_UPDATED, terms);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const dashboard = async (req, res) => {
//   try {
//     let result = {};
//     const oneYearAgo = new Date();
//     oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
//     oneYearAgo.setHours(0, 0, 0, 0);
//     // const aggregate=[
//     //   {
//     //     $match: {
//     //       createdAt: { $gte: oneYearAgo },
//     //     },
//     //   },
//     //   {
//     //     $group: {
//     //       _id: {
//     //         month: { $month: "$createdAt" },
//     //         year: { $year: "$createdAt" },
//     //       },
//     //       activeCount: {
//     //         $sum: {
//     //           $cond: [{ $eq: ["$status", "active"] }, 1, 0]
//     //         }
//     //       },
//     //       inactiveCount: {
//     //         $sum: {
//     //           $cond: [{ $eq: ["$status", "inactive"] }, 1, 0]
//     //         }
//     //       }
//     //     },
//     //   },
//     //   {
//     //     $sort: { "_id.year": 1, "_id.month": 1 },
//     //   },
//     // ]

//     const aggregate = [
//       {
//         $match: {
//           createdAt: { $gte: oneYearAgo },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             month: { $month: "$createdAt" },
//             year: { $year: "$createdAt" },
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $sort: { "_id.year": 1, "_id.month": 1 },
//       },
//     ];
//     const [
//       user_graph,
//       total_user_count,
//       active_user_count,
//       inactive_user_count,
//       post_graph,
//       total_post_count,
//       active_post_count,
//       inactive_post_count,
//       comment_graph,
//       total_comment_count,
//       active_comment_count,
//       inactive_comment_count,
//       group_graph,
//       total_group_count,
//       active_group_count,
//       inactive_group_count,
//       passion_graph,
//       total_passion_count,
//       active_passion_count,
//       inactive_passion_count,
//     ] = await Promise.all([
//       User.aggregate(aggregate),
//       User.countDocuments({}),
//       User.countDocuments({ status: Constants.ACTIVE }),
//       User.countDocuments({ status: Constants.INACTIVE }),
//       Post.aggregate(aggregate),
//       Post.countDocuments({}),
//       Post.countDocuments({ status: Constants.ACTIVE }),
//       Post.countDocuments({ status: Constants.INACTIVE }),
//       Comment.aggregate(aggregate),
//       Comment.countDocuments({}),
//       Comment.countDocuments({ status: Constants.ACTIVE }),
//       Comment.countDocuments({ status: Constants.INACTIVE }),
//       Group.aggregate(aggregate),
//       Group.countDocuments({}),
//       Group.countDocuments({ status: Constants.ACTIVE }),
//       Group.countDocuments({ status: Constants.INACTIVE }),
//       Passion.aggregate(aggregate),
//       Passion.countDocuments({}),
//       Passion.countDocuments({ status: Constants.ACTIVE }),
//       Passion.countDocuments({ status: Constants.INACTIVE }),
//     ]);
//     const user = fillMissingMonths(user_graph);
//     const post = fillMissingMonths(post_graph);
//     const comment = fillMissingMonths(comment_graph);
//     const group = fillMissingMonths(group_graph);
//     const passion = fillMissingMonths(passion_graph);
//     result = {
//       user: {
//         user_graph: user,
//         count: {
//           total: total_user_count,
//           active: active_user_count,
//           inactive: inactive_user_count,
//         },
//       },
//       post: {
//         post_graph: post,
//         count: {
//           total: total_post_count,
//           active: active_post_count,
//           inactive: inactive_post_count,
//         },
//       },
//       comment: {
//         comment_graph: comment,
//         count: {
//           total: total_comment_count,
//           active: active_comment_count,
//           inactive: inactive_comment_count,
//         },
//       },
//       group: {
//         group_graph: group,
//         count: {
//           total: total_group_count,
//           active: active_group_count,
//           inactive: inactive_group_count,
//         },
//       },
//       passion: {
//         passion_graph: passion,
//         count: {
//           total: total_passion_count,
//           active: active_passion_count,
//           inactive: inactive_passion_count,
//         },
//       },
//     };
//     return Helper.successMsg(res, Constants.DATA_GET, result);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// export const getChats = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.getChatSchema, req.query, res)) return;
//     const { message_id, group_id, user_id, filter, sort, page } = req.query;
//     const limit = 10;
//     const skip = (+page - 1) * limit || 0;
//     let sortOption = {
//       createdAt: -1,
//     };
//     let match = {};
//     if (sort) {
//       if (sort === "latestlast") {
//         sortOption = {
//           createdAt: 1,
//         };
//       }
//       if (sort === "group") {
//         match = {
//           "group.is_group_chat": true,
//         };
//       }
//       if (sort === "one") {
//         match = {
//           "group.is_group_chat": false,
//         };
//       }
//     }
//     if (message_id) {
//       match = {
//         _id: new mongoose.Types.ObjectId(message_id),
//       };
//     }
//     if (group_id) {
//       match = {
//         group_id: new mongoose.Types.ObjectId(group_id),
//       };
//     }
//     if (user_id) {
//       match = {
//         sender_id: new mongoose.Types.ObjectId(user_id),
//       };
//     }
//     if (filter) {
//       match = {
//         $or: [
//           { status: { $regex: filter, $options: "i" } },
//           { "sender.first_name": { $regex: filter, $options: "i" } },
//           { "sender.last_name": { $regex: filter, $options: "i" } },
//           { "sender.email": { $regex: filter, $options: "i" } },
//         ],
//       };
//     }
//     const aggregate = [
//       {
//         $sort: sortOption,
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "sender_id",
//           foreignField: "_id",
//           as: "sender",
//           pipeline: [
//             {
//               $project: {
//                 first_name: 1,
//                 last_name: 1,
//                 profile_pic: 1,
//                 email: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $unwind: {
//           path: "$sender",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "groups",
//           localField: "group_id",
//           foreignField: "_id",
//           as: "group",
//           pipeline: [
//             {
//               $project: {
//                 name: 1,
//                 is_group_chat: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $unwind: {
//           path: "$group",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $match: match,
//       },
//       {
//         $skip: skip,
//       },
//       {
//         $limit: limit,
//       },
//       {
//         $project: {
//           __v: 0,
//           updatedAt: 0,
//         },
//       },
//       {
//         $sort: sortOption,
//       },
//     ];
//     const count_aggregate = [
//       {
//         $lookup: {
//           from: "users",
//           localField: "sender_id",
//           foreignField: "_id",
//           as: "sender",
//           pipeline: [
//             {
//               $project: {
//                 first_name: 1,
//                 last_name: 1,
//                 profile_pic: 1,
//                 email: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $unwind: {
//           path: "$sender",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "groups",
//           localField: "group_id",
//           foreignField: "_id",
//           as: "group",
//           pipeline: [
//             {
//               $project: {
//                 name: 1,
//                 is_group_chat: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $unwind: {
//           path: "$group",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $match: match,
//       },
//       {
//         $project: {
//           _id: 1,
//         },
//       },
//       { $count: "total_count" },
//     ];
//     const [chats, total_count] = await Promise.all([
//       Message.aggregate(aggregate),
//       Message.aggregate(count_aggregate),
//     ]);
//     return Helper.successMsg(res, Constants.DATA_GET, {
//       chats,
//       total_count: total_count[0]?.total_count || 0,
//     });
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// function fillMissingMonths(data) {
//   const result = [];
//   const currentDate = new Date();
//   for (let i = 11; i >= 0; i--) {
//     const date = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth() - i,
//       1
//     );
//     const month = date.toLocaleString("default", { month: "short" });
//     const year = date.getFullYear().toString();

//     const existingData = data.find(
//       (d) =>
//         d._id.month === date.getMonth() + 1 && d._id.year === date.getFullYear()
//     );
//     result.push({
//       month,
//       year,
//       count: existingData ? existingData.count : 0,
//     });
//   }

//   return result;
// }

// export const addRoleModule = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.nameSchema, req.body, res)) return;
//     const module = await RoleModule.create(req.body);
//     return Helper.successMsg(res, Constants.DATA_SAVED, module);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const createPost = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.postSchema, req.body, res)) return;
//     const warning = await textModeration(res, req.body.description);
//     if (warning) {
//       return Helper.errorMsg(res, warning, 400);
//     }
//     const post = await Post.create({
//       posted_by: req.user._id,
//       is_admin_post: true,
//       ...req.body,
//     });
//     if (!post) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_SAVED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const createFaqCat = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.createFaqCatSchema, req.body, res))
//       return;
//     const faqCat = await FaqCategory.create(req.body);
//     if (!faqCat) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_SAVED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateFaqCat = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateFaqCatSchema, req.body, res))
//       return;
//     const faqCat = await FaqCategory.findByIdAndUpdate(req.body.faq_cat_id, {
//       name: req.body.name,
//     });
//     if (!faqCat) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateFaqCatOrder = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateFaqCatOrderSchema, req.body, res))
//       return;
//     const bulkOps = req.body.map((update) => ({
//       updateOne: {
//         filter: { _id: update.faq_cat_id },
//         update: { order: update.order },
//       },
//     }));
//     await FaqCategory.bulkWrite(bulkOps);
//     return Helper.successMsg(res, Constants.DATA_UPDATED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getFaqCat = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.getFaqCatSchema, req.query, res))
//       return;
//     const { faq_cat_id, list } = req.query;
//     let match = {};
//     if (list === "false") {
//       match = {
//         status: "ACTIVE",
//       };
//     }
//     if (faq_cat_id) {
//       match = {
//         _id: new mongoose.Types.ObjectId(faq_cat_id),
//       };
//     }
//     const aggregate = [
//       {
//         $match: match,
//       },
//       ...(list && list === "false"
//         ? [
//             {
//               $lookup: {
//                 from: "faqs",
//                 localField: "_id",
//                 foreignField: "faq_cat_id",
//                 as: "faqs",
//                 pipeline: [
//                   {
//                     $match: { status: "ACTIVE" },
//                   },
//                   {
//                     $sort: {
//                       order: 1,
//                     },
//                   },
//                   {
//                     $project: {
//                       question: 1,
//                       answer: 1,
//                     },
//                   },
//                 ],
//               },
//             },
//           ]
//         : []),
//       {
//         $project: {
//           name: 1,
//           status: 1,
//           faqs: 1,
//         },
//       },
//       {
//         $sort: {
//           order: 1,
//         },
//       },
//     ];
//     const faqCat = await FaqCategory.aggregate(aggregate);
//     return Helper.successMsg(res, Constants.DATA_SAVED, faqCat);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteFaqCat = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateFaqCatSchema, req.body, res))
//       return;
//     const { faq_cat_id, status } = req.body;
//     const result = await FaqCategory.findByIdAndUpdate(faq_cat_id, {
//       status,
//     });
//     if (!result) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_DELETED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const createFaq = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.createFaqSchema, req.body, res)) return;

//     const faq = await Faq.create(req.body);
//     if (!faq) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_SAVED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateFaq = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateFaqSchema, req.body, res)) return;
//     const { faq_id, ...rest } = req.body;
//     const faq = await Faq.findByIdAndUpdate(faq_id, rest);
//     if (!faq) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateFaqOrder = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateFaqOrderSchema, req.body, res))
//       return;
//     const bulkOps = req.body.map((update) => ({
//       updateOne: {
//         filter: { _id: update.faq_id },
//         update: { order: update.order },
//       },
//     }));
//     const result = await Faq.bulkWrite(bulkOps);
//     if (!result) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getFaq = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.getFaqSchema, req.query, res)) return;
//     const { faq_id, faq_cat_id } = req.query;
//     let match = {};
//     if (faq_id) {
//       match = { _id: faq_id };
//     }
//     if (faq_cat_id) {
//       match = { faq_cat_id };
//     }
//     const faq = await Faq.find(match)
//       .select("_id faq_cat_id question answer status")
//       .sort({ order: 1 });
//     return Helper.successMsg(res, Constants.DATA_GET, faq);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteFaq = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateFaqSchema, req.body, res)) return;
//     const { faq_id, status } = req.body;
//     const faq = await Faq.findByIdAndUpdate(faq_id, {
//       status,
//     });
//     if (!faq) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_DELETED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const createResourceCat = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.createFaqCatSchema, req.body, res))
//       return;
//     const RCat = await Resource.create(req.body);
//     if (!RCat) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_SAVED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateResourceCat = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateRCatSchema, req.body, res))
//       return;
//     const result = await Resource.findByIdAndUpdate(req.body.resource_cat_id, {
//       name: req.body.name,
//     });
//     if (!result) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateResourceCatOrder = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateOrderSchema, req.body, res))
//       return;
//     const bulkOps = req.body.map((update) => ({
//       updateOne: {
//         filter: { _id: update.id },
//         update: { order: update.order },
//       },
//     }));
//     await Resource.bulkWrite(bulkOps);
//     return Helper.successMsg(res, Constants.DATA_UPDATED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getResourceCat = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.getRCatSchema, req.query, res)) return;
//     const { resource_cat_id, list } = req.query;
//     let match = {};
//     let project = {
//       name: 1,
//       status: 1,
//     };
//     if (list && list === "true") {
//       match = { parent_id: null };
//     }
//     if (list && list === "false") {
//       (project = {
//         ...project,
//         resources: 1,
//       }),
//         (match = {
//           status: Constants.ACTIVE,
//         });
//     }
//     if (resource_cat_id) {
//       match = {
//         _id: new mongoose.Types.ObjectId(resource_cat_id),
//       };
//     }
//     const aggregate = [
//       {
//         $match: match,
//       },
//       ...(list && list === "false"
//         ? [
//             {
//               $lookup: {
//                 from: "resources",
//                 localField: "_id",
//                 foreignField: "parent_id",
//                 as: "resources",
//                 pipeline: [
//                   {
//                     $match: { status: "ACTIVE" },
//                   },
//                   {
//                     $sort: {
//                       order: 1,
//                     },
//                   },
//                   {
//                     $project: {
//                       name: 1,
//                       link: 1,
//                     },
//                   },
//                 ],
//               },
//             },
//           ]
//         : []),
//       {
//         $project: project,
//       },
//       {
//         $sort: {
//           order: 1,
//         },
//       },
//     ];
//     const faqCat = await Resource.aggregate(aggregate);
//     return Helper.successMsg(res, Constants.DATA_SAVED, faqCat);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteResourceCat = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateRCatSchema, req.body, res))
//       return;
//     const { resource_cat_id, status } = req.body;
//     const result = await Resource.findByIdAndUpdate(resource_cat_id, {
//       status,
//     });
//     if (!result) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_DELETED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const createResource = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.createResourceSchema, req.body, res))
//       return;

//     const result = await Resource.create(req.body);
//     if (!result) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_SAVED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateResource = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateResourceSchema, req.body, res))
//       return;
//     const { resource_id, ...rest } = req.body;
//     const result = await Resource.findByIdAndUpdate(resource_id, rest);
//     if (!result) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateResourceOrder = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateOrderSchema, req.body, res))
//       return;
//     const bulkOps = req.body.map((update) => ({
//       updateOne: {
//         filter: { _id: update.id },
//         update: { order: update.order },
//       },
//     }));
//     const result = await Resource.bulkWrite(bulkOps);
//     if (!result) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_UPDATED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getResource = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.getRCatSchema, req.query, res)) return;
//     const { resource_id, resource_cat_id } = req.query;
//     let match = {};
//     if (resource_id) {
//       match = { _id: resource_id };
//     }
//     if (resource_cat_id) {
//       match = { parent_id: resource_cat_id };
//     }
//     const result = await Resource.find(match)
//       .select("_id parent_id name link status")
//       .sort({ order: 1 });
//     return Helper.successMsg(res, Constants.DATA_GET, result);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteResource = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateResourceSchema, req.body, res))
//       return;
//     const { resource_id, status } = req.body;
//     const result = await Resource.findByIdAndUpdate(resource_id, {
//       status,
//     });
//     if (!result) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_DELETED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const createSchool = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.schoolSchema, req.body, res)) return;
//     const is_school = await School.findOne({ school_id_number: req.body.school_id_number });
//     if (is_school) {
//       return Helper.errorMsg(res, "This school already added", 400);
//     }
//     const result = await School.create(req.body);
//     if (!result) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_SAVED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updateSchool = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.updateSchoolSchema, req.body, res))
//       return;
//     const { id, name,school_id_number } = req.body;
//     const [is_school, school] = await Promise.all([
//       School.findOne({ school_id_number }),
//       School.findById(id),
//     ]);
//     if (is_school && school.school_id_number !== school_id_number) {
//       return Helper.errorMsg(res, "This school already added", 400);
//     }
//     const result = await School.findByIdAndUpdate(id, { name,school_id_number });
//     if (!result) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_SAVED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getSchools = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.getIdOptionalSchema, req.query, res)) return;
//     const { id,page,filter } = req.query;
//     const limit = 10;
//     const skip = page-1*limit;
//     let match = {};
//     if (id) {
//       match = { _id: id };
//     }
//     if(filter){
//       match={
//         name:{$regex:filter,$options:"i"}
//       }
//     }
//     const [result,total_count] = await Promise.all([
//       School.find(match)
//       .select("-__v -updatedAt")
//       .limit(limit)
//       .skip(skip)
//       .sort({ createdAt: -1 }),
//       School.countDocuments(match)
//     ]);
//     return Helper.successMsg(res, Constants.DATA_GET, {result,total_count});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteSchool = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validate.deleteSchema, req.query, res))
//       return;
//     const { id, status } = req.query;
//     const result = await School.findByIdAndUpdate(id, {
//       status,
//     });
//     if (!result) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     return Helper.successMsg(res, Constants.DATA_DELETED, {});
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };