import express from "express";
import * as Controller from "../controllers/index.js";
import {authenticate} from "../middleware/auth.js";
const restaurant = express.Router();


restaurant.get("/get-categories",authenticate,Controller.Restaurant.getRestaurantCategory);
restaurant.get("/get-restaurant-menu",authenticate,Controller.Restaurant.getRestaurantMenu);
restaurant.post("/make-order",authenticate,Controller.Restaurant.makeOrder);
restaurant.post("/add-cart",authenticate,Controller.Restaurant.addToCart);
restaurant.get("/get-cart",authenticate,Controller.Restaurant.getCart);





export default restaurant;