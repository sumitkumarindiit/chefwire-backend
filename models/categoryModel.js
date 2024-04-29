import mongoose from "mongoose";

const Schema = mongoose.Schema;
const categorySchema = new Schema({
  restaurantId:{
    type:Schema.Types.ObjectId,
    ref:"User",
    index:true,
    default:null
  },
  name: {
    type: String,
    lowercase: true,
    required: true,
    index: true,
  },
  icon: {
    type: String,
    default: null,
  },
});

const Category = mongoose.model("Category", categorySchema);
export default Category;
