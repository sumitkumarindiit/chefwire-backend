import uploadToS3 from "../services/s3Services.js";
import * as Helper from "../services/HelperFunction.js";
import * as validatePost from "../services/SchemaValidate/homeSchema.js";
import { Logs } from "../middleware/log.js";
import { Constants } from "../services/Constants.js";
import Category from "../models/categoryModel.js";
import Service from "../models/serviceModel.js";
import Offer from "../models/offerModel.js";
import Coupon from "../models/couponModel.js";
import Quest from "../models/questModel.js";

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

export const getCategory = async (req, res) => {
  try {
    const result = await Category.find().select("name icon").lean();
    return Helper.successMsg(res, Constants.DATA_GET, result);
  } catch (err) {
    console.log(err);
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

