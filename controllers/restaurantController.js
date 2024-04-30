//Catering Section
import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import { Logs } from "../middleware/log.js";
import * as Helper from "../services/HelperFunction.js";
import * as validatePost from "../services/SchemaValidate/homeSchema.js";
import * as validateUser from "../services/SchemaValidate/userSchema.js";
import { Constants, SocketEvent } from "../services/Constants.js";
import Role from "../models/roleAndPermissionModel.js";
import uploadToS3 from "../services/s3Services.js";
import Address from "../models/addressModel.js";
import { merchantCommonAggregation } from "../services/userService.js";
import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import RestaurantMenu from "../models/restaurantMenuModel.js";
import Order from "../models/orderModel.js";
import user from "../routes/userRoute.js";
import { Notifications } from "../middleware/notification.js";

export const getRestaurantCategory = async (req, res) => {
  try {
    const result = await Category.find({ restaurantId: req.user._id })
      .select("name")
      .lean();
    if (!result) {
      return Helper.errorMsg(res, Constants.DATA_NOT_FETCHED, 404);
    }
    return Helper.successMsg(res, Constants.DATA_FETCHED, result);
  } catch (err) {
    console.log("Errors", err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const getRestaurantMenu = async (req, res) => {
  try {
    console.log(req.user._id);
    if (Helper.validateRequest(validatePost.getMenuSchema, req.query, res))
      return;
    const { categoryId, menuId, type } = req.query;
    let match = {};
    let project = {
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      categoryId: 0,
      ...(type === "CATERING" && { price: 0 }),
    };
    if (categoryId) {
      match = { categoryId: new mongoose.Types.ObjectId(categoryId) };
    }
    if (menuId) {
      match = { _id: new mongoose.Types.ObjectId(menuId) };
    }
    const aggregate = [
      {
        $match: match,
      },
      {
        $project: project,
      },
    ];
    const result = await RestaurantMenu.aggregate(aggregate);
    if (!result) {
      return Helper.errorMsg(res, Constants.DATA_NOT_FETCHED, 200);
    }
    return Helper.successMsg(res, Constants.DATA_FETCHED, result);
  } catch (err) {
    console.log("Errors", err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const makeOrder = async (req, res) => {
  try {
    if (Helper.validateRequest(validatePost.makeOrderSchema, req.body, res))
      return;
    const orderId =Helper.generateOrderId();
    const isOrder = await Order.findOne({orderId});
    if(isOrder){
      return makeOrder(req,res)
    }
    const result = await Order.create({
      userId: req.user._id,
      orderId,
      ...req.body,
    });
    if (!result) {
      return Helper.errorMsg(res, Constants.DATA_NOT_CREATED, 200);
    }
    const payload = await Order.findById(result._id).lean();
    Notifications(
      req,
      Helper.Sender(req),
      result.restaurantId,
      "New Booking",
      `A new booking has been made for the event ${result.eventType} on ${result.eventDate} at ${result.eventTime}.`,
      SocketEvent.NEW_BOOKING,
      null,
      payload
    );
    Notifications(
      req,
      result.restaurantId,
      Helper.Sender(req),
      "Order Confirmation",
      `Your order #${result.orderId} has been confirmed! Get ready for delicious food coming your way.`,
      SocketEvent.NEW_BOOKING,
      null,
      payload
    );
    return Helper.successMsg(res, Constants.DATA_CREATED, result);
  } catch (err) {
    console.log("Errors", err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
