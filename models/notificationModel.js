import mongoose from "mongoose";
import User from "./userModel.js";
import {Constants} from "../services/Constants.js";

const Schema = mongoose.Schema;
const notificationSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: User
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: User
    },
    message:{
      type:String,
      default:null
    },
    payload:{
      type: Object,
      default: null,
    },
    type:{
      type:String,
      enum:[Constants.GROUP_MEMBER_ADDED,Constants.LIKE_POST,Constants.LIKE_COMMENT,Constants.COMMENT_POST,Constants.ACCEPT_REQUEST,Constants.NEW_CHAT_CREATED],
      default:Constants.LIKE_POST
    },
    userStatus:{
      type:String,
      enum: [Constants.ACTIVE, Constants.INACTIVE],
      default: Constants.ACTIVE,
    },
    status: {
      type: String,
      enum: [Constants.ACTIVE, Constants.INACTIVE],
      default: Constants.ACTIVE,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
