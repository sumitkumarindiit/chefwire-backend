import joi from "joi";
import jwt from "jsonwebtoken";
import Sib from "sib-api-v3-sdk";
import twilio from "twilio";
import Order from "../models/orderModel.js";

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
  return res
    .status(code === 500 ? code : 200)
    .json({ status: false, message: message });
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
      status:"COMPLETED",
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });
    return orders.length;
  } catch (error) {
    console.error(error);
    return null;
  }
};
export const extractHashtags=(sentence) =>{
  const regex = /#\w+/g;
  const hashtags = sentence.match(regex);
  return hashtags || [];
}
export const Sender =(req)=>{
  return {
    _id: req.user._id,
    name: req.user.name,
    profilePic: req.user.profilePic,
  };
}
export const generateOrderId=() =>{
  const randomNumber = Math.floor(Math.random() * 900000) + 100000;
  return "ORDR"+randomNumber.toString();
}