import mongoose from "mongoose";

const Schema = mongoose.Schema;
const dineInSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      index: true,
      required: true,
    },
    tableNo: {
      type: String,
      required: true,
    },
    capacity: { type: Number, default: true },
    
  },
  { timestamps: true }
);

const DineIn = mongoose.model("DineIn", dineInSchema);
export default DineIn;
