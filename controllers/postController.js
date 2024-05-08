import Comment from "../models/commentModel.js";
import Post from "../models/postModel.js";
import uploadToS3 from "../services/s3Services.js";
import * as Helper from "../services/HelperFunction.js";
import * as validatePost from "../services/SchemaValidate/postSchema.js";
import { Logs } from "../middleware/log.js";
import { Notifications } from "../middleware/notification.js";
import { Constants, SocketEvent } from "../services/Constants.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";

const commentCommonAggregation = () => {
  return [
    {
      $lookup: {
        from: "users",
        localField: "commentedBy",
        foreignField: "_id",
        as: "commentedBy",
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              profilePic: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$commentedBy",
    },
    {
      $lookup: {
        from: "users",
        localField: "repliedUserId",
        foreignField: "_id",
        as: "repliedUser",
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              profilePic: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$repliedUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "likes",
        foreignField: "_id",
        as: "likes",
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              profilePic: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "mentions.userId",
        foreignField: "_id",
        as: "mentionUsers",
      },
    },
    {
      $addFields: {
        mentions: {
          $map: {
            input: "$mentions",
            as: "mention",
            in: {
              _id: "$$mention.userId",
              name: {
                $arrayElemAt: ["$mentionUsers.name", 0],
              },
              profilePic: {
                $arrayElemAt: ["$mentionUsers.profilePic", 0],
              },
              position: "$$mention.position",
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: "comments",
        let: {
          postId: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$parentId", "$$postId"],
                  },
                  {
                    $eq: ["$status", Constants.ACTIVE],
                  },
                ],
              },
            },
          },
          {
            $count: "totalReplies",
          },
        ],
        as: "totalCommentsCount",
      },
    },
    {
      $addFields: {
        replyCount: {
          $cond: {
            if: {
              $isArray: "$totalCommentsCount",
            },
            then: {
              $ifNull: [
                {
                  $arrayElemAt: ["$totalCommentsCount.totalReplies", 0],
                },
                0,
              ],
            },
            else: 0,
          },
        },
      },
    },
    // {
    //   $addFields: {
    //     is_more: {
    //       $cond: {
    //         if: {
    //           $gt: [
    //             { $size: "$total_comments_count" },
    //             { $add: [skip, limit] }
    //           ]
    //         },
    //         then: true,
    //         else: false
    //       }
    //     }
    //   }
    // },
    {
      $project: {
        __v: 0,
        updatedAt: 0,
        status: 0,
        mentionUsers: 0,
        totalCommentsCount: 0,
      },
    },
  ];
};
export const createPost = async (req, res, next) => {
  try {
    const files = req.files?.media;

    if (files) {
      if (files && Array.isArray(files)) {
        const imgFile = files.map((file, index) => {
          return file.data;
        });
        req.body.media = imgFile;
      } else {
        req.body.media = [files.data];
      }
    }
    if (Helper.validateRequest(validatePost.postSchema, req.body, res)) return;
    let file;
    if (files) {
      file = Array.isArray(files) ? files : [files];
    } else {
      file = null;
    }
    let url;
    if (file && file.length > 0) {
      url = await Promise.all(
        file.map(async (item) => {
          const filenamePrefix = Date.now();
          const extension = item.name.split(".").pop();
          const filename = filenamePrefix + "." + extension;
          await uploadToS3(item.data, filename, item.mimetype);
          return { filename, type: item.mimetype.split("/")[0]?.toUpperCase() };
        })
      );
    }
    // const warning = await textModeration(res, obj.description);
    // if (warning) {
    //   return Helper.errorMsg(res, warning, 400);
    // }
    let tags = Helper.extractHashtags(req.body.description);
    const post = await Post.create({
      postedBy: req.user._id,
      description: req.body.description,
      tags,
      media: url,
    });
    if (!post) {
      Logs(req, Constants.DATA_NOT_CREATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_CREATED, 400);
    }
    Logs(req, Constants.DATA_CREATED, next);
    // const result = await Post.findById(post._id)
    //   .populate("posted_by", "_id first_name last_name profile_pic")
    //   .populate("likes", "_id first_name last_name profile_pic")
    //   .lean();
    // result.comments = [];
    return Helper.successMsg(res, Constants.DATA_CREATED, post);
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};

export const getAllPost = async (req, res) => {
  try {
    const { postId, postedBy, page, role } = req.query;

    let matchCondition = { status: Constants.ACTIVE };

    if (postId) {
      matchCondition = {
        _id: new mongoose.Types.ObjectId(postId),
        status: Constants.ACTIVE,
      };
    }
    if (postedBy) {
      matchCondition = {
        posted_by: new mongoose.Types.ObjectId(postedBy),
        status: Constants.ACTIVE,
      };
    }
    const limit = 10;
    const skip = page ? (page - 1) * limit : 0;

    const matchCriteria = [
      {
        $match: matchCondition,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $unwind: {
          path: "$report",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "report.reportedBy",
          foreignField: "_id",
          as: "reportedByUser",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                profilePic: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$reportedByUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          postedBy: { $first: "$postedBy" },
          tags: { $first: "$tags" },
          media: { $first: "$media" },
          description: { $first: "$description" },
          likes: { $first: "$likes" },
          shares: { $first: "$shares" },
          report: {
            $push: {
              $cond: {
                if: {
                  $eq: [{ $ifNull: ["$report", null] }, null],
                },
                then: "$$REMOVE",
                else: {
                  reportedBy: "$reportedByUser",
                  message: "$report.message",
                  time: "$report.time",
                },
              },
            },
          },
          createdAt: { $first: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "postedBy",
          foreignField: "_id",
          as: "postedBy",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                profilePic: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$postedBy",
      },
      {
        $lookup: {
          from: "users",
          localField: "shares",
          foreignField: "_id",
          as: "shares",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                profilePic: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "likes",
          foreignField: "_id",
          as: "likes",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                profilePic: 1,
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$postId", "$$postId"] },
                    { $eq: ["$status", Constants.ACTIVE] },
                  ],
                },
              },
            },
            {
              $count: "totalComments",
            },
          ],
          as: "totalCommentsCount",
        },
      },

      {
        $addFields: {
          totalComments: {
            $cond: {
              if: { $isArray: "$totalCommentsCount" },
              then: {
                $ifNull: [
                  { $arrayElemAt: ["$totalCommentsCount.totalComments", 0] },
                  0,
                ],
              },
              else: 0,
            },
          },
        },
      },

      {
        $project: {
          __v: 0,
          updatedAt: 0,
          status: 0,
          totalCommentsCount: 0,
        },
      },
      // {
      //   $lookup: {
      //     from: "comments",
      //     let: {
      //       postId: "$_id",
      //     },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $and: [
      //               {
      //                 $eq: ["$postId", "$$postId"],
      //               },
      //               {
      //                 $eq: [
      //                   {
      //                     $ifNull: ["$parentId", null],
      //                   },
      //                   null,
      //                 ],
      //               },
      //               {
      //                 $eq: ["$status", "ACTIVE"],
      //               },
      //             ],
      //           },
      //         },
      //       },
      //       {
      //         $sort: { createdAt: -1 },
      //       },
      //       {
      //         $limit: 4,
      //       },
      //       {
      //         $lookup: {
      //           from: "users",
      //           localField: "commentedBy",
      //           foreignField: "_id",
      //           as: "commentedBy",
      //           pipeline: [
      //             {
      //               $project: {
      //                 _id: 1,
      //                 name: 1,
      //                 profilePic: 1,
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
      //                 name: 1,
      //                 profilePic: 1,
      //               },
      //             },
      //           ],
      //         },
      //       },
      //       {
      //         $unwind: "$commentedBy",
      //       },
      //       {
      //         $lookup: {
      //           from: "users",
      //           localField: "mentions.userId",
      //           foreignField: "_id",
      //           as: "mentionUsers",
      //         },
      //       },
      //       {
      //         $addFields: {
      //           mentions: {
      //             $map: {
      //               input: "$mentions",
      //               as: "mention",
      //               in: {
      //                 user_id: "$$mention.userId",
      //                 first_name: {
      //                   $arrayElemAt: ["$mentionUsers.name", 0],
      //                 },
      //                 last_name: {
      //                   $arrayElemAt: ["$mentionUsers.name", 0],
      //                 },
      //                 profile_pic: {
      //                   $arrayElemAt: ["$mentionUsers.profilePic", 0],
      //                 },
      //                 position: "$$mention.position",
      //               },
      //             },
      //           },
      //         },
      //       },
      //       {
      //         $lookup: {
      //           from: "comments",
      //           let: {
      //             commentId: "$_id",
      //           },
      //           pipeline: [
      //             {
      //               $match: {
      //                 $expr: {
      //                   $and: [
      //                     {
      //                       $eq: ["$parentId", "$$commentId"],
      //                     },
      //                     {
      //                       $eq: ["$status", Constants.ACTIVE],
      //                     },
      //                   ],
      //                 },
      //               },
      //             },
      //             {
      //               $count: "replyCount", // Count the number of replies
      //             },
      //           ],
      //           as: "replies", // Store the replies in a field called "replies"
      //         },
      //       },
      //       {
      //         $addFields: {
      //           replyCount: {
      //             $sum: "$replies.replyCount",
      //           }, // Sum up the reply counts for all replies
      //         },
      //       },
      //       {
      //         $project: {
      //           _id: 1,
      //           parentId: 1,
      //           postId: 1,
      //           commentedBy: 1,
      //           media: 1,
      //           comment: 1,
      //           likes: 1,
      //           mentions: 1,
      //           createdAt: 1,
      //           replyCount: 1,
      //         },
      //       },
      //     ],
      //     as: "comments",
      //   },
      // },
    ];

    const posts = await Post.aggregate(matchCriteria);
    return Helper.successMsg(res, Constants.DATA_GET, posts);
  } catch (err) {
    Helper.catchBlock(req, res, null, err);
  }
};

export const getAllCommentsOfPost = async (req, res) => {
  if (Helper.validateRequest(validatePost.postIdSchema, req.query, res)) return;
  const { postId, page } = req.query;
  const limit = 10;
  const skip = page ? (page - 1) * limit : 0;
  const criteria = [
    {
      $match: {
        postId: new mongoose.Types.ObjectId(postId),
        status: Constants.ACTIVE,
        parentId: null,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    ...commentCommonAggregation(),
  ];

  try {
    const [comments, commentsCount] = await Promise.all([
      Comment.aggregate(criteria),
      Comment.countDocuments({
        postId,
        status: Constants.ACTIVE,
        parentId: null,
      }),
    ]);
    const hasMoreComments = commentsCount > page * limit;
    return Helper.successMsg(res, Constants.DATA_GET, {
      comments,
      hasMoreComments,
    });
  } catch (err) {
    Helper.catchBlock(req, res, null, err);
  }
};
export const getAllRepliesOfComments = async (req, res) => {
  if (Helper.validateRequest(validatePost.commentIdSchema, req.query, res))
    return;
  const { commentId, page } = req.query;
  const limit = 10;
  const skip = page ? (page - 1) * limit : 0;
  const criteria = [
    {
      $match: {
        parentId: new mongoose.Types.ObjectId(commentId),
        status: Constants.ACTIVE,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    ...commentCommonAggregation(),
  ];

  try {
    const replies = await Comment.aggregate(criteria);
    return Helper.successMsg(res, Constants.DATA_FETCHED, replies);
  } catch (err) {
    Helper.catchBlock(req, res, null, err);
  }
};

export const likePost = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.postIdSchema, req.body, res))
      return;
    const like = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $addToSet: { likes: req.user._id },
      },
      {
        new: true,
      }
    )
      .populate("postedBy", "name profilePic")
      .populate("likes", "name profilePic")
      .select("-__v -updatedAt -status")
      .lean();
    if (!like) {
      Logs(req, Constants.DATA_NOT_CREATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_CREATED, 200);
    }
    Logs(req, Constants.DATA_UPDATED, next);
    if (req.user._id.toString() !== like.postedBy._id.toString()) {
      Notifications(
        req,
        Helper.Sender(req),
        like.postedBy._id,
        "Post Like",
        " liked your post",
        SocketEvent.LIKE_POST_EVENT,
        Constants.POST,
        like
      );
    }

    return Helper.successMsg(res, Constants.DATA_UPDATED, like);
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const unLikePost = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.postIdSchema, req.body, res))
      return;
    const like = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $pull: { likes: req.user._id },
      },
      {
        new: true,
      }
    )
      .populate("postedBy", "name profilePic")
      .select("-__v -updatedAt -status");
    if (!like) {
      Logs(req, Constants.DATA_NOT_UPDATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_UPDATED, 200);
    }
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, like);
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const sharePost = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.postIdSchema, req.body, res))
      return;
    const share = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $addToSet: { shares: req.user._id },
      },
      {
        new: true,
      }
    )
      .populate("postedBy", "name profilePic")
      .populate("shares", "name profilePic")
      .select("-__v -updateAt -status")
      .lean();
    if (!share) {
      Logs(req, Constants.DATA_NOT_UPDATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_UPDATED, 400);
    }
    Notifications(
      req,
      Helper.Sender(req),
      share.postedBy._id,
      "Post Share",
      "Shared your post",
      SocketEvent.COMMENT_POST_EVENT,
      Constants.POST,
      share
    );
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, share);
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};

export const commentPost = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.commentSchema, req.body, res))
      return;
    let file;
    if (req.files?.file) {
      file = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
    } else {
      file = null;
    }

    let url;
    if (file && file.length > 0) {
      url = await Promise.all(
        file.map(async (item) => {
          const filenamePrefix = Date.now();
          const extension = item.name.split(".").pop();
          const filename = filenamePrefix + "." + extension;
          await S3Service.uploadToS3(item.data, filename, item.mimetype);
          return { filename, type: item.mimetype.split("/")[0]?.toUpperCase() };
        })
      );
    }
    const { comment, postId, parentId, repliedUserId } = req.body;
    // const warning = await textModeration(res, comment);
    // if (warning) {
    //   return Helper.errorMsg(res, warning, 400);
    // }
    const mentionRegex = /@\[([^\]]+)\]\((\w+)\)/g;
    // Extract mentions from the body text along with their positions
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(comment)) !== null) {
      mentions.push({
        userId: match[2],
        position: match.index,
      });
    }

    // Sort mentions by position
    mentions.sort((a, b) => a.position - b.position);

    // Extract comments from the body text
    const commentToSave = comment.replace(mentionRegex, "").trim();
    const [comments, post] = await Promise.all([
      Comment.create({
        postId,
        parentId,
        commentedBy: req.user._id,
        repliedUserId,
        comment: commentToSave,
        mentions,
        media: url,
      }),
      Post.findById(postId),
    ]);

    if (!comments) {
      Logs(req, Constants.DATA_NOT_CREATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 400);
    }
    const result = await Comment.findById(comments._id)
      .populate("commentedBy", "_id name profilePic")
      .populate("mentions.userId", "_id name");
    Logs(req, Constants.DATA_CREATED, next);
    req.user._id.toString() !== post.postedBy.toString() &&
      Notifications(
        req,
        Helper.Sender(req),
        post.postedBy,
        "Post Comment",
        " commented on your post",
        SocketEvent.COMMENT_POST_EVENT,
        Constants.COMMENT_POST,
        post
      );
    return Helper.successMsg(res, Constants.DATA_CREATED, result);
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const savePost = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.postIdSchema, req.body, res))
      return;
    const { postId } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      return Helper.errorMsg(res, Constants.INVALID_ID, 200);
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { savedPosts: postId },
      },
      { new: true }
    );
    return Helper.successMsg(res, Constants.DATA_UPDATED, {});
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const likeComment = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.likeCmtSchema, req.body, res))
      return;
    const like = await Comment.findByIdAndUpdate(
      req.body.commentId,
      {
        $addToSet: { likes: req.user._id },
      },
      {
        new: true,
      }
    )
      .populate("commentedBy", "name profilePic")
      .populate("likes", "name profilePic")
      .select("-__v -updatedAt -status")
      .lean();
    if (!like) {
      Logs(req, Constants.DATA_NOT_UPDATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_UPDATED, 400);
    }
    Logs(req, Constants.DATA_UPDATED, next);
    if (req.user._id.toString() !== like.commentedBy._id.toString()) {
      Notifications(
        req,
        Helper.Sender(req),
        like.commentedBy._id,
        "Comment Like",
        " liked your comment",
        SocketEvent.LIKE_COMMENT_EVENT,
        Constants.POST,
        like
      );
    }
    return Helper.successMsg(res, Constants.DATA_UPDATED, like);
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const unLikeComment = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.likeCmtSchema, req.body, res))
      return;
    const like = await Comment.findByIdAndUpdate(
      req.body.commentId,
      {
        $pull: { likes: req.user._id },
      },
      {
        new: true,
      }
    )
      .populate("commentedBy", "name profilePic")
      .populate("likes", "name profilePic")
      .select("-__v -updatedAt -status");
    if (!like) {
      Logs(req, Constants.DATA_NOT_UPDATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_UPDATED, 400);
    }
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, like);
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const deleteComment = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.commentIdSchema, req.query, res))
      return;
    await Comment.findByIdAndDelete(req.body.commentId);
    await deleteChildComments(req.body.commentId);

    Logs(req, Constants.DATA_DELETED, next);
    return Helper.successMsg(res, Constants.DATA_DELETED, {});
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const deletePost = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.postIdSchema, req.body, res))
      return;
    console.log(req.body.postId, req.user._id);
    const post = await Post.findOneAndUpdate(
      { _id: req.body.postId, postedBy: req.user._id },
      {
        status: Constants.INACTIVE,
      },
      { new: true }
    );
    if (!post) {
      Logs(req, Constants.INVALID_ID, next);
      return Helper.errorMsg(res, Constants.INVALID_ID, 200);
    }
    Logs(req, Constants.DATA_DELETED, next);
    return Helper.successMsg(res, Constants.DATA_DELETED, {});
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
export const reportPost = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.reportSchema, req.body, res))
      return;
    const report = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $addToSet: {
          report: {
            reportedBy: req.user._id,
            message: req.body.message,
          },
        },
      },
      {
        new: true,
      }
    );
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, {});
  } catch (err) {
    Helper.catchBlock(req, res, next, err);
  }
};
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
export const getAllLikedUsersOfPost = async (req, res) => {
  try {
    if (Helper.validateRequest(validatePost.postIdSchema, req.query, res))
      return;
    const { postId } = req.query;
    const posts = await Post.findById(postId)
      .populate("likes", "name profilePic")
      .select("_id likes");
    return Helper.successMsg(res, Constants.DATA_FETCHED, posts);
  } catch (err) {
    Helper.catchBlock(req,res,null,err);
  }
};
async function deleteChildComments(parentId) {
  const childComments = await Comment.find({ parentId: parentId });

  for (const comment of childComments) {
    await deleteChildComments(comment._id); // Recursively delete child comments of the child
  }
  await Comment.deleteMany({ _id: { $in: childComments.map((c) => c._id) } });
}
