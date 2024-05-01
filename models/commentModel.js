import mongoose from "mongoose";
import Post from "./postModel.js";
import User from "./userModel.js";
import {Constants} from "../services/Constants.js";


const Schema = mongoose.Schema;
const commentSchema = new Schema(
  {
    parentId:{
      type: Schema.Types.ObjectId,
      ref: "Comment",
      index:true
    },
    repliedUserId:{
      type: Schema.Types.ObjectId,
      ref: "User",
      index:true
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: Post,
      index:true
    },
    commentedBy: {
      type: Schema.Types.ObjectId,
      ref: User,
      index:true
    },
    media: [],
    comment: {
      type: String,
      default: null,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: User,
        index:true
      },
    ],
    mentions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User',index:true },  
        position: {
          type:Number
        }
      }
    ],
    report: [
      {
        reportedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          index:true
        },
        message: { type: String },
        time: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    status: {
      type: String,
      enum: [Constants.ACTIVE, Constants.INACTIVE],
      default: Constants.ACTIVE,
      index:true
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
