import uploadToS3 from "../services/s3Services.js";
import * as Helper from "../services/HelperFunction.js";
import * as validatePost from "../services/SchemaValidate/homeSchema.js";
import { Logs } from "../middleware/log.js";
import { Constants } from "../services/Constants.js";
import Category from "../models/categoryModel.js";
import Service from "../models/serviceModel.js";
import Offer from "../models/offerModel.js";
import Coupon from "../models/couponModel.js";

const offerAggregation = [
  {
    $match: {
      validTill: { $gt: new Date() },
    },
  },
  {
    $lookup: {
      from: "coupons",
      localField: "couponId",
      foreignField: "_id",
      as: "coupon",
      pipeline: [
        {
          $project: {
            code: 1,
          },
        },
      ],
    },
  },
  {
    $unwind: {
      path: "$coupon",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $addFields: {
      coupon: "$coupon.code",
    },
  },
  {
    $project: {
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      status: 0,
      couponId: 0,
    },
  },
];

export const updateCurrentLocation = async(req,res)=>{
  
}
export const getDashBoard = async (req, res) => {
  try {
    const [offers, categories, services] = await Promise.all([
      Offer.aggregate(offerAggregation),
      Category.find().select("name icon").lean(),
      Service.find().select("name icon").lean(),
    ]);
    const result = {
      offers,
      categories,
      services,
    };
    return Helper.successMsg(res, Constants.DATA_GET, result);
  } catch (err) {
    console.error(err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};

export const createCategory = async (req, res, next) => {
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
    const isCategory = await Category.findOne({ name: req.body.name });
    if (isCategory) {
      return Helper.errorMsg(res, Constants.DATA_EXIST, 200);
    }
    const filenamePrefix = Date.now();
    const extension = file.name.split(".").pop();
    const filename = filenamePrefix + "." + extension;
    await uploadToS3(file.data, filename, file.mimetype);
    req.body.icon = filename;

    const result = await Category.create(req.body);
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
export const createOffer = async (req, res, next) => {
  try {
    const file = req.files?.banner;
    if (
      Helper.validateRequest(
        validatePost.offerSchema,
        { ...req.body, banner: file.data },
        res
      )
    )
      return;
    const isCouponAvailable = await Coupon.findOne({
      _id: req.body.couponId,
      validTill: { $gte: req.body.validTill },
    });
    if (!isCouponAvailable) {
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
export const createQuest = async (req, res, next) => {
  try {
    const file = req.files?.banner;
    if (
      Helper.validateRequest(
        validatePost.offerSchema,
        { ...req.body, banner: file.data },
        res
      )
    )
      return;
    const isCouponAvailable = await Coupon.findOne({
      _id: req.body.couponId,
      validTill: { $gte: req.body.validTill },
    });
    if (!isCouponAvailable) {
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
