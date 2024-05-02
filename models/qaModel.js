import mongoose from "mongoose";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;
const qnaSchema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
    index: true,
  },
  question: {
    type: String,
    required:true
  },
  answer: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    default:1
  },
  status: {
    type: String,
    enum: [Constants.ACTIVE, Constants.INACTIVE, "CANCELLED","COMPLETED"],
    default: Constants.ACTIVE,
  },
},{ timestamps: true });

const Qna = mongoose.model("Qna", qnaSchema);
export default Qna;
