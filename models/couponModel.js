import mongoose from "mongoose";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;
const couponSchema = new Schema({
  code: {
    type: String,
    uppercase: true,
    required: true,
    index: true,
  },
  discout: {
    type: Number,
    required: true,
  },
  discountType: {
    type: String,
    enum: ["FLAT", "UPTO"],
    default: "UPTO",
  },
  validTill: {
    type: Date,
    default: null,
  },
  isGlobal: {
    type: Boolean,
    default: false,
  },
  users: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      validTill: { type: Date },
    },
  ],
  status: {
    type: String,
    enum: [Constants.ACTIVE, Constants.INACTIVE],
    default: Constants.ACTIVE,
  },
},{ timestamps: true });

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
