import uploadToS3 from "../services/s3Services.js";
import * as Helper from "../services/HelperFunction.js";
import * as validatePost from "../services/SchemaValidate/homeSchema.js";
import { Logs } from "../middleware/log.js";
import { Constants } from "../services/Constants.js";
import Category from "../models/categoryModel.js";
import Service from "../models/serviceModel.js";

export const getDashBoard = async (req, res) => {
  try {
    const [categories,services]=await Promise.all([
      Category.find().select("name icon").lean(),
      Service.find().select("name icon").lean(),
    ]);
    const result={
      categories,
      services
    }
    return Helper.successMsg(res, Constants.DATA_GET, result);
  } catch (err) {
    console.error(err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const file = req.files?.icon;
    if (file) {
      const filenamePrefix = Date.now();
      const extension = file.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(file.data, filename, file.mimetype);
      req.body.icon = filename;
    }
    if (Helper.validateRequest(validatePost.categorySchema, req.body, res))
      return;

    const result = await Category.create(req.body);
    if (!result) {
      Logs(req, Constants.DATA_NOT_CREATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_CREATED, 404);
    }
    await Logs(req, Constants.DATA_CREATED, next);
    return Helper.successMsg(res, Constants.DATA_CREATED, passion);
  } catch (err) {
    console.log("Errors", err);
    Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const getCategory = async (req, res) => {
  try {
    const result = await Category.find().select("name icon").lean();
    return Helper.successMsg(res, Constants.DATA_GET, result);
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const updateCategory = async (req, res, next) => {
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
    const result = await Category.findByIdAndUpdate(id, rest, {
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
export const deleteCategory = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.idSchema, req.query, res)) return;
    const result = await Category.findByIdAndDelete(req.query.id);
    await Logs(req, Constants.DATA_DELETED, next);
    return Helper.successMsg(res, Constants.DATA_DELETED, {});
  } catch (err) {
    console.log(err);
    await Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const createService = async (req, res, next) => {
  try {
    const file = req.files?.icon;
    if (file) {
      const filenamePrefix = Date.now();
      const extension = file.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(file.data, filename, file.mimetype);
      req.body.icon = filename;
    }
    if (Helper.validateRequest(validatePost.categorySchema, req.body, res))
      return;

    const result = await Service.create(req.body);
    if (!result) {
      Logs(req, Constants.DATA_NOT_CREATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_CREATED, 404);
    }
    await Logs(req, Constants.DATA_CREATED, next);
    return Helper.successMsg(res, Constants.DATA_CREATED, passion);
  } catch (err) {
    console.log("Errors", err);
    Logs(req, Constants.SOMETHING_WRONG, next);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const getServices = async (req, res) => {
  try {
    const result = await Service.find().select("name icon").lean();
    return Helper.successMsg(res, Constants.DATA_GET, result);
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
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
