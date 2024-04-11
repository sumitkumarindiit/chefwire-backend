import mongoose from "mongoose";

const Schema = mongoose.Schema;
const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  items: [
    {
      restaurantMenuId: {
        type: Schema.Types.ObjectId,
        ref: "RestaurantMenu",
        index: true,
        required: true,
      },
      count:{type:Number}
    },
  ]
},{timestamps:true});

const Card = mongoose.model("Address", cartSchema);
export default Card;
