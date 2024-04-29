import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";
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
import Coupon from "../models/couponModel.js";
import Quest from "../models/questModel.js";

export const updateService = async (req, res, next) => {
  try {
    const file = req.files?.icon;
    if (file) {
      const filenamePrefix = Date.now();
      const extension = file.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(file.data, filename, file.mimetype);
      req.body.icon = filename;
    }
    if (
      Helper.validateRequest(validatePost.updateCategorySchema, req.body, res)
    )
      return;
    const { id, ...rest } = req.body;
    const result = await Service.findByIdAndUpdate(id, rest, {
      new: true,
    })
      .select("name icon")
      .lean();
    if (!result) {
      Logs(req, Constants.DATA_NOT_UPDATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_UPDATED, 404);
    }
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, result);
  } catch (err) {
    console.log(err);
    Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const deleteService = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.idSchema, req.query, res)) return;
    const result = await Service.findByIdAndDelete(req.query.id);
    await Logs(req, Constants.DATA_DELETED, next);
    return Helper.successMsg(res, Constants.DATA_DELETED, {});
  } catch (err) {
    console.log(err);
    await Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const createOffer = async (req, res, next) => {
  try {
    const file = req.files?.banner;
    if (
      Helper.validateRequest(
        validatePost.offerSchema,
        { ...req.body, banner: file?.data },
        res
      )
    )
      return;
    const isCouponAvailable = await Coupon.findOne({
      _id: req.body.couponId,
      validTill: { $gte: req.body.validTill },
    });
    if (!isCouponAvailable || isCouponAvailable.status===Constants.INACTIVE) {
      return Helper.warningMsg(
        res,
        "Coupon validity should be more or eqaul to offer validity"
      );
    }
    const filenamePrefix = Date.now();
    const extension = file.name.split(".").pop();
    const filename = filenamePrefix + "." + extension;
    await uploadToS3(file.data, filename, file.mimetype);
    req.body.banner = filename;
    const result = await Offer.create(req.body);
    if (!result) {
      Logs(req, Constants.DATA_NOT_CREATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_CREATED, 404);
    }
    await Logs(req, Constants.DATA_CREATED, next);
    return Helper.successMsg(res, Constants.DATA_CREATED, result);
  } catch (err) {
    console.log("Errors", err);
    Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const createService = async (req, res, next) => {
  try {
    const file = req.files?.icon;
    if (
      Helper.validateRequest(
        validatePost.categorySchema,
        { ...req.body, icon: file.data },
        res
      )
    )
      return;
    const isService = await Service.findOne({ name: req.body.name });
    if (isService) {
      return Helper.errorMsg(res, Constants.DATA_EXIST, 200);
    }
    const filenamePrefix = Date.now();
    const extension = file.name.split(".").pop();
    const filename = filenamePrefix + "." + extension;
    await uploadToS3(file.data, filename, file.mimetype);
    req.body.icon = filename;
    const result = await Service.create(req.body);
    if (!result) {
      Logs(req, Constants.DATA_NOT_CREATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_CREATED, 404);
    }
    await Logs(req, Constants.DATA_CREATED, next);
    return Helper.successMsg(res, Constants.DATA_CREATED, result);
  } catch (err) {
    console.log("Errors", err);
    Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};

export const createQuest = async (req, res, next) => {
  try {
    const file = req.files?.banner;
    if (
      Helper.validateRequest(
        validatePost.questSchema,
        { ...req.body, banner: file?.data },
        res
      )
    )
      return;
    const isCouponAvailable = await Coupon.findOne({
      _id: req.body.couponId,
      validTill: { $gte: new Date(req.body.validTill) },
    });
    if (!isCouponAvailable || isCouponAvailable.status===Constants.INACTIVE) {
      return Helper.warningMsg(
        res,
        "Coupon validity should be more or eqaul to quest validity"
      );
    }
    const filenamePrefix = Date.now();
    const extension = file.name.split(".").pop();
    const filename = filenamePrefix + "." + extension;
    await uploadToS3(file.data, filename, file.mimetype);
    req.body.banner = filename;
    const result = await Quest.create(req.body);
    if (!result) {
      Logs(req, Constants.DATA_NOT_CREATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_CREATED, 404);
    }
    await Logs(req, Constants.DATA_CREATED, next);
    return Helper.successMsg(res, Constants.DATA_CREATED, result);
  } catch (err) {
    console.log("Errors", err);
    Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const createCoupon = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.couponSchema, req.body, res))
      return;
    const result = await Coupon.create(req.body);
    if (!result) {
      Logs(req, Constants.DATA_NOT_CREATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_CREATED, 404);
    }
    await Logs(req, Constants.DATA_CREATED, next);
    return Helper.successMsg(res, Constants.DATA_CREATED, result);
  } catch (err) {
    console.log("Errors", err);
    Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
