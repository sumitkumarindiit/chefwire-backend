import mongoose from "mongoose";
import User from "./userModel.js";

const Schema = mongoose.Schema;
const logSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: User,
    },
    route: {
      type: String,
      default: null,
    },
    method: {
      type: String,
      default: null,
    },
    ip_address: {
      type: String,
    },
    browser: {
      type: String,
    },
    device: {
      type: String,
    },
    os: {
      type: String,
    },
    message:{
      type: String,
    }
  },
  { timestamps: true }
);

const Log = mongoose.model("Log", logSchema);
export default Log;
