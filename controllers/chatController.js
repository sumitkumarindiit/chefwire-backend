import User from "../models/userModel.js";
import * as Helper from "../services/HelperFunction.js";
import * as validateUser from "../services/SchemaValidate/userSchema.js";
import { Constants, SocketEvent } from "../services/Constants.js";
import { Logs } from "../middleware/log.js";
import uploadToS3 from "../services/s3Services.js";
import mongoose from "mongoose";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import { Notifications } from "../middleware/notification.js";
import { emitSocketEvent } from "../socket.js";

const messageCommonAggregation = () => {
  return [
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "senderId",
        as: "sender",
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
        mentionUsers: {
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
      $addFields: {
        sender: { $first: "$sender" },
      },
    },
    {
      $project: {
        mentions: 0,
      },
    },
  ];
};
const chatCommonAggregation = () => {
  return [
    {
      // lookup for the participants present
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "participants",
        as: "participants",
        pipeline: [
          {
            $lookup: {
              from: "roles",
              localField: "role",
              foreignField: "_id",
              as: "role",
              pipeline: [
                {
                  $project: {
                    role: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: {
              path: "$role",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              password: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
              status: 0,
              otpVerified: 0,
              savedPosts: 0,
              signUpType: 0,
              deviceToken: 0,
              jwtToken: 0,
              socialMediaId: 0,
              countryCode: 0,
              mobileNumber: 0,
              services: 0,
              menu: 0,
            },
          },
        ],
      },
    },
    {
      // lookup for the group chats
      $lookup: {
        from: "messages",
        foreignField: "_id",
        localField: "lastMessage",
        as: "lastMessage",
        pipeline: [
          {
            // get details of the sender
            $lookup: {
              from: "users",
              foreignField: "_id",
              localField: "senderId",
              as: "sender",
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
          {
            $addFields: {
              sender: { $first: "$sender" },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        lastMessage: { $first: "$lastMessage" },
      },
    },
  ];
};

export const createOrGetAOneOnOneChat = async (req, res) => {
  if (Helper.validateRequest(validateUser.userIdSchema, req.body, res)) return;
  const { userId } = req.body;
  const receiver = await User.findById(userId);
  if (!receiver) {
    return Helper.errorMsg(res, Constants.INVALID_ID, 404);
  }
  if (receiver._id.toString() === req.user._id.toString()) {
    return Helper.errorMsg(res, "Can not chat with your self", 400);
  }

  const chat = await Chat.aggregate([
    {
      $match: {
        isGroupChat: false,
        $and: [
          {
            participants: { $elemMatch: { $eq: req.user._id } },
          },
          {
            participants: {
              $elemMatch: { $eq: new mongoose.Types.ObjectId(userId) },
            },
          },
        ],
      },
    },
    ...chatCommonAggregation(),
  ]);

  if (chat.length) {
    // if we find the chat that means user already has created a chat
    return Helper.successMsg(res, "Chat retrieved", chat[0]);
  }

  // if not we need to create a new one on one chat
  const newChatInstance = await Chat.create({
    name: "One on one chat",
    participants: [req.user._id, new mongoose.Types.ObjectId(userId)],
    admin: [req.user._id],
    isGroupChat: false,
  });

  const createdChat = await Chat.aggregate([
    {
      $match: {
        _id: newChatInstance._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = createdChat[0]; // store the aggregation result

  if (!payload) {
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }

  // logic to emit socket event about the new chat added to the participants
  payload?.participants?.forEach((participant) => {
    if (participant._id.toString() === req.user._id.toString()) return; // don't emit the event for the logged in use as he is the one who is initiating the chat

    // emit event to other participants with new chat as a payload
    Notifications(
      req,
      Helper.Sender(req),
      participant._id,
      "Chat creation",
      " created a chat",
      SocketEvent.NEW_CHAT_EVENT,
      Constants.NEW_CHAT_CREATED,
      payload
    );
  });
  return Helper.successMsg(res, Constants.DATA_FETCHED, payload);
};
export const deleteChat = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validateUser.deleteChatSchema, req.body, res))
      return;
    const { chatId, type } = req.body;
    const group = await Chat.findByIdAndUpdate(
      chatId,
      {
        ...(type === "DELETE" && { $addToSet: { deletedBy: req.user._id } }),
        ...(type === "EXIT" && { $pull: { participants: req.user._id } }),
      },
      { new: true }
    );
    if (!group) {
      Logs(req, Constants.DATA_NOT_UPDATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_UPDATED, 404);
    }
    Logs(req, Constants.DATA_SAVED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, group);
  } catch (err) {
    return Helper.catchBlock(req, res, next, err);
  }
};
export const getAllChats = async (req, res) => {
  const { type } = req.query;
  const chats = await Chat.aggregate([
    {
      $match: {
        status: Constants.ACTIVE,
        ...(type === "GROUP" && { isGroupChat: true }),
        $and: [
          {
            participants: { $elemMatch: { $eq: req.user._id } },
          },
          { deletedBy: { $nin: [req.user._id] } },
        ],
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
    ...chatCommonAggregation(),
  ]);

  return Helper.successMsg(res, Constants.DATA_FETCHED, chats);
};

export const sendMessage = async (req, res) => {
  try {
    let obj;
    const message_files = req.files?.messageFile;
    if (message_files) {
      obj = {
        messageFile: message_files.data,
        ...req.body,
      };
    } else {
      obj = req.body;
    }
    if (Helper.validateRequest(validateUser.chatSchema, obj, res)) return;
    const { chatId, messageText } = obj;
    const selectedChat = await Chat.findById(chatId);
    if (!selectedChat) {
      return Helper.errorMsg(res, Constants.INVALID_ID, 404);
    } else if (
      !selectedChat.isGroupChat &&
      selectedChat.deletedBy.length === 1
    ) {
      const deletedUserId = selectedChat.deletedBy[0];
      await Chat.findByIdAndUpdate(chatId, {
        $pull: { deletedBy: deletedUserId },
      });
    }
    let file;
    if (message_files) {
      file = Array.isArray(message_files) ? message_files : [message_files];
    } else {
      file = null;
    }
    let url;
    if (file && file.length > 0) {
      url = await Promise.all(
        file.map(async (item) => {
          const filenamePrefix = Date.now();
          const extension = item.name.split(".").pop();
          let type = "";
          if (item.mimetype.startsWith("image")) {
            type = "IMAGE";
          } else if (item.mimetype.startsWith("video")) {
            type = "VIDEO";
          } else {
            type = extension.toUpperCase();
          }
          const filename = filenamePrefix + "." + extension;
          await uploadToS3(item.data, filename, item.mimetype);
          return { filename, type };
        })
      );
    }

    // Create a new message instance with appropriate metadata
    const links = Helper.extractUrls(messageText);
    const mentionRegex = /@\[([^\]]+)\]\((\w+)\)/g;
    const mentions = [];
    let match;
    const mail = `${Helper.capitalizeEveryWord(
      req.user.name
    )} mentioned you in group chat`;
    while ((match = mentionRegex.exec(messageText)) !== null) {
      mentions.push({
        userId: match[2],
        position: match.index,
      });
      Notifications(
        req,
        Helper.Sender(req),
        match[2],
        "Chat Mention",
        " mentioned you in group chat",
        SocketEvent.MENTIONED_YOU_IN_CHAT,
        Constants.CHAT_MENTION,
        {}
      );
    }
    mentions.sort((a, b) => a.position - b.position);
    const msgToSave = messageText.replace(mentionRegex, "").trim();
    const message = await Message.create({
      senderId: req.user._id,
      message: msgToSave,
      mentions,
      links: links,
      chatId: chatId,
      media: url,
    });

    // update the chat's last message which could be utilized to show last message in the list item
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $set: {
          lastMessage: message._id,
        },
      },
      { new: true }
    );
    const updatedUsersId = await User.find({
      _id: { $in: chat.participants },
      isOnline: false,
    });

    if (updatedUsersId.length > 0) {
      await User.updateMany(
        { _id: { $in: updatedUsersId } },
        {
          $addToSet: { unreadMessages: chat._id },
        }
      );
    }
    // structure the message
    const messages = await Message.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(message._id),
        },
      },
      ...messageCommonAggregation(),
    ]);
    // Store the aggregation result
    const receivedMessage = messages[0];

    if (!receivedMessage) {
      return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 400);
    }
    // logic to emit socket event about the new message created to the other participants
    chat.participants.forEach(async (participantObjectId) => {
      // here the chat is the raw instance of the chat in which participants is the array of object ids of users
      // avoid emitting event to the user who is sending the message
      if (participantObjectId.toString() === req.user._id.toString()) return;

      // emit the receive message event to the other participants with received message as the payload
      // if (!selectedChat.notification_muted) {
      //   Notifications(
      //     req,
      //     sender,
      //     participantObjectId,
      //     SocketEvent.NEW_MESSAGE_EVENT,
      //     " messaged you",
      //     Constants.NEW_MESSAGE,
      //     receivedMessage
      //   );
      // } else {

      const unread_msg = await User.findById(participantObjectId)
        .select("unread_messages -_id")
        .lean();
      receivedMessage.unread_messages = unread_msg.unread_messages;
      emitSocketEvent(
        req,
        participantObjectId.toString(),
        SocketEvent.NEW_MESSAGE_EVENT,
        receivedMessage,
        Helper.Sender(req)
      );
      // }
    });
    return Helper.successMsg(res, Constants.DATA_SAVED, receivedMessage);
  } catch (err) {
    return Helper.catchBlock(req,res,null, err);
  }
};
export const getMessages = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.getMessagesSchema, req.query, res))
      return;
    const { chatId, page } = req.query;

    const selectedChat = await Chat.findById(chatId);

    if (!selectedChat) {
      return Helper.errorMsg(res, Constants.INVALID_ID, 404);
    }

    // Only get messages if the logged in user is a part of the chat he is requesting messages of
    if (!selectedChat.participants?.includes(req.user?._id)) {
      return Helper.errorMsg(res,"You are not participants of this group", 200);
    }
    const limit = 10;
    const skip = (+page - 1) * limit || 0;
    const messages = await Message.aggregate([
      {
        $match: {
          chatId: new mongoose.Types.ObjectId(chatId),
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
      ...messageCommonAggregation(),
      {
        $sort: {
          createdAt: 1,
        },
      },
    ]);

    return Helper.successMsg(res, Constants.DATA_FETCHED, messages);
  } catch (err) {
    return Helper.catchBlock(req,res,null, err);
  }
};
export const getMediaAndLinksOFGroup = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.chatIdSchema, req.query, res))
        return;
    const { chatId } = req.query;
    const pipeline = [
      { $match: { chatId: new mongoose.Types.ObjectId(chatId) } },
      {
        $project: {
          _id: 0,
          media: 1,
          links: 1,
        },
      },
      {
        $group: {
          _id: null,
          media: { $push: "$media" },
          links: { $push: "$links" },
        },
      },
      {
        $project: {
          _id: 0,
          media: {
            $reduce: {
              input: "$media",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
          links: {
            $reduce: {
              input: "$links",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
        },
      },
    ];
    const media = await Message.aggregate(pipeline);
    console.log(media)
    return Helper.successMsg(res, Constants.DATA_FETCHED, media[0]);
  } catch (err) {
    return Helper.catchBlock(req,res,next, err);
  }
};
export const getUnreadMessages = async (req, res) => {
  try {
    const unreadMsg = await User.findById(req.user._id)
      .select("unreadMessages")
      .lean();
    return Helper.successMsg(
      res,
      Constants.DATA_FETCHED,
      unreadMsg.unreadMessages
    );
  } catch (err) {
    return Helper.catchBlock(req,res,null, err);
  }
};
export const updateUnreadMessages = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validateUser.updateUnreadMsgSchema, req.body, res))
        return;
    const { chatId, reset } = req.body;
    let updateQuery;

    if (!reset) {
      updateQuery = {
        $addToSet: { unreadMessages: chatId },
      };
    } else {
      updateQuery = {
        $set: { unreadMessages: [] },
      };
    }
    const unreadMsg = await User.findByIdAndUpdate(req.user._id, updateQuery);
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, {});
  } catch (err) {
    return Helper.catchBlock(req,res,next, err);
  }
};
export const getUnreadNotification = async (req, res) => {
  try {
    const unreadMsg = await User.findById(req.user._id)
      .select("unreadNotification")
      .lean();
    return Helper.successMsg(
      res,
      Constants.DATA_FETCHED,
      unreadMsg.unreadNotification
    );
  } catch (err) {
    return Helper.catchBlock(req,res,null, err);
  }
};
export const updateUnreadNotification = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validateUser.updateUnreadNotiSchema, req.body, res))
        return;
    const { reset, minus } = req.body;
    let updateQuery;
    updateQuery = {
      $inc: { unreadNotification: 1 },
    };
    if (reset) {
      updateQuery = {
        $set: { unreadNotification: 0 },
      };
    }
    if (minus) {
      updateQuery = {
        $inc: { unreadNotification: Math.max(-1, -1 * req.user.unreadNotification)  },
      };
    }
    await User.findByIdAndUpdate(req.user._id, updateQuery);
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, {});
  } catch (err) {
    return Helper.catchBlock(req,res,next, err);
  }
};
