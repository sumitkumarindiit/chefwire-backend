import mongoose from "mongoose";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;
const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    catererId: {
      type: Schema.Types.ObjectId,
      ref: "Caterer",
      default: null,
    },
    dineInId: {
      type: Schema.Types.ObjectId,
      ref: "DineIn",
      default: null,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      default: null,
    },
    orderType: {
      type: String,
      enum: ["CATERER", "DINEIN", "GENERAL"],
      default: "GENERAL",
    },
    paymentMethod:{
      type:String,
    },
    items: [],
    eventName: {
      type: String,
      default: null,
    },
    eventType: {
      type: String,
      default: null,
    },
    eventDate: {
      type: Date,
      default: null,
    },
    eventTime: {
      type: String,
      default: null,
    },
    NoOfGuest: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default:null,
    },
    appliedCoupon: {
      type: String,
      default:null
    },
    status: {
      type: String,
      enum: [Constants.ACTIVE, Constants.INACTIVE, "CANCELLED","COMPLETED"],
      default: Constants.ACTIVE,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
