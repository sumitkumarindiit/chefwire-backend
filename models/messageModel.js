import mongoose, { Schema } from "mongoose";
import { Constants } from "../services/Constants.js";

const messageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    mentions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User',index:true },  
        position: {
          type:Number
        }
      }
    ],
    readStatus:{
      type:Boolean,
      default:false
    },
    media:[],
    links:[],
    status: {
      type: String,
      enum: [Constants.ACTIVE, Constants.INACTIVE],
      default: Constants.ACTIVE,
    },
  },
  { timestamps: true }
);
const Message = mongoose.model("Message", messageSchema);
export default Message;
