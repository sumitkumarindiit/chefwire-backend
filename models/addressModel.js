import mongoose from "mongoose";

const Schema = mongoose.Schema;
const addressSchema = new Schema({
  addressId: {
    type: Schema.Types.ObjectId,
    index: true,
    required: true,
  },
  apartmentNo: {
    type: Number,
  },
  street: { type: String },
  landMark: { type: String },
  zipCode: { type: String },
  country: { type: String },
  addressType: {
    type: String,
    enum: ["HOME", "OFFICE", "WORK","CURRENT","OTHER","RESTAURANT"],
    default: "CURRENT",
  },
  addressTitle: { type: String,default:null },
  coordinates: { type: [Number], default: [] },
},{ timestamps: true });

const Address = mongoose.model("Address", addressSchema);
export default Address;
