import mongoose from "mongoose";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;
const offerSchema = new Schema(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },
    typeId: {
      type: Schema.Types.ObjectId,
      index: true,
      default:null
    },
    type: {
      type: String,
      enum: ["RESTAURANT", "DINEIN", "CATERER", "FOOD", "GLOBAL", "QUEST"],
      required: true,
    },
    category: {
      type: String,
      enum: ["RESTAURANT", "DINEIN", "CATERER", "FOOD", "QUEST"],
      required: true,
    },
    name: {
      type: String,
      default:null
    },
    banner: {
      type: String,
      required: true,
    },
    validTill: {
      type: Date,
      default: null,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
