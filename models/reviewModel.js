import { required } from "joi";
import mongoose from "mongoose";

const Schema = mongoose.Schema;
const reviewSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  reviewedId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  reviewType: {
    type: String,
    enum: ["RESTAURANT", "CATERER"],
    default: "RESTAURANT",
  },
  rating: { type: Number, min: 1, max: 5, required: true },
  reviewText: { type: String, default: null },
},{ timestamps: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
