import joi from "joi";
import jwt from "jsonwebtoken";
import Sib from "sib-api-v3-sdk";
import twilio from "twilio";
import moment from "moment";
import Order from "../models/orderModel.js";
import { Constants } from "./Constants.js";
import { Logs } from "../middleware/log.js";
import RestaurantMenu from "../models/restaurantMenuModel.js";
import Quest from "../models/questModel.js";
import Coupon from "../models/couponModel.js";

export const authUser = (obj) => {
  return jwt.sign(obj, process.env.JWT_SECRET, {
    expiresIn: "15d",
    algorithm: "HS256",
  });
};

export const validateRequest = (schema, value, res) => {
  const { error } = schema.validate(value, { abortEarly: false });

  if (error) {
    const result = error.details.map((err) => {
      const errorMessage = err.message.replace(/["]/g, "");
      return `${errorMessage}`;
    });
    return res.status(400).json({ error: result });
  }
};
export const successMsg = (res, message, obj) => {
  return res.status(200).json({ status: true, message: message, data: obj });
};
export const warningMsg = (res, message) => {
  return res.status(200).json({ status: false, message: message });
};
export const errorMsg = (res, message, code, err) => {
  if (err && err instanceof jwt.JsonWebTokenError) {
    return res.status(code).json({ status: false, message: "Invalid token" });
  }
  return res.status(code).json({ status: false, message: message });
};
export const ObjectIdRequired = () => {
  return joi.string().hex().length(24).required();
};
export const ObjectIdOptional = () => {
  return joi.string().hex().length(24);
};
export const generateOTP = () => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString();
};
export const extractUrls = (text) => {
  const urlRegex = /(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?/gi;
  const urls = text.match(urlRegex);
  if (urls) {
    return urls.map((url) => {
      if (!/^https?:\/\//i.test(url)) {
        return "http://" + url;
      }
      return url;
    });
  }
  return [];
};

export const sendEmail = async (email, template, subject) => {
  try {
    const client = Sib.ApiClient.instance;
    var apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.EMAIL_API_KEY;

    const tranEmailApi = new Sib.TransactionalEmailsApi();
    const sender = {
      email: "chefwire@chefwire.com",
      name: "ChefWire",
    };
    const receivers = [
      {
        email: email,
      },
    ];
    await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: subject,
      htmlContent: template,
    });
    return true;
  } catch (err) {
    console.error(err);
    return null;
  }
};
export const sendMessage = async (number, body) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  try {
    console.log(number);
    await client.messages.create({
      body: body,
      from: "+12055390892",
      to: number,
    });
    return true;
  } catch (error) {
    console.error(error);
    return null;
  }
};
export const HowManyOrderByUser = async (userId) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const orders = await Order.find({
      userId,
      status: "COMPLETED",
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });
    console.log(orders);
    return orders.length;
  } catch (error) {
    console.error(error);
    return null;
  }
};
export const updateQuestUsers = async (
  req,
  totalOrders,
  completedOrders,
  quest
) => {
  try {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(expirationDate.getDate() + 5);
    expirationDate.setHours(23, 59, 0, 0);
    const expirationTime = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const completedIds = quest.completedUsers.map((usr) =>
      usr?.userId?.toString()
    );
    const startedIds = quest.startedUsers.map((usr) => usr?.userId?.toString());
    if (completedOrders === totalOrders) {
      if (completedIds.includes(req.user._id.toString())) {
        const expireTime = quest.startedUsers.find(
          (item) => item.userId.toString() === req.user._id.toString()
        )?.expireTime;
        if (expireTime && isExpired(expireTime)) {
          await Promise.all([
            Quest.findByIdAndUpdate(quest._id, {
              $pull: { completedUsers: { userId: req.user._id } },
            }),
            Quest.findByIdAndUpdate(quest._id, {
              $addToSet: { excludedUsers: req.user._id },
            }),
            Coupon.findByIdAndUpdate(quest.couponId, {
              $pull: { eligibleUsers: { userId: req.user._id } },
            }),
          ]);
        } else {
          return true;
        }
      } else {
        await Promise.all([
          Quest.findByIdAndUpdate(quest._id, {
            $addToSet: {
              completedUsers: {
                userId: req.user._id,
                expireTime: expirationDate,
              },
            },
          }),
          Coupon.findByIdAndUpdate(quest.couponId, {
            $addToSet: {
              eligibleUsers: {
                userId: req.user._id,
                expireTime: expirationDate,
              },
            },
          }),
        ]);
        return true;
      }
    }
    if (completedOrders > 0 && completedOrders < totalOrders) {
      if (startedIds.includes(req.user._id.toString())) {
        const expireTime = quest.startedUsers.find(
          (item) => item.userId.toString() === req.user._id.toString()
        )?.expireTime;
        if (expireTime && isExpired(expireTime)) {
          await Promise.all([
            Quest.findByIdAndUpdate(quest._id, {
              $pull: { startedUsers: { userId: req.user._id } },
            }),
            Quest.findByIdAndUpdate(quest._id, {
              $addToSet: { excludedUsers: req.user._id },
            }),
          ]);
        } else {
          return true;
        }
      } else {
        await Quest.findByIdAndUpdate(quest._id, {
          $addToSet: {
            startedUsers: { userId: req.user._id, expireTime: expirationTime },
          },
        });
        return true;
      }
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
export const extractHashtags = (sentence) => {
  const regex = /#\w+/g;
  const hashtags = sentence.match(regex);
  return hashtags || [];
};
export const Sender = (req) => {
  return {
    _id: req.user._id,
    name: req.user.name,
    profilePic: req.user.profilePic,
  };
};
export const generateOrderId = () => {
  const randomNumber = Math.floor(Math.random() * 900000) + 100000;
  return "ORDR" + randomNumber.toString();
};

export const catchBlock = (req, res, next, err) => {
  console.error(err);
  if (err.name === "TokenExpiredError") {
    Logs(req, "TokenExpiredError", next);
    return errorMsg(res, "Please login again your token has been expired", 400);
  }
  next && Logs(req, Constants.SOMETHING_WRONG, next);
  return errorMsg(res, Constants.SOMETHING_WRONG, 500);
};
export const validateCartItems = async (items) => {
  try {
    let totalPrice = 0;

    // Iterate over each item in the cart
    for (const item of items) {
      const restaurantMenu = await RestaurantMenu.findById(
        item.restaurantMenuId
      );

      // If restaurantMenu doesn't exist or item doesn't have price details, skip validation
      if (
        !restaurantMenu ||
        !restaurantMenu.price ||
        restaurantMenu.price.length === 0
      ) {
        return {
          status:false,
          message:`Menu item with ID ${item.restaurantMenuId} does not exist or has no price details.`
        }
      }

      // Iterate over each price detail in the restaurantMenu
      for (const priceDetail of item.price) {
        const matchedPriceDetail = restaurantMenu.price.find((p) => {
          return p._id.toString() === priceDetail.sizeId;
        });

        // If sizeId from cart item doesn't match any sizeId in restaurantMenu, skip validation
        if (!matchedPriceDetail) {
          return {
            status:false,
            message:`Size ID ${priceDetail._id} not found for menu item with ID ${item.restaurantMenuId}.`
          }
        }
        // Check if unitPrice matches the price stored in restaurantMenu
        if (matchedPriceDetail.price !== priceDetail.unitPrice) {
          return {
            status:false,
            message:`Unit price mismatch for size ID ${priceDetail.sizeId} of menu item.`
          }
        }
        totalPrice += priceDetail.unitPrice * priceDetail.quantity
        console.log(priceDetail)
      }
    }

    return {
      status:true,
      totalPrice
    };
  } catch (error) {
    throw new Error(`Error validating cart items: ${error.message}`);
  }
};
const isExpired = (expireTime) => {
  return new Date(expireTime) < new Date();
};
export const getSlots = (startTime, endTime, interval) => {
  const slots = [];
  let currentTime = moment(startTime, "HH:mm");
  const end = moment(endTime, "HH:mm");
  while (currentTime.isBefore(end) || currentTime.isSame(end, "minute")) {
    const nextTime = currentTime.clone().add(interval, "minutes");
    const slotEndTime = nextTime.isAfter(end) ? end : nextTime;
    const slot = {
      startTime: currentTime.format("HH:mm"),
      endTime: slotEndTime.format("HH:mm"),
      booked: 0,
      isDisabled: false,
      bookedDate: null,
    };
    slots.push(slot);
    currentTime = nextTime;
  }
  return slots;
};
export const capitalizeEveryWord = (sentence) => {
  const words = sentence?.split(" ");
  const capitalizedWords = words?.map((word) => {
    return word?.charAt(0)?.toUpperCase() + word?.slice(1);
  });
  const capitalizedSentence = capitalizedWords?.join(" ");
  return capitalizedSentence;
};