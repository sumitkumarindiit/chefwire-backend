//Catering Section
import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import { Logs } from "../middleware/log.js";
import * as Helper from "../services/HelperFunction.js";
import * as validatePost from "../services/SchemaValidate/homeSchema.js";
import * as validateUser from "../services/SchemaValidate/userSchema.js";
import { Constants } from "../services/Constants.js";
import Role from "../models/roleAndPermissionModel.js";
import uploadToS3 from "../services/s3Services.js";
import Address from "../models/addressModel.js";
import { merchantCommonAggregation } from "../services/userService.js";
import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import RestaurantMenu from "../models/restaurantMenuModel.js";

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
    if (Helper.validateRequest(validatePost.menuSchema, req.query, res)) return;
    const { categoryId, menuId } = req.query;
    let match = {};
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
