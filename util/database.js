import mongoose from "mongoose";
import {Constants} from "../services/Constants.js";

export const mongoConnect = () => {
  return mongoose.connect(`${process.env.MONGO_URI}${Constants.DB_NAME}`);
};