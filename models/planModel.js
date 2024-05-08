import mongoose from "mongoose";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;

const planSchema = new Schema({
  name: {
    type: String,
    enum: ["FREE", "GOLD", "PLATINUM"],
    default: "FREE",
    index: true,
  },
  features: [String],
  status: {
    type: String,
    enum: [Constants.ACTIVE, Constants.INACTIVE],
    default: Constants.ACTIVE,
  },
});

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
