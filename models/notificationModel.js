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
    title:{
      type:String,
      default:null
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
      enum:["ORDER","POST"],
      default:"ORDER"
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
