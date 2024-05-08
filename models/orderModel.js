import mongoose from "mongoose";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;
const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    slotId:{
      type: Schema.Types.ObjectId,
      default: null,
    },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      default: null,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    orderType: {
      type: String,
      enum: ["CATERER", "DINEIN", "FOOD"],
      default: "FOOD",
    },
    paymentMethod: {
      type: String,
      default:""
    },
    items: [
      {
        restaurantMenuId: {
          type: Schema.Types.ObjectId,
          ref: "RestaurantMenu",
          index: true,
          required: true,
        },
        price: [
          {
            sizeId: {
              type: Schema.Types.ObjectId,
            },
            size:{type:String},
            unitPrice: { type: Number },
            quantity: { type: Number },
          },
        ],
      },
    ],
    totalPrice:{
      type:Number
    },
    eventName: {
      type: String,
      default: null,
    },
    eventType: {
      type: String,
      lowercase: true,
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
      default: null,
    },
    status: {
      type: String,
      enum: ["CONFIRMED","DISPATCHED","OUTFORDELIVERY", "CANCELLED", "COMPLETED"],
      default: "CONFIRMED",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
