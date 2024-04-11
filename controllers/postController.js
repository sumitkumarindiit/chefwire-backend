// import Comment from "../models/commentModel.js";
// import Post from "../models/postModel.js";
// import uploadToS3 from "../services/s3Services.js";
// import * as Helper from "../services/HelperFunction.js";
// import * as validatePost from "../services/SchemaValidate/postSchema.js";
// import { Logs } from "../middleware/log.js";
// import { Notifications } from "../middleware/notification.js";
// import { Constants, SocketEvent } from "../services/Constants.js";
// import mongoose from "mongoose";
// import { imageModeration, textModeration } from "../services/userService.js";


// const commentCommonAggregation = () => {
//   return [
//     {
//       $lookup: {
//         from: "users",
//         localField: "commented_by",
//         foreignField: "_id",
//         as: "commented_by",
//         pipeline: [
//           {
//             $project: {
//               _id: 1,
//               first_name: 1,
//               last_name: 1,
//               profile_pic: 1,
//             },
//           },
//         ],
//       },
//     },
//     {
//       $unwind: "$commented_by",
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "replied_user_id",
//         foreignField: "_id",
//         as: "replied_user",
//         pipeline: [
//           {
//             $project: {
//               _id: 1,
//               first_name: 1,
//               last_name: 1,
//               profile_pic: 1,
//             },
//           },
//         ],
//       },
//     },
//     {
//       $unwind: {
//         path: "$replied_user",
//         preserveNullAndEmptyArrays: true,
//       },
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "likes",
//         foreignField: "_id",
//         as: "likes",
//         pipeline: [
//           {
//             $project: {
//               _id: 1,
//               first_name: 1,
//               last_name: 1,
//               profile_pic: 1,
//             },
//           },
//         ],
//       },
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "mentions.user_id",
//         foreignField: "_id",
//         as: "mentionUsers",
//       },
//     },
//     {
//       $addFields: {
//         mentions: {
//           $map: {
//             input: "$mentions",
//             as: "mention",
//             in: {
//               _id: "$$mention.user_id",
//               first_name: {
//                 $arrayElemAt: ["$mentionUsers.first_name", 0],
//               },
//               last_name: {
//                 $arrayElemAt: ["$mentionUsers.last_name", 0],
//               },
//               profile_pic: {
//                 $arrayElemAt: ["$mentionUsers.profile_pic", 0],
//               },
//               position: "$$mention.position",
//             },
//           },
//         },
//       },
//     },
//     {
//       $lookup: {
//         from: "comments",
//         let: {
//           postId: "$_id",
//         },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   {
//                     $eq: ["$parent_id", "$$postId"],
//                   },
//                   {
//                     $eq: ["$status", Constants.ACTIVE],
//                   },
//                 ],
//               },
//             },
//           },
//           {
//             $count: "total_replies",
//           },
//         ],
//         as: "total_comments_count",
//       },
//     },
//     {
//       $addFields: {
//         reply_count: {
//           $cond: {
//             if: {
//               $isArray: "$total_comments_count",
//             },
//             then: {
//               $ifNull: [
//                 {
//                   $arrayElemAt: ["$total_comments_count.total_replies", 0],
//                 },
//                 0,
//               ],
//             },
//             else: 0,
//           },
//         },
//       },
//     },
//     // {
//     //   $addFields: {
//     //     is_more: {
//     //       $cond: {
//     //         if: {
//     //           $gt: [
//     //             { $size: "$total_comments_count" },
//     //             { $add: [skip, limit] }
//     //           ]
//     //         },
//     //         then: true,
//     //         else: false
//     //       }
//     //     }
//     //   }
//     // },
//     {
//       $project: {
//         __v: 0,
//         updatedAt: 0,
//         status: 0,
//         mentionUsers: 0,
//         total_comments_count: 0,
//       },
//     },
//   ];
// };

// export const createPost = async (req, res, next) => {
//   try {
//     const { tags, ...rest } = req.body;
//     const files = req.files?.file;
//     let obj;
//     if (tags) {
//       obj = {
//         tags: JSON.parse(tags),
//         ...rest,
//       };
//     } else {
//       obj = req.body;
//     }
//     if (files) {
//       if (files && Array.isArray(files)) {
//         const warning = await imageModeration(files);
//         if (warning) {
//           return Helper.errorMsg(res, warning, 400);
//         }
//         const imgFile = files.map((file, index) => {
//           return file.data;
//         });
//         obj = { ...obj, file: imgFile };
//       } else {
//         const warning = await imageModeration([files]);
//         if (warning) {
//           return Helper.errorMsg(res, warning, 400);
//         }
//         obj = { ...obj, file: [files.data] };
//       }
//     }
//     if (Helper.validateRequest(validatePost.postSchema, obj, res)) return;
//     let file;
//     if (files) {
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
//     const warning = await textModeration(res, obj.description);
//     if (warning) {
//       return Helper.errorMsg(res, warning, 400);
//     }
//     const post = await Post.create({
//       posted_by: req.user._id,
//       school_id: req.user.school_id,
//       description: obj.description,
//       passion_id: obj.passion_id,
//       tags: obj.tags,
//       media: url,
//     });
//     if (!post) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     Logs(req, Constants.DATA_SAVED, next);
//     const result = await Post.findById(post._id)
//       .populate("posted_by", "_id first_name last_name profile_pic")
//       .populate("likes", "_id first_name last_name profile_pic")
//       .lean();
//     result.comments = [];
//     return Helper.successMsg(res, Constants.DATA_SAVED, result);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getAllPost = async (req, res) => {
//   try {
//     const followedPage = await Page.find({
//       followed_by: { $in: req.user._id },
//     });
//     const pageIds = followedPage.map((pg) => pg._id);
//     const { post_id, user_id, page, passion_id, page_id, role } = req.query;

//     let matchCondition = {status: Constants.ACTIVE};
//     if (role === "student") {
//       matchCondition = {
//         ...matchCondition,
//         page_id: { $in: [null, ...pageIds] },
//       };
//     } else if (role === "admission_officer") {
//       console.log(req.user)
//       const userIds = req.user.followings.map((usr)=>usr.user_id);
//       matchCondition={
//         ...matchCondition,
//         posted_by:{$in:userIds}
//       }
//     }
//     if (post_id) {
//       matchCondition = {
//         _id: new mongoose.Types.ObjectId(post_id),
//         status: Constants.ACTIVE,
//       };
//     }
//     if (user_id) {
//       matchCondition = {
//         posted_by: new mongoose.Types.ObjectId(user_id),
//         status: Constants.ACTIVE,
//       };
//     }
//     if (page_id) {
//       matchCondition = {
//         page_id: new mongoose.Types.ObjectId(user_id),
//         status: Constants.ACTIVE,
//       };
//     }
//     if (passion_id) {
//       matchCondition = {
//         passion_id: new mongoose.Types.ObjectId(passion_id),
//         status: Constants.ACTIVE,
//       };
//     }
//     const limit = 10;
//     const skip = page ? (page - 1) * limit : 0;

//     const matchCriteria = [
//       {
//         $match: matchCondition,
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
//       {
//         $lookup: {
//           from: "users",
//           localField: "posted_by",
//           foreignField: "_id",
//           as: "posted_by",
//           pipeline: [
//             {
//               $project: {
//                 _id: 1,
//                 first_name: 1,
//                 last_name: 1,
//                 profile_pic: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $unwind: "$posted_by",
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "shares",
//           foreignField: "_id",
//           as: "shares",
//           pipeline: [
//             {
//               $project: {
//                 _id: 1,
//                 first_name: 1,
//                 last_name: 1,
//                 profile_pic: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "likes",
//           foreignField: "_id",
//           as: "likes",
//           pipeline: [
//             {
//               $project: {
//                 _id: 1,
//                 first_name: 1,
//                 last_name: 1,
//                 profile_pic: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $lookup: {
//           from: "comments",
//           let: { postId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$post_id", "$$postId"] },
//                     { $eq: ["$status", Constants.ACTIVE] },
//                   ],
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
//         $addFields: {
//           total_comments: {
//             $cond: {
//               if: { $isArray: "$total_comments_count" },
//               then: {
//                 $ifNull: [
//                   { $arrayElemAt: ["$total_comments_count.total_comments", 0] },
//                   0,
//                 ],
//               },
//               else: 0,
//             },
//           },
//         },
//       },

//       {
//         $project: {
//           __v: 0,
//           updatedAt: 0,
//           status: 0,
//           total_comments_count: 0,
//         },
//       },
//       {
//         $lookup: {
//           from: "comments",
//           let: {
//             postId: "$_id",
//           },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     {
//                       $eq: ["$post_id", "$$postId"],
//                     },
//                     {
//                       $eq: [
//                         {
//                           $ifNull: ["$parent_id", null],
//                         },
//                         null,
//                       ],
//                     },
//                     {
//                       $eq: ["$status", "ACTIVE"],
//                     },
//                   ],
//                 },
//               },
//             },
//             {
//               $sort: { createdAt: -1 },
//             },
//             {
//               $limit: 4,
//             },
//             {
//               $lookup: {
//                 from: "users",
//                 localField: "commented_by",
//                 foreignField: "_id",
//                 as: "commented_by",
//                 pipeline: [
//                   {
//                     $project: {
//                       _id: 1,
//                       first_name: 1,
//                       last_name: 1,
//                       profile_pic: 1,
//                     },
//                   },
//                 ],
//               },
//             },
//             {
//               $lookup: {
//                 from: "users",
//                 localField: "likes",
//                 foreignField: "_id",
//                 as: "likes",
//                 pipeline: [
//                   {
//                     $project: {
//                       _id: 1,
//                       first_name: 1,
//                       last_name: 1,
//                       profile_pic: 1,
//                     },
//                   },
//                 ],
//               },
//             },
//             {
//               $unwind: "$commented_by",
//             },
//             {
//               $lookup: {
//                 from: "users",
//                 localField: "mentions.user_id",
//                 foreignField: "_id",
//                 as: "mentionUsers",
//               },
//             },
//             {
//               $addFields: {
//                 mentions: {
//                   $map: {
//                     input: "$mentions",
//                     as: "mention",
//                     in: {
//                       user_id: "$$mention.user_id",
//                       first_name: {
//                         $arrayElemAt: ["$mentionUsers.first_name", 0],
//                       },
//                       last_name: {
//                         $arrayElemAt: ["$mentionUsers.last_name", 0],
//                       },
//                       profile_pic: {
//                         $arrayElemAt: ["$mentionUsers.profile_pic", 0],
//                       },
//                       position: "$$mention.position",
//                     },
//                   },
//                 },
//               },
//             },
//             {
//               $lookup: {
//                 from: "comments",
//                 let: {
//                   commentId: "$_id",
//                 },
//                 pipeline: [
//                   {
//                     $match: {
//                       $expr: {
//                         $eq: ["$parent_id", "$$commentId"], // Match replies with the current comment's _id as parent_id
//                       },
//                     },
//                   },
//                   {
//                     $count: "reply_count", // Count the number of replies
//                   },
//                 ],
//                 as: "replies", // Store the replies in a field called "replies"
//               },
//             },
//             {
//               $addFields: {
//                 reply_count: {
//                   $sum: "$replies.reply_count",
//                 }, // Sum up the reply counts for all replies
//               },
//             },
//             {
//               $project: {
//                 _id: 1,
//                 parent_id: 1,
//                 post_id: 1,
//                 commented_by: 1,
//                 media: 1,
//                 comment: 1,
//                 likes: 1,
//                 mentions: 1,
//                 createdAt: 1,
//                 reply_count: 1,
//               },
//             },
//           ],
//           as: "comments",
//         },
//       },
//     ];

//     const posts = await Post.aggregate(matchCriteria);
//     return Helper.successMsg(res, Constants.DATA_GET, posts);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// export const getPostDetails = async (req, res) => {
//   try {
//     const { post_id } = req.query;
//     const limit = 10;
//     const aggregation = [
//       // Stage 1: Match and Sort Posts
//       { $match: { _id: new mongoose.Types.ObjectId(post_id) } },
//       { $sort: { createdAt: -1 } },
//       { $limit: 10 }, // Fetch the latest 10 posts

//       // Stage 2: Populate Post References
//       {
//         $lookup: {
//           from: "users",
//           localField: "posted_by",
//           foreignField: "_id",
//           as: "post_author",
//         },
//       },
//       { $unwind: "$post_author" },
//       // ... Other lookups for posts (e.g., likes, shares, etc.)

//       // Stage 3: Fetch Comments with Replies
//       {
//         $lookup: {
//           from: "comments",
//           let: { postId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$post_id", "$$postId"] },
//                 // ... other filters as needed, e.g., status: Constants.Active
//               },
//             },
//             {
//               $graphLookup: {
//                 from: "comments",
//                 startWith: "$_id",
//                 connectFromField: "_id",
//                 connectToField: "parent_id",
//                 as: "replies",
//                 maxDepth: 9,
//                 restrictSearchWithMatch: {
//                   // ... add filtering if you want to restrict replies
//                 },
//               },
//             },
//             {
//               // Remove duplicates from comments
//               $group: {
//                 _id: "$_id",
//                 comments: {
//                   $first: "$comment",
//                 },
//                 // Select other fields to keep
//               },
//             },
//             // Stage 3.1: Populate User References within Comments
//             {
//               $lookup: {
//                 from: "users",
//                 localField: "commented_by",
//                 foreignField: "_id",
//                 as: "comment_author",
//               },
//             },
//             { $unwind: "$comment_author" },
//             // ... Lookups for likes, mentions, etc. within comments
//           ],
//           as: "comments",
//         },
//       },

//       // Stage 4: Project (Shape the Output)
//       {
//         $project: {
//           // Fields from the posts collection
//           _id: 1,
//           posted_by: {
//             _id: 1,
//             first_name: 1,
//             last_name: 1, // ...other fields
//           },
//           // ... other post fields

//           comments: 1, // Keep the comments array
//         },
//       },
//     ];
//     const posts = await Post.aggregate(aggregation);
//     let post = posts[0];
//     console.log(posts);
//     post.comments = nestComments(post.comments);

//     // const posts = await Post.findById(post_id)
//     //   .populate("posted_by", "_id first_name last_name profile_pic")
//     //   .populate("likes", "_id first_name last_name profile_pic")
//     //   .lean();
//     // const allComments = await getComments(post_id);
//     // posts.comments = allComments;
//     return Helper.successMsg(res, Constants.DATA_GET, post);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// export const getAllCommentsOfPost = async (req, res) => {
//   if (Helper.validateRequest(validatePost.postIdSchema, req.query, res)) return;
//   const { post_id, page } = req.query;
//   const limit = 10;
//   const skip = page ? (page - 1) * limit : 0;
//   const criteria = [
//     {
//       $match: {
//         post_id: new mongoose.Types.ObjectId(post_id),
//         status: Constants.ACTIVE,
//         parent_id: null,
//       },
//     },
//     {
//       $sort: {
//         createdAt: -1,
//       },
//     },
//     {
//       $skip: skip,
//     },
//     {
//       $limit: limit,
//     },
//     ...commentCommonAggregation(skip, limit),
//   ];

//   try {
//     const [comments, commentsCount] = await Promise.all([
//       Comment.aggregate(criteria),
//       Comment.countDocuments({
//         post_id,
//         status: Constants.ACTIVE,
//         parent_id: null,
//       }),
//     ]);
//     // const { comments, commentsCount } = await getComments(post_id, page);
//     const hasMoreComments = commentsCount > page * limit;
//     return Helper.successMsg(res, Constants.DATA_GET, {
//       comments,
//       hasMoreComments,
//     });
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getAllRepliesOfComments = async (req, res) => {
//   if (Helper.validateRequest(validatePost.commentIdSchema, req.query, res))
//     return;
//   const { comment_id, page } = req.query;
//   const limit = 10;
//   const skip = page ? (page - 1) * limit : 0;
//   const criteria = [
//     {
//       $match: {
//         parent_id: new mongoose.Types.ObjectId(comment_id),
//         status: Constants.ACTIVE,
//       },
//     },
//     {
//       $sort: {
//         createdAt: -1,
//       },
//     },
//     {
//       $skip: skip,
//     },
//     {
//       $limit: limit,
//     },
//     ...commentCommonAggregation(),
//   ];

//   try {
//     const replies = await Comment.aggregate(criteria);
//     return Helper.successMsg(res, Constants.DATA_GET, replies);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// export const getComments = async (postId, page, parentId = null) => {
//   const limit = 5;
//   const skip = page ? (page - 1) * limit : 0;

//   const [comments, commentsCount] = await Promise.all([
//     Comment.find({
//       post_id: postId,
//       parent_id: parentId,
//       status: Constants.ACTIVE,
//     })
//       .sort({ createdAt: -1 })
//       .limit(limit)
//       .skip(skip)
//       .populate("commented_by", "_id first_name last_name profile_pic")
//       .populate("mentions.user_id", "_id first_name last_name")
//       .populate("likes", "_id first_name last_name profile_pic")
//       .lean(),
//     Comment.countDocuments({ post_id: postId, status: Constants.ACTIVE }),
//   ]);

//   for (const comment of comments) {
//     const replies = await getComments(postId, page, comment._id);
//     comment.replies = replies.comments;
//   }
//   return { comments, commentsCount };
// };

// export const likePost = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.postIdSchema, req.body, res))
//       return;
//     const like = await Post.findByIdAndUpdate(
//       req.body.post_id,
//       {
//         $addToSet: { likes: req.user._id },
//       },
//       {
//         new: true,
//       }
//     )
//       .populate("posted_by", "_id first_name last_name profile_pic")
//       .select("-__v ")
//       .lean();
//     if (!like) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     Logs(req, Constants.DATA_SAVED, next);
//     const sender = {
//       _id: req.user._id,
//       name: req.user.first_name + " " + req.user.last_name,
//       profile_pic: req.user.profile_pic,
//     };
//     if (req.user._id.toString() !== like.posted_by._id.toString()) {
//       Notifications(
//         req,
//         sender,
//         like.posted_by._id,
//         SocketEvent.LIKE_POST_EVENT,
//         " liked your post",
//         Constants.LIKE_POST,
//         like
//       );
//     }

//     return Helper.successMsg(res, Constants.DATA_SAVED, like);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const unLikePost = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.postIdSchema, req.body, res))
//       return;
//     const like = await Post.findByIdAndUpdate(
//       req.body.post_id,
//       {
//         $pull: { likes: req.user._id },
//       },
//       {
//         new: true,
//       }
//     )
//       .populate("posted_by", "_id first_name last_name")
//       .select("-__v ");
//     if (!like) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     Logs(req, Constants.DATA_SAVED, next);
//     return Helper.successMsg(res, Constants.DATA_SAVED, like);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const sharePost = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.postIdSchema, req.body, res))
//       return;
//     const share = await Post.findByIdAndUpdate(
//       req.body.post_id,
//       {
//         $addToSet: { shares: req.user._id },
//       },
//       {
//         new: true,
//       }
//     )
//       .populate("posted_by", "_id first_name last_name")
//       .select("-__v ");
//     if (!share) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     Notifications(
//       req.user._id,
//       share.posted_by._id,
//       "Shared your post",
//       Constants.SHARED_POST,
//       share
//     );
//     Logs(req, Constants.DATA_SAVED, next);
//     return Helper.successMsg(res, Constants.DATA_SAVED, share);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// export const commentPost = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.commentSchema, req.body, res))
//       return;
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
//           await S3Service.uploadToS3(item.data, filename, item.mimetype);
//           return { filename, type: item.mimetype.split("/")[0]?.toUpperCase() };
//         })
//       );
//     }
//     const { comment, post_id, parent_id, replied_user_id } = req.body;
//     const warning = await textModeration(res, comment);
//     if (warning) {
//       return Helper.errorMsg(res, warning, 400);
//     }
//     const mentionRegex = /@\[([^\]]+)\]\((\w+)\)/g;
//     // Extract mentions from the body text along with their positions
//     const mentions = [];
//     let match;
//     while ((match = mentionRegex.exec(comment)) !== null) {
//       mentions.push({
//         user_id: match[2],
//         position: match.index,
//       });
//     }

//     // Sort mentions by position
//     mentions.sort((a, b) => a.position - b.position);

//     // Extract comments from the body text
//     const commentToSave = comment.replace(mentionRegex, "").trim();
//     const [comments, post] = await Promise.all([
//       Comment.create({
//         post_id,
//         parent_id,
//         commented_by: req.user._id,
//         replied_user_id,
//         comment: commentToSave,
//         mentions,
//         media: url,
//       }),
//       Post.findById(post_id),
//     ]);

//     if (!comments) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     const result = await Comment.findById(comments._id)
//       .populate("commented_by", "_id first_name last_name profile_pic")
//       .populate("mentions.user_id", "_id first_name last_name");
//     Logs(req, Constants.DATA_SAVED, next);
//     const sender = {
//       _id: req.user._id,
//       name: req.user.first_name + " " + req.user.last_name,
//       profile_pic: req.user.profile_pic,
//     };
//     req.user._id.toString() !== post.posted_by.toString() &&
//       Notifications(
//         req,
//         sender,
//         post.posted_by,
//         SocketEvent.COMMENT_POST_EVENT,
//         " commented on your post",
//         Constants.COMMENT_POST,
//         post
//       );
//     return Helper.successMsg(res, Constants.DATA_SAVED, result);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const likeComment = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.likeCmtSchema, req.body, res))
//       return;
//     const like = await Comment.findByIdAndUpdate(
//       req.body.comment_id,
//       {
//         $addToSet: { likes: req.user._id },
//       },
//       {
//         new: true,
//       }
//     )
//       .populate("commented_by", "_id first_name last_name")
//       .select("-__v ");
//     if (!like) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     Logs(req, Constants.DATA_SAVED, next);
//     const sender = {
//       _id: req.user._id,
//       name: req.user.first_name + " " + req.user.last_name,
//       profile_pic: req.user.profile_pic,
//     };
//     if (req.user._id.toString() !== like.commented_by._id.toString()) {
//       Notifications(
//         req,
//         sender,
//         like.commented_by._id,
//         SocketEvent.LIKE_COMMENT_EVENT,
//         " liked your comment",
//         Constants.LIKE_COMMENT,
//         like
//       );
//     }
//     return Helper.successMsg(res, Constants.DATA_SAVED, like);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const unLikeComment = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.likeCmtSchema, req.body, res))
//       return;
//     const like = await Comment.findByIdAndUpdate(
//       req.body.comment_id,
//       {
//         $pull: { likes: req.user._id },
//       },
//       {
//         new: true,
//       }
//     )
//       .populate("commented_by", "_id first_name last_name")
//       .select("-__v ");
//     if (!like) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
//     }
//     Logs(req, Constants.DATA_SAVED, next);
//     return Helper.successMsg(res, Constants.DATA_SAVED, like);
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deleteComment = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.commentIdSchema, req.body, res))
//       return;
//     await Comment.findByIdAndDelete(req.body.comment_id);
//     await deleteChildComments(req.body.comment_id);

//     Logs(req, Constants.DATA_DELETED, next);
//     return Helper.successMsg(res, Constants.DATA_DELETED, {});
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deletePost = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.postIdSchema, req.body, res))
//       return;
//     const post = await Post.findOneAndUpdate(
//       { _id: req.body.post_id, posted_by: req.user._id },
//       {
//         status: Constants.INACTIVE,
//       },
//       { new: true }
//     );
//     Logs(req, Constants.DATA_DELETED, next);
//     return Helper.successMsg(res, Constants.DATA_DELETED, {});
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const reportPost = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.reportSchema, req.body, res))
//       return;
//     const report = await Post.findByIdAndUpdate(
//       req.body.post_id,
//       {
//         $addToSet: {
//           report: {
//             reported_by: req.user._id,
//             message: req.body.message,
//           },
//         },
//       },
//       {
//         new: true,
//       }
//     );
//     Logs(req, Constants.DATA_REPORTED, next);
//     return Helper.successMsg(res, Constants.DATA_REPORTED, {});
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const reportComment = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.reportCmtSchema, req.body, res))
//       return;
//     const report = await Comment.findByIdAndUpdate(
//       req.body.comment_id,
//       {
//         $addToSet: {
//           report: {
//             reported_by: req.user._id,
//             message: req.body.message,
//           },
//         },
//       },
//       {
//         new: true,
//       }
//     );
//     Logs(req, Constants.DATA_REPORTED, next);
//     return Helper.successMsg(res, Constants.DATA_REPORTED, {});
//   } catch (err) {
//     console.log(err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getAllLikedUsersOfPost = async (req, res) => {
//   try {
//     const { post_id } = req.query;
//     const posts = await Post.findById(post_id)
//       .populate("likes", "_id first_name last_name profile_pic")
//       .select("_id likes");
//     return Helper.successMsg(res, Constants.DATA_GET, posts);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// async function deleteChildComments(parentId) {
//   const childComments = await Comment.find({ parent_id: parentId });

//   // Recursively delete child comments
//   for (const comment of childComments) {
//     await deleteChildComments(comment._id); // Recursively delete child comments of the child
//     await Comment.findByIdAndDelete(comment._id); // Delete the child comment
//   }
// }
