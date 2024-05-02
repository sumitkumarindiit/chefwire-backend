import jwt from "jsonwebtoken";
import * as Helper from "../services/HelperFunction.js";
import User from "../models/userModel.js";
import { Constants } from "../services/Constants.js";
import { userCommonAggregation } from "../services/userService.js";
import mongoose from "mongoose";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    const deviceToken = req.header("deviceToken");

    if (!authHeader || !authHeader.startsWith("Bearer "))
      return Helper.errorMsg(res, Constants.INVALID_TOKEN, 401);
    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(decodedToken._id.toString()),
        },
      },
      ...userCommonAggregation(),
    ]).then(async (usr) => {
      if (!usr || usr.length < 1) {
        return Helper.errorMsg(res, Constants.WRONG_EMAIL, 401);
      }
      if (usr[0].status !== Constants.ACTIVE) {
        return Helper.errorMsg(res, Constants.BLOCKED, 401);
      }
      if (deviceToken && deviceToken !== usr[0].deviceToken) {
        await User.findByIdAndUpdate(usr[0]._id, { deviceToken });
      }
      req.user = usr[0];
      next();
    });
  } catch (err) {
    Helper.catchBlock(req,res,null,err)
  }
};

export const adminRoute = async (req, res, next) => {
  try {
    const url = req.url.split("?")[0];
    const permission = req.user.role.permissions;
    if (
      !req.user.role.role ||
      req.user.role.role === "user" ||
      req.user.role.role === "student" ||
      req.user.role.role === "admission_officer"
    ) {
      return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
    }
    switch (url) {
      case "/get-reports":
        if (!permission.Report.view) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/get-user-profile":
      case "/get-user-list":
        if (!permission.User.view) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/block-unblock-user":
        if (!permission.User.delete) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/get-posts":
        if (!permission.Post.view) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/delete-post":
        if (!permission.Post.delete) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/get-comments":
        if (!permission.Comment.view) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/delete-comment":
        if (!permission.Comment.delete) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/get-groups":
        if (!permission.Group.view) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/delete-group":
        if (!permission.Group.delete) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/get-projects":
        if (!permission["My Passion Project"].view) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/delete-project":
        if (!permission["My Passion Project"].delete) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/get-role":
        if (!permission.Role.view) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/update-role":
        if (!permission.Role.edit) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/delete-role":
        if (!permission.Role.delete) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/add-user":
        if (!permission["Organization User"].add) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/update-org-user":
        if (!permission["Organization User"].edit) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/get-org-user-list":
        if (!permission["Organization User"].view) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
      case "/block-unblock-org-user":
        if (!permission["Organization User"].delete) {
          return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
        }
        break;
    }
    next();
  } catch (err) {
    return Helper.errorMsg(res, Constants.INVALID_TOKEN, 500, err);
  }
};
export const officerRoute = async (req, res, next) => {
  try {
    if (req.user.role.role !== "admission_officer") {
      return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
    }
    next();
  } catch (err) {
    return Helper.errorMsg(res, Constants.INVALID_TOKEN, 500, err);
  }
};
export const merchantRoute = async (req, res, next) => {
  try {
    if (req.user.role !== "merchant") {
      return Helper.errorMsg(res, Constants.NOT_AUTHORIZED, 400);
    }
    next();
  } catch (err) {
    return Helper.errorMsg(res, Constants.INVALID_TOKEN, 500, err);
  }
};
