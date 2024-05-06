import mongoose from "mongoose";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;
const questSchema = new Schema(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },
    questTitle: {
      type: String,
      required: true,
    },
    validTill: {
      type: Date,
      default: null,
    },
    banner: {
      type: String,
    },
    rules: [String],
    startedUsers: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        expireTime: { type: Date },
      },
    ],
    excludedUsers: [{ type: Schema.Types.ObjectId }],
    completedUsers: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        expireTime: { type: Date },
      },
    ],
    status: {
      type: String,
      enum: [Constants.ACTIVE, Constants.INACTIVE],
      default: Constants.ACTIVE,
    },
  },
  { timestamps: true }
);

const Quest = mongoose.model("Quest", questSchema);
export default Quest;
