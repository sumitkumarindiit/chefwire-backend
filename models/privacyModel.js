import mongoose from "mongoose";
import {Constants} from "../services/Constants.js";

const Schema = mongoose.Schema;

const privacySchema = new Schema(
  {
    name: {
      type: String,
      enum:["PRIVACY","TERM"],
      default:"PRIVACY"
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: [Constants.ACTIVE, Constants.INACTIVE],
      default: Constants.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);
const Privacy= mongoose.model("Privacy", privacySchema);
export default Privacy;
