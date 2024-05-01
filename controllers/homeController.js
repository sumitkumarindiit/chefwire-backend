import uploadToS3 from "../services/s3Services.js";
import * as Helper from "../services/HelperFunction.js";
import * as validateUser from "../services/SchemaValidate/userSchema.js";
import * as validatePost from "../services/SchemaValidate/homeSchema.js";
import { Logs } from "../middleware/log.js";
import { Constants } from "../services/Constants.js";
import Category from "../models/categoryModel.js";
import Service from "../models/serviceModel.js";
import Offer from "../models/offerModel.js";
import Coupon from "../models/couponModel.js";
import Quest from "../models/questModel.js";
import mongoose from "mongoose";
import { merchantCommonAggregation } from "../services/userService.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";


const offerAggregation = [
  {
    $match: {
      validTill: { $gt: new Date() },
      status: Constants.ACTIVE,
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

export const updateCurrentLocation = async (req, res) => {};
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
export const getRestaurants = async (req, res) => {
  try {
    let service = req.query.services;
    if (service) {
      req.query.services = JSON.parse(service);
    }
    if (Helper.validateRequest(validateUser.getmerchantSchema, req.query, res))
      return;
    let { restaurantId, services, sortBy, rating, search } = req.query;
    let sort = {
      distance: 1,
    };
    let match = {};
    if (services) {
      match = { services: { $elemMatch: { $in: services } } };
    }
    if (rating) {
      match = { rating: { $gte: +rating } };
    }
    if (search) {
      match = {
        ...match,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }
    if (sortBy) {
      if (sortBy === "distance1") {
        sort = {
          distance: 1,
        };
      }
      if (sortBy === "distance0") {
        sort = {
          distance: -1,
        };
      }
      if (sortBy === "rating0") {
        sort = {
          rating: -1,
        };
      }
      if (sortBy === "rating1") {
        sort = {
          rating: 1,
        };
      }
    }
    const aggregate = [
      ...(restaurantId
        ? [
            {
              $match: { _id: new mongoose.Types.ObjectId(restaurantId) },
            },
          ]
        : []),
      ...(restaurantId
        ? []
        : [
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: req.user.currentAddress.coordinates,
                },
                distanceField: "distance",
                maxDistance: 6000000,
                spherical: true,
              },
            },
          ]),
      {
        $addFields: {
          distance: { $divide: ["$distance", 1000] },
        },
      },
      ...merchantCommonAggregation(),
      {
        $match: match,
      },
      {
        $sort: sort,
      },
    ];
    const result = await User.aggregate(aggregate);
    return Helper.successMsg(res, Constants.DATA_FETCHED, result);
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, err, 500);
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
export const getQuest = async (req, res) => {
  try {
    if (Helper.validateRequest(validatePost.getQuestSchema, req.query, res))
      return;
    const { questId } = req.query;
    let totalOrders, completedOrders;
    let match = { validTill: { $gt: new Date() }, status: Constants.ACTIVE };
    if (questId) {
      match = { _id: new mongoose.Types.ObjectId(questId) };
      let [quest, totalCompOrders] = await Promise.all([
        Quest.findById(questId).select("questTitle").lean(),
        Helper.HowManyOrderByUser(req.user._id),
      ]);
      if (quest.questTitle.toLowerCase() === "order 3 times") {
        totalOrders = 3;
        completedOrders = totalCompOrders;
      }
    }
    const aggregate = [
      {
        $match: match,
      },

      ...(questId
        ? [
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
                      discount: 1,
                      discountType: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                totalOrders: totalOrders,
                completedOrders: completedOrders,
              },
            },
          ]
        : []),
      // {
      //   $addFields: {

      //     expireIn: {
      //       $round:{
      //         $divide: [
      //           { $subtract: ["$validTill", new Date()] },
      //           1000 * 60 * 60 * 24,
      //         ],
      //       }

      //     },
      //   },
      // },
      {
        $project: {
          banner: 1,
          validTill: 1,
          questTitle: 1,
          coupon: 1,
          totalOrders: 1,
          completedOrders: 1,
        },
      },
    ];
    const result = await Quest.aggregate(aggregate);
    if (!result) {
      return Helper.errorMsg(res, Constants.DATA_NOT_FETCHED, 404);
    }
    return Helper.successMsg(res, Constants.DATA_FETCHED, result);
  } catch (err) {
    console.log("Errors", err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const getNotifications = async (req, res) => {
  try {
    // if (Helper.validateRequest(validatePost.getQuestSchema, req.query, res))
    //   return;
    const result = await Notification.find({ receiver: req.user._id })
      .select("title message payload createdAt")
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
