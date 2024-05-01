import mongoose from "mongoose";
import userModel from "./userModel.js";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index:true
    },
    tags: [String],
    media: [],
    description: {
      type: String,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: userModel,
        index:true
      },
    ],
    shares: [
      {
        type: Schema.Types.ObjectId,
        ref: userModel,
        index:true
      },
    ],
    report: [
      {
        reportedBy: {
          type: Schema.Types.ObjectId,
          ref: userModel,
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
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);
export default Post;

