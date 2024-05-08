import moment from "moment";
import { Logs } from "../middleware/log.js";
import * as Helper from "../services/HelperFunction.js";
import * as validatePost from "../services/SchemaValidate/homeSchema.js";
import { Constants, SocketEvent } from "../services/Constants.js";
import {
  bookTable,
  merchantCommonAggregation,
  validateCoupon,
} from "../services/userService.js";
import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import RestaurantMenu from "../models/restaurantMenuModel.js";
import Order from "../models/orderModel.js";
import { Notifications } from "../middleware/notification.js";
import Cart from "../models/cartModel.js";
import Coupon from "../models/couponModel.js";
import Review from "../models/reviewModel.js";
import DineIn from "../models/dineInModel.js";

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
    const { couponId, orderType, tableType, ...objToSave } = req.body;
    const orderId = Helper.generateOrderId();
    const isOrderID = await Order.findOne({ orderId });
    if (isOrderID) {
      return makeOrder(req, res);
    }
    let coupon = null;
    if (couponId) {
      coupon = await Coupon.findById(couponId).lean();
      if (!coupon) {
        return Helper.errorMsg(res, "Invalid coupon", 200);
      }
      const check = await validateCoupon(req, couponId);
      if (!check) {
        return Helper.errorMsg(res, "Error while validating coupon", 500);
      }
      if (check && !check.status) {
        return Helper.errorMsg(res, check.message, 200);
      }
    }
    if(orderType === "FOOD"){
      const checkPrice = await Helper.validateCartItems(objToSave.items);
      if (!checkPrice.status) {
        return Helper.errorMsg(res, checkPrice.message, 200);
      }else{
        console.log(checkPrice.totalPrice)
        return;
      }
    }
    if (orderType === "DINEIN") {
      if (!req.body.eventDate) {
        return res.status(200).json({ message: "eventDate required" });
      }
      const dine = await bookTable(
        req.body.eventDate,
        req.body.restaurantId,
        tableType,
        req.body.slotId
      );
      if (!dine) {
        return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
      }
      if (!dine.status) {
        return Helper.errorMsg(res, dine.message, 200);
      }
    }
    const result = await Order.create({
      userId: req.user._id,
      orderId,
      orderType,
      ...(couponId && { couponId }),
      ...objToSave,
    });
    if (!result) {
      return Helper.errorMsg(res, Constants.DATA_NOT_CREATED, 200);
    }
    if (couponId) {
      if (coupon.isGlobal) {
        await Coupon.findByIdAndUpdate(couponId, {
          $addToSet: { excludedUsers: req.user._id },
        });
      } else {
        await Coupon.findByIdAndUpdate(couponId, {
          $pull: { eligibleUsers: { userId: req.user._id } },
        });
      }
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
export const getOrder = async (req, res) => {
  try {
    if (Helper.validateRequest(validatePost.getOrderSchema, req.query, res))
      return;
    const userId = req.user._id;
    const { orderId, type } = req.query;
    let match = { userId };
    if (type) {
      if (type === "UPCOMING") {
        match = {
          ...match,
          status: { $in: ["CONFIRMED", "DISPATCHED", "OUTFORDELIVERY"] },
        };
      } else {
        match = {
          ...match,
          status: { $in: ["CANCELLED", "COMPLETED"] },
        };
      }
    }
    if (orderId) {
      match = {
        _id: new mongoose.Types.ObjectId(orderId),
      };
    }
    const foodAggregate = [
      {
        $unwind: {
          path: "$items",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "restaurantmenus",
          localField: "items.restaurantMenuId",
          foreignField: "_id",
          as: "restaurantMenu",
          pipeline: [
            {
              $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
                categoryId: 0,
                price: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$restaurantMenu",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          coupon: {
            $first: "$coupon",
          },
          address: {
            $first: "$address",
          },
          createdAt: {
            $first: "$createdAt",
          },
          status: {
            $first: "$status",
          },
          items: {
            $push: {
              price: "$items.price",
              restaurantMenu: "$restaurantMenu",
            },
          },
        },
      },
    ];
    const carterAggregate = [
      {
        $lookup: {
          from: "restaurantmenus",
          localField: "items",
          foreignField: "_id",
          as: "restaurantMenu",
          pipeline: [
            {
              $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
                categoryId: 0,
                price: 0,
              },
            },
          ],
        },
      },
      {
        $project: {
          items: 0,
        },
      },
    ];
    const dineAggregate = [
      {
        $lookup: {
          from: "restaurantmenus",
          localField: "items",
          foreignField: "_id",
          as: "restaurantMenu",
          pipeline: [
            {
              $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
                categoryId: 0,
                price: 0,
              },
            },
          ],
        },
      },
      {
        $project: {
          items: 0,
        },
      },
    ];
    const aggregate = [
      {
        $match: match,
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
                discount: 1,
                discountType: 1,
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
        $lookup: {
          from: "addresses",
          localField: "addressId",
          foreignField: "_id",
          as: "address",
          pipeline: [
            {
              $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$address",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          userId: 0,
          couponId: 0,
          __v: 0,
          updatedAt: 0,
          addressId: 0,
        },
      },
      {
        $facet: {
          FOOD: [
            {
              $match: {
                orderType: "FOOD",
              },
            },
            ...foodAggregate,
          ],
          CATERER: [
            {
              $match: {
                orderType: "CATERER",
              },
            },
            ...carterAggregate,
          ],
          DINEIN: [
            {
              $match: {
                orderType: "DINEIN",
              },
            },
            ...dineAggregate,
          ],
        },
      },
      {
        $project: {
          orders: {
            $concatArrays: ["$FOOD", "$CATERER", "$DINEIN"],
          },
        },
      },
      {
        $unwind: {
          path: "$orders",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { "orders.createdAt": -1 },
      },
      {
        $group: {
          _id: null,
          orders: {
            $push: "$orders",
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ];
    const result = await Order.aggregate(aggregate);
    return Helper.successMsg(res, Constants.DATA_FETCHED, result[0].orders);
  } catch (err) {
    console.log("Errors", err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const cancelOrder = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validatePost.idSchema, req.body, res)) return;
    const orderId = req.body.id;
    const isOrder = await Order.findById(orderId);
    if (!isOrder) {
      Logs(req, Constants.INVALID_ID, next);
      return Helper.errorMsg(res, Constants.INVALID_ID, 200);
    }
    if (isOrder && isOrder.status !== "CONFIRMED") {
      Logs(
        req,
        `You can not cancle if order is ${isOrder.status.toLowerCase()}`,
        next
      );
      return Helper.errorMsg(
        res,
        `You can not cancle if order is ${isOrder.status.toLowerCase()}`,
        200
      );
    }
    const result = await Order.findByIdAndUpdate(
      orderId,
      { status: "CANCELLED" },
      { new: true }
    );
    if (!result) {
      Logs(req, Constants.DATA_NOT_UPDATED, next);
      return Helper.errorMsg(res, Constants.DATA_NOT_UPDATED, 200);
    }
    Logs(req, Constants.DATA_UPDATED, next);
    return Helper.successMsg(res, Constants.DATA_UPDATED, result);
  } catch (err) {
    return Helper.catchBlock(req, res, next, err);
  }
};
export const addToCart = async (req, res) => {
  try {
    if (Helper.validateRequest(validatePost.addCartSchema, req.body, res))
      return;
    const { items } = req.body;

    const checkPrice = await Helper.validateCartItems(items);
    if (!checkPrice.status) {
      return Helper.errorMsg(res, checkPrice.message, 200);
    }
    const existingCart = await Cart.findOne({ userId: req.user._id }).populate(
      "items.restaurantMenuId"
    );

    if (!existingCart) {
      const newCart = new Cart({ userId: req.user._id, items });
      await newCart.save();
      return Helper.successMsg(res, Constants.DATA_CREATED, newCart);
    }
    const restaurantIdsSet = new Set();
    await Promise.all(
      items.map(async (item) => {
        const restaurantMenu = await RestaurantMenu.findById(
          item.restaurantMenuId
        );
        if (restaurantMenu) {
          restaurantIdsSet.add(restaurantMenu.restaurantId.toString());
        }
      })
    );

    const restaurantIds = Array.from(restaurantIdsSet);
    if (restaurantIds.length > 1) {
      return Helper.errorMsg(
        res,
        "Items contains more than one restaurant",
        200
      );
    }
    const sameRestaurant =
      restaurantIds[0] ===
      existingCart.items[0].restaurantMenuId.restaurantId.toString();
    if (!sameRestaurant) {
      existingCart.items = items;
      await existingCart.save();
      return Helper.successMsg(res, Constants.DATA_UPDATED, existingCart);
    }

    items.forEach((newItem) => {
      const existingItemIndex = existingCart.items.findIndex((item) =>
        item.restaurantMenuId.equals(newItem.restaurantMenuId)
      );

      if (existingItemIndex !== -1) {
        // If menu already exists in the cart, update the cart item based on sizes and menu
        existingCart.items[existingItemIndex].price = newItem.price;
      } else {
        // If menu does not exist in the cart, add it to the cart
        existingCart.items.push(newItem);
      }
    });
    await existingCart.save();
    return Helper.successMsg(res, Constants.DATA_UPDATED, existingCart);
  } catch (err) {
    console.log("Errors", err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const aggregate = [
      {
        $match: {
          userId,
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
                discount: 1,
                discountType: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          userId: 0,
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },
      {
        $unwind: {
          path: "$items",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "restaurantmenus",
          localField: "items.restaurantMenuId",
          foreignField: "_id",
          as: "restaurantMenu",
          pipeline: [
            {
              $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
                categoryId: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$restaurantMenu",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$items.price",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "items.price.size": {
            $cond: {
              if: {
                $in: ["$items.price.sizeId", "$restaurantMenu.price._id"],
              },
              then: {
                $let: {
                  vars: {
                    matchedPrice: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$restaurantMenu.price",
                            as: "price",
                            cond: {
                              $eq: ["$$price._id", "$items.price.sizeId"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: "$$matchedPrice.size",
                },
              },
              else: "",
            },
          },
        },
      },
      {
        $project: {
          "restaurantMenu.price": 0,
        },
      },
      {
        $group: {
          _id: "$items.restaurantMenu._id",
          coupon: {
            $first: "$coupon",
          },
          items: {
            $push: {
              price: "$items.price",
              restaurantMenu: "$restaurantMenu",
            },
          },
        },
      },
    ];
    const result = await Cart.aggregate(aggregate);
    const transformedData = result.map((cart) => {
      const map = new Map();
      const items = cart.items.reduce((acc, item) => {
        const index = map.get(item.restaurantMenu._id.toString());
        if (index === undefined) {
          map.set(item.restaurantMenu._id.toString(), acc.length);
          acc.push({
            price: [
              {
                sizeId: item.price.sizeId,
                unitPrice: item.price.unitPrice,
                quantity: item.price.quantity,
                _id: item.price._id,
                size: item.price.size,
              },
            ],
            restaurantMenu: item.restaurantMenu,
          });
        } else {
          acc[index].price.push({
            sizeId: item.price.sizeId,
            unitPrice: item.price.unitPrice,
            quantity: item.price.quantity,
            _id: item.price._id,
            size: item.price.size,
          });
        }
        return acc;
      }, []);

      return {
        ...cart,
        items,
      };
    });

    return Helper.successMsg(res, Constants.DATA_FETCHED, transformedData);
  } catch (err) {
    console.log("Errors", err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const giveFeedback = async (req, res) => {
  try {
    if (Helper.validateRequest(validatePost.feedBackSchema, req.body, res))
      return;
    const { orderId } = req.body;
    const isOrder = await Order.findOne({ orderId });
    if (!isOrder) {
      return Helper.errorMsg(res, Constants.INVALID_ID, 200);
    }
    if (isOrder.status !== "COMPLETED") {
      return Helper.errorMsg(
        res,
        "You can only give rating on delivered order",
        200
      );
    }

    const result = await Review.create({
      userId: req.user._id,
      ...req.body,
    });
    if (!result) {
      return Helper.errorMsg(res, Constants.DATA_NOT_CREATED, 200);
    }

    return Helper.successMsg(res, Constants.DATA_CREATED, result);
  } catch (err) {
    console.log("Errors", err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const getTableSlots = async (req, res) => {
  if (Helper.validateRequest(validatePost.getSlotchema, req.query, res)) return;
  try {
    const { restaurantId, date } = req.query;
    const formatedDate = moment(date).format("YYYY-MM-DD")
    const aggregate = [
      {
        $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
        },
      },
      {
        $project: {
          restaurantId: 1,
          capacity: 1,
          breakFastSchedule: {
            $filter: {
              input: "$breakFastSchedule",
              as: "item",
              cond: {
                $or: [
                  {
                    $and: [
                      { $ne: ["$$item.bookedDate", null] },
                      {
                        $eq: [
                          { $dateToString: { format: "%Y-%m-%d", date: "$$item.bookedDate" } },
                          formatedDate
                        ]
                      },
                      { $lt: ["$$item.booked", "$tableCount"] }, // Check if booked is less than tableCount
                      { $eq: ["$$item.isDisabled", false] } // Ensure the item is not disabled
                    ]
                  },
                  {
                    $or: [
                      { $eq: ["$$item.bookedDate", null] }, // Include records with null bookedDate
                      {
                        $ne: [
                          { $dateToString: { format: "%Y-%m-%d", date: "$$item.bookedDate" } },
                          formatedDate // Include records with different bookedDate
                        ]
                      }
                    ]
                  }
                ]
              },
            },
          },
          lunchSchedule: {
            $filter: {
              input: "$lunchSchedule",
              as: "item",
              cond: {
                $or: [
                  {
                    $and: [
                      { $ne: ["$$item.bookedDate", null] },
                      {
                        $eq: [
                          { $dateToString: { format: "%Y-%m-%d", date: "$$item.bookedDate" } },
                          formatedDate
                        ]
                      },
                      { $lt: ["$$item.booked", "$tableCount"] }, // Check if booked is less than tableCount
                      { $eq: ["$$item.isDisabled", false] } // Ensure the item is not disabled
                    ]
                  },
                  {
                    $or: [
                      { $eq: ["$$item.bookedDate", null] }, // Include records with null bookedDate
                      {
                        $ne: [
                          { $dateToString: { format: "%Y-%m-%d", date: "$$item.bookedDate" } },
                          formatedDate // Include records with different bookedDate
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          },          
          dinnerSchedule: {
            $filter: {
              input: "$dinnerSchedule",
              as: "item",
              cond: {
                $or: [
                  {
                    $and: [
                      { $ne: ["$$item.bookedDate", null] },
                      {
                        $eq: [
                          { $dateToString: { format: "%Y-%m-%d", date: "$$item.bookedDate" } },
                          formatedDate
                        ]
                      },
                      { $lt: ["$$item.booked", "$tableCount"] }, // Check if booked is less than tableCount
                      { $eq: ["$$item.isDisabled", false] } // Ensure the item is not disabled
                    ]
                  },
                  {
                    $or: [
                      { $eq: ["$$item.bookedDate", null] }, // Include records with null bookedDate
                      {
                        $ne: [
                          { $dateToString: { format: "%Y-%m-%d", date: "$$item.bookedDate" } },
                          formatedDate // Include records with different bookedDate
                        ]
                      }
                    ]
                  }
                ]
              },
            },
          },
        },
      },
    ];
    const result = await DineIn.aggregate(aggregate);
    return Helper.successMsg(res, Constants.DATA_FETCHED, result);
  } catch (err) {
    return Helper.catchBlock(req, res, null, err);
  }
};
