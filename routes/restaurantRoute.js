import express from "express";
import * as Controller from "../controllers/index.js";
import {authenticate} from "../middleware/auth.js";
const restaurant = express.Router();


restaurant.get("/get-categories",authenticate,Controller.Restaurant.getRestaurantCategory);
restaurant.get("/get-restaurant-menu",authenticate,Controller.Restaurant.getRestaurantMenu);
restaurant.post("/make-order",authenticate,Controller.Restaurant.makeOrder);
restaurant.get("/get-order",authenticate,Controller.Restaurant.getOrder);
restaurant.patch("/cancel-order",authenticate,Controller.Restaurant.cancelOrder);
restaurant.post("/add-cart",authenticate,Controller.Restaurant.addToCart);
restaurant.get("/get-cart",authenticate,Controller.Restaurant.getCart);
restaurant.post("/feedback",authenticate,Controller.Restaurant.giveFeedback);
restaurant.get("/get-table-slots",authenticate,Controller.Restaurant.getTableSlots);





export default restaurant;