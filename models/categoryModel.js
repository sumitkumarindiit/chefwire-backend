import mongoose from "mongoose";

const Schema = mongoose.Schema;
const categorySchema = new Schema({
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
