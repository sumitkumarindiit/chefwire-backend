import express from "express";
import * as Controller from "../controllers/index.js";
import {adminRoute, authenticate} from "../middleware/auth.js";
const admin = express.Router();

admin.post("/create-quest", authenticate, Controller.Admin.createQuest);
admin.post("/create-coupon", authenticate, Controller.Admin.createCoupon);



export default admin;