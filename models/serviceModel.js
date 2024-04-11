import mongoose from "mongoose";

const Schema = mongoose.Schema;
const serviceSchema = new Schema({
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
},{timestamps:true});

const Service = mongoose.model("Service", serviceSchema);
export default Service;
