
import mongoose from "mongoose";

const Schema = mongoose.Schema;
const reviewSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  orderId: {
    type: String,
    required: true,
    index: true,
  },
  rating: { type: Number, min: 1, max: 5, required: true },
  reviewText: { type: String, default: null },
},{ timestamps: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
