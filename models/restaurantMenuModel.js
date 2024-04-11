import mongoose from "mongoose";

const Schema = mongoose.Schema;
const restaurantMenuSchema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    index: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  veg:{type:Boolean,default:true},
  description: {
    type: String,
    required: true,
  },
  price:[{size:{type:String},price:{type:Number}}],
  profilePic:{type:String}
},{ timestamps: true });

const RestaurantMenu = mongoose.model("RestaurantMenu", restaurantMenuSchema);
export default RestaurantMenu;
