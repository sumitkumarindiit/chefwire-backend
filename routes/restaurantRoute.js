import express from "express";
import * as Controller from "../controllers/index.js";
import {authenticate} from "../middleware/auth.js";
const restaurant = express.Router();


restaurant.get("/get-categories",authenticate,Controller.Restaurant.getRestaurantCategory);





export default restaurant;