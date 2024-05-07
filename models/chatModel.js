import mongoose from "mongoose";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;
const chatSchema = new Schema(
  {
    admin: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    chatIcon:{
      type:String,
      default:null,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    notificationMuted: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default:null
      },
    ],
    deletedBy:[
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default:null
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default:null
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    name: {
      type: String,
      required: true,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [Constants.ACTIVE, Constants.INACTIVE],
      default: Constants.ACTIVE,
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
