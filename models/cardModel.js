
import mongoose from "mongoose";

const Schema = mongoose.Schema;
const cardSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  cardHolderName: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ["DEBIT", "CREDIT"],
    default: "DEBIT",
  },
});

const Card = mongoose.model("Address", cardSchema);
export default Card;
