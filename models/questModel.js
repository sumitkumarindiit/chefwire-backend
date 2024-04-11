import mongoose from "mongoose";
import { Constants } from "../services/Constants";

const Schema = mongoose.Schema;
const questSchema = new Schema({
  couponId: {
    type: Schema.Types.ObjectId,
    ref: "Coupon",
    required: true,
    index: true,
  },
  questTitle: {
    type: String,
    required:true
  },
  validTill: {
    type: Date,
    default: null,
  },
  rules:[String],
  startedUsers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      time: { type: Date, default: Date.now() },
    },
  ],
  failedUsers:[{type:Schema.Types.ObjectId}],
  completedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  status: {
    type: String,
    enum: [Constants.ACTIVE, Constants.INACTIVE],
    default: Constants.ACTIVE,
  },
},{timestamps:true});

const Quest = mongoose.model("Quest", questSchema);
export default Quest;
