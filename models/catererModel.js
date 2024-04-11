import mongoose from "mongoose";

const Schema = mongoose.Schema;
const catererSchema = new Schema({
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
  profilePic:{type:String}
},{ timestamps: true });

const Caterer = mongoose.model("Caterer", catererSchema);
export default Caterer;
