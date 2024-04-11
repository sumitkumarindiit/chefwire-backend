import mongoose from "mongoose";

const Schema = mongoose.Schema;
const roleSchema = new Schema({
  role: {
    type: String,
    required:true,
    index:true,
    unique:true,
    lowercase:true
  },
  permissions: {
    type:Object,
    default:null
  },
  assignedRole:{
    type: Number,
    default: 0
  }
});
const Role = mongoose.model("Role", roleSchema);
export default Role;
