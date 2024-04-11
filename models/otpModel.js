import mongoose from "mongoose";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;
const otpSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
  },
  otp: {
    type: String,
    required: true,
  },
  isActive:{
    type: Boolean,
    default: false
  },
  status:{
    type:String,
    enum:[Constants.ACTIVE,Constants.INACTIVE],
    default:Constants.ACTIVE
  },
  type:{
    type:String,
    enum:[Constants.OTP_TYPE_FORGOT,Constants.OTP_TYPE_SIGNUP],
    default:Constants.OTP_TYPE_SIGNUP
  }
},{ timestamps: true });
const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
