import mongoose from "mongoose";

const Schema = mongoose.Schema;
const restaurantMenuSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      index: true,
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      index: true,
      default: null,
    },
    name: {
      type: String,
      lowercase:true,
      required: true,
    },
    nutrition: [{ name: { type: String }, value: { type: Number } }],
    description: {
      type: String,
      required: true,
    },
    price: [{ size: { type: String }, price: { type: Number } }],
    profilePic: { type: String },
  },
  { timestamps: true }
);

const RestaurantMenu = mongoose.model("RestaurantMenu", restaurantMenuSchema);
export default RestaurantMenu;
