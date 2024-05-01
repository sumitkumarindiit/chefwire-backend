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
import Post from "../models/postModel.js";

export const signupMerchant = async (req, res) => {
  try {
    const { profilePic, coverPic } = req.files;
    let { password, location, ...restBody } = req.body;
    location = JSON.parse(location);

    if (
      Helper.validateRequest(
        validateUser.merchantSignupSchema,
        {
          ...restBody,
          password,
          location,
          profilePic: profilePic ? profilePic.data : null,
          coverPic: coverPic ? coverPic.data : null,
        },
        res
      )
    )
      return;

    if (profilePic) {
      const filenamePrefix = Date.now();
      const extension = profilePic.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(profilePic.data, filename, profilePic.mimetype);
      restBody.profilePic = filename;
    }
    if (coverPic) {
      const filenamePrefix = Date.now();
      const extension = coverPic.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(coverPic.data, filename, coverPic.mimetype);
      restBody.coverPic = filename;
    }
    // const otp = Helper.generateOTP();

    let [emailRegistered, mobileRegistered, userRole] = await Promise.all([
      User.findOne({
        email: restBody.email?.toLowerCase(),
      }),
      User.findOne({ mobileNumber: restBody.mobileNumber }),
      Role.findOne({ role: "merchant" }),
    ]);
    if (!userRole) {
      const role = await Role.create({ role: "merchant" });
      userRole = role;
    }
    if (emailRegistered) {
      if (emailRegistered.status === Constants.INACTIVE) {
        return Helper.warningMsg(res, Constants.INACTIVE_SIGNUP, {});
      }
      return Helper.errorMsg(res, Constants.EMAIL_EXIST, 409);
    } else if (mobileRegistered) {
      if (mobileRegistered.status === Constants.INACTIVE) {
        return Helper.warningMsg(res, Constants.INACTIVE_SIGNUP, {});
      }
      return Helper.errorMsg(res, Constants.MOBILE_EXIST, 409);
    } else {
      const hashedPwd = await bcrypt.hash(password, 10);
      const user = await User.create({
        ...restBody,
        "location.coordinates": location.coordinates,
        password: hashedPwd,
        role: userRole._id,
      });
      const address = await Address.create({
        addressId: user._id,
        ...location,
        addressType: "RESTAURANT",
      });
      // const otpRes = await Otp.create({
      //   userId: user._id,
      //   otp,
      // });
      // if (!otpRes) return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 404);
      // const messagebody = `Your signup otp is: ${otp}`;
      // await Helper.sendMessage("+919304242964", messagebody);
      return Helper.successMsg(res, Constants.SIGNUP, user);
    }
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, err, 500);
  }
};
export const updateMerchantProfile = async (req, res) => {
  try {
    const profilePic = req.files?.profilePic;
    const coverPic = req.files?.coverPic;
    const galleryImg = req.files?.gallery;
    const menuImg = req.files?.menu;
    if (galleryImg) {
      if (galleryImg && Array.isArray(galleryImg)) {
        const imgFile = galleryImg.map((file, index) => {
          return file.data;
        });
        req.body.gallery = imgFile;
      } else {
        req.body.gallery = [galleryImg.data];
      }
    }
    if (menuImg) {
      if (menuImg && Array.isArray(menuImg)) {
        const imgFile = menuImg.map((file, index) => {
          return file.data;
        });
        req.body.menu = imgFile;
      } else {
        req.body.menu = [menuImg.data];
      }
    }
    const { openingHours, categories, services } = req.body;

    if (openingHours) {
      req.body.openingHours = JSON.parse(openingHours);
    }
    if (categories) {
      req.body.categories = JSON.parse(categories);
    }
    if (services) {
      req.body.services = JSON.parse(services);
    }

    if (
      Helper.validateRequest(
        validateUser.updatemerchantSchema,
        {
          ...req.body,
          profilePic: profilePic ? profilePic.data : null,
          coverPic: coverPic ? coverPic.data : null,
        },
        res
      )
    )
      return;
    if (profilePic) {
      const filenamePrefix = Date.now();
      const extension = profilePic.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(profilePic.data, filename, profilePic.mimetype);
      restBody.profilePic = filename;
    }
    if (coverPic) {
      const filenamePrefix = Date.now();
      const extension = coverPic.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(coverPic.data, filename, coverPic.mimetype);
      restBody.coverPic = filename;
    }
    if (galleryImg) {
      let file = Array.isArray(galleryImg) ? galleryImg : [galleryImg];
      let url = await Promise.all(
        file.map(async (item) => {
          const filenamePrefix = Date.now();
          const extension = item.name.split(".").pop();
          const filename = filenamePrefix + "." + extension;
          await uploadToS3(item.data, filename, item.mimetype);
          return filename;
        })
      );
      req.body.gallery = url;
    }
    if (menuImg) {
      let file = Array.isArray(menuImg) ? menuImg : [menuImg];
      let url = await Promise.all(
        file.map(async (item) => {
          const filenamePrefix = Date.now();
          const extension = item.name.split(".").pop();
          const filename = filenamePrefix + "." + extension;
          await uploadToS3(item.data, filename, item.mimetype);
          return filename;
        })
      );
      req.body.menu = url;
    }
    let { location, gallery,menu, ...objToSave } = req.body;
    if (location) {
      location = JSON.parse(location);
    }
console.log(menu)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...objToSave,
        ...(location && { "location.coordinates": location.coordinates }),
        ...(galleryImg && { $addToSet: { gallery: { $each: gallery } } }),
        ...(menuImg && { $addToSet: { menu: { $each: menu } } }),
      },

      { new: true }
    );
    const address = await Address.findOneAndUpdate(
      { addressId: user._id },
      location,
      { new: true }
    );
    return Helper.successMsg(res, Constants.DATA_UPDATED, user);
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, err, 500);
  }
};
export const deleteSingleImageFromMerchantProfileGallery = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.deletePhotoGallery, req.body, res))
      return;
    let { merchantId, name } = req.body;

    const user = await User.findByIdAndUpdate(
      merchantId,
      {
        $pull: { gallery: name },
      },
      { new: true }
    );
    return Helper.successMsg(res, Constants.DATA_DELETED, user);
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, err, 500);
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
    const isCategory = await Category.findOne({
      restaurantId: req.user._id,
      name: req.body.name,
    });
    if (isCategory) {
      return Helper.errorMsg(res, Constants.DATA_EXIST, 200);
    }
    if (file) {
      const filenamePrefix = Date.now();
      const extension = file.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(file.data, filename, file.mimetype);
      req.body.icon = filename;
    }
    const result = await Category.create({
      ...req.body,
      restaurantId: req.user._id,
    });
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
export const createMenu = async (req, res, next) => {
  try {
    const file = req.files?.profilePic;
    const { nutrition, price } = req.body;
    if (nutrition) {
      req.body.nutrition = JSON.parse(nutrition);
    }
    if (price) {
      req.body.price = JSON.parse(price);
    }
    if (
      Helper.validateRequest(
        validatePost.menuSchema,
        { ...req.body, profilePic: file.data },
        res
      )
    )
      return;
    const isMenu = await Category.findOne({
      restaurantId: req.user._id,
      categoryId: req.body.categoryId,
      name: req.body.name,
    });
    if (isMenu) {
      return Helper.errorMsg(res, Constants.DATA_EXIST, 200);
    }
    if (file) {
      const filenamePrefix = Date.now();
      const extension = file.name.split(".").pop();
      const filename = filenamePrefix + "." + extension;
      await uploadToS3(file.data, filename, file.mimetype);
      req.body.profilePic = filename;
    }
    const result = await RestaurantMenu.create({
      ...req.body,
      restaurantId: req.user._id,
    });
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

