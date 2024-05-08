import mongoose from "mongoose";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;
const subSchedule = {
  startTime: {
    type: String,
    uppercase: true,
    trim: true,
  },
  endTime: {
    type: String,
    uppercase: true,
    trim: true,
  },
  booked: {
    type: Number,
    default: 0,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  bookedDate: {
    type: Date,
    default: null,
  },
};
const dineInSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      index: true,
      required: true,
    },
    date:{type:Date},
    breakFastSchedule: [subSchedule],
    lunchSchedule: [subSchedule],
    dinnerSchedule: [subSchedule],
    tableCount:{type:Number,default:0},
    seatingCapacity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: [Constants.ACTIVE, Constants.INACTIVE],
      default: Constants.ACTIVE,
    },
  },
  { timestamps: true }
);

const DineIn = mongoose.model("DineIn", dineInSchema);
export default DineIn;
