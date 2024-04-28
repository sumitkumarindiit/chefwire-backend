import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import * as Helper from "../services/HelperFunction.js";
import * as validateUser from "../services/SchemaValidate/userSchema.js";
import { Constants } from "../services/Constants.js";
import Role from "../models/roleAndPermissionModel.js";
import uploadToS3 from "../services/s3Services.js";
import Address from "../models/addressModel.js";
import {
  merchantCommonAggregation
} from "../services/userService.js";
import mongoose from "mongoose";

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
    let { merchant_id, location, ...objToSave } = req.body;
    if (location) {
      location = JSON.parse(location);
    }

    const user = await User.findByIdAndUpdate(
      merchant_id,
      {
        ...objToSave,
        ...(location && { "location.coordinates": location.coordinates }),
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
export const getRestaurants = async (req, res) => {
  try {
    let service= req.query.services;
    if(service){
      req.query.services = JSON.parse(service)
    }
    if (Helper.validateRequest(validateUser.getmerchantSchema, req.query, res))
      return;
    let {restaurantId,services,sort,rating}=req.query;
    let match={};
    if(services){
      match={ services: { $elemMatch: { $in: services } } }
    }
    if(rating){
      match={rating:{$gte:+rating}}
    }
    const aggregate = [
      ...(restaurantId?[{
        $match:{_id:new mongoose.Types.ObjectId(restaurantId)}
      }]:[]),
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
      {
        $addFields: {
          distance: { $divide: ["$distance", 1000] },
        },
      },
      ...merchantCommonAggregation(),
      {
        $match:match
      },
      {
        $sort: {
          distance: 1,
        },
      },
    ];
    const result = await User.aggregate(aggregate);
    return Helper.successMsg(res, Constants.DATA_FETCHED, result);
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, err, 500);
  }
};
