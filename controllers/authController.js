import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";
import bcrypt from "bcrypt";
import * as Helper from "../services/HelperFunction.js";
import * as validateUser from "../services/SchemaValidate/userSchema.js";
import { Constants } from "../services/Constants.js";
import { userCommonAggregation } from "../services/userService.js";
import Role from "../models/roleAndPermissionModel.js";
import uploadToS3 from "../services/s3Services.js";

export const signup = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.signupSchema, req.body, res))
      return;
    const { password, socialMediaId, ...restBody } = req.body;
    const otp = Helper.generateOTP();
    if (socialMediaId) {
      const registedUser = await User.findOne({
        socialMediaId,
        email: restBody.email.toLowerCase(),
      }).lean();
      if (registedUser) {
        registedUser.token = Helper.authUser(registedUser);
        return Helper.successMsg(res, Constants.LOGIN, registedUser);
      }
      const user = await User.create(req.body);
      // const otpresult =await Otp.create({ otp, isActive: true, user_id: user._id });
      // const messagebody = `Your signup otp is: ${otp}`;
      // await Helper.sendMessage("+919304242964", messagebody);
      // return Helper.successMsg(res,Constants.OTP_SENT_MOBILE,user);
      return Helper.successMsg(res, Constants.SIGNUP, user);
    }
    let [emailRegistered, mobileRegistered, userRole] = await Promise.all([
      User.findOne({
        email: restBody.email?.toLowerCase(),
      }),
      User.findOne({ mobileNumber: restBody.mobileNumber }),
      Role.findOne({ role: "user" }),
    ]);
    if (!userRole) {
      const role = await Role.create({ role: "user" });
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
        password: hashedPwd,
        role: userRole._id,
      });
      const otpRes = await Otp.create({
        userId: user._id,
        otp,
      });
      if (!otpRes) return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 404);
      const messagebody = `Your signup otp is: ${otp}`;
      await Helper.sendMessage("+919304242964", messagebody);
      return Helper.successMsg(res, Constants.OTP_SENT_MOBILE, user);
    }
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, err, 500);
  }
};
export const verifyOTP = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.otpSchema, req.body, res)) return;
    const { email, otp, type, user_id } = req.body;
    const user = email
      ? await User.findOne({ email: email.toLowerCase() })
          .select("-__v -updatedAt -createdAt -password")
          .lean()
      : await User.findById(user_id)
          .select("-__v -updatedAt -createdAt -password")
          .lean();
    if (user) {
      if (type === "SIGNUP") {
        const isExpired = await Otp.findOne({ userId: user._id });
        if (!isExpired) {
          return Helper.warningMsg(res, Constants.INVALID_OTP);
        }
        const currentTime = Date.now();
        const checkTime = new Date(isExpired?.updatedAt);
        if (currentTime - checkTime.getTime() > 15 * 60 * 1000) {
          await Otp.findOneAndUpdate(
            {
              userId: user._id,
            },
            { status: Constants.INACTIVE, isActive: false }
          );
          return Helper.errorMsg(res, Constants.OTP_EXPIRED, 200);
        }
        const result = await Otp.findOneAndUpdate(
          {
            userId: user._id,
            otp,
            type: Constants.OTP_TYPE_SIGNUP,
            status: Constants.ACTIVE,
          },
          { status: Constants.INACTIVE }
        );
        if (!result) {
          return Helper.warningMsg(res, Constants.INVALID_OTP);
        }
        await User.findByIdAndUpdate(user._id, { otpVerified: true });
        return Helper.successMsg(res, Constants.SIGNUP, user);
      } else if (type === "FORGOT") {
        const isExpired = await Otp.findOne({ userId: user._id });
        if (!isExpired) {
          return Helper.warningMsg(res, Constants.INVALID_OTP);
        }
        const currentTime = Date.now();
        const checkTime = new Date(isExpired?.updatedAt);
        if (currentTime - checkTime.getTime() > 15 * 60 * 1000) {
          await Otp.findOneAndUpdate(
            {
              userId: user._id,
            },
            { status: Constants.INACTIVE, isActive: false }
          );
          return Helper.errorMsg(res, Constants.OTP_EXPIRED, 200);
        }
        const result = await Otp.findOneAndUpdate(
          {
            userId: user._id,
            otp,
            type: Constants.OTP_TYPE_FORGOT,
            status: Constants.ACTIVE,
          },
          { status: Constants.INACTIVE, isActive: true }
        );

        if (!result) {
          return Helper.warningMsg(res, Constants.INVALID_OTP);
        }

        return Helper.successMsg(res, Constants.OTP_VERIFIED, {});
      }
    } else {
      return Helper.warningMsg(res, Constants.WRONG_EMAIL);
    }
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, err, 500);
  }
};
export const resendOtp = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.userIdSchema, req.body, res))
      return;
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (user) {
      const otp = Helper.generateOTP();
      const result = await Otp.findOneAndUpdate({ userId: user._id }, { otp });
      const messagebody = `Your ${result.type} otp is: ${otp}`;
      await Helper.sendMessage("+919304242964", messagebody);
      if (result) {
        return Helper.successMsg(res, Constants.OTP_SENT_MOBILE, {});
      } else {
        return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 404);
      }
    } else {
      return Helper.errorMsg(res, Constants.INVALID_ID, 401);
    }
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};

export const signin = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.loginSchema, req.body, res)) return;
    const { email, password, socialMediaId } = req.body;
    let match = {
      email: email.toLowerCase(),
    };
    if (socialMediaId) {
      match = {
        socialMediaId: socialMediaId,
      };
    }
    const usr = await User.aggregate([
      {
        $match: match,
      },
      ...userCommonAggregation(),
    ]);
    if (!usr[0]) {
      return Helper.warningMsg(res, Constants.WRONG_EMAIL);
    } else if (usr[0].status !== Constants.ACTIVE) {
      return Helper.warningMsg(res, Constants.BLOCKED);
    } else if (!usr[0].otpVerified) {
      const otp = Helper.generateOTP();
      await Otp.findOneAndUpdate(
        {
          userId: usr[0]._id,
        },
        {
          otp,
          status: Constants.ACTIVE,
        },
        { new: true, upsert: true }
      );
      const messagebody = `Your signup otp is: ${otp}`;
      await Helper.sendMessage("+919304242964", messagebody);
      return Helper.errorMsg(res, Constants.OTP_SENT_MOBILE, 200);
    } else {
      if (!socialMediaId) {
        const result = await bcrypt.compare(password, usr[0].password);
        if (!result) {
          return Helper.warningMsg(res, Constants.INCORRECT_PASSWORD);
        }
      }
      const token = Helper.authUser(usr[0]);
      await User.findByIdAndUpdate(usr[0]._id, { jwtToken: token });
      const result = {
        _id:usr[0]._id,
        name: usr[0].name,
        role: usr[0].role,
        email: usr[0].email,
        mobileNumber: usr[0].mobileNumber,
        countryCode: usr[0].countryCode,
        bio: usr[0].bio,
        profilePic: usr[0].profilePic,
        profession: usr[0].profession,
        signUpType: usr[0].signUpType,
        isOnline: usr[0].isOnline,
        followers: usr[0].followers,
        followings: usr[0].followings,
        currentAddress:usr[0].currentAddress,
        token,
      };
      return Helper.successMsg(res, Constants.LOGIN_SUCCESS, result);
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ Error: err, message: "Something went wrong" });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.emailSchema, req.body, res)) return;
    const { email } = req.body;
    const otp = Helper.generateOTP();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return Helper.errorMsg(res, Constants.WRONG_EMAIL, 404);
    }
    if (!user.otpVerified) {
      return Helper.errorMsg(res, "Please login to verify otp", 404);
    }

    const otpRes = await Otp.findOneAndUpdate(
      {
        userId: user._id,
      },
      { otp, status: Constants.ACTIVE, type: Constants.OTP_TYPE_FORGOT },
      { upsert: true, new: true }
    );
    if (!otpRes) return Helper.warningMsg(res, Constants.SOMETHING_WRONG);
    const messagebody = `Your forgot password otp is: ${otp}`;
    await Helper.sendMessage("+919304242964", messagebody);
    return Helper.successMsg(res, Constants.OTP_SENT_MOBILE, user);
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, err, 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.resetSchema, req.body, res)) return;
    const { otp, userId, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const isExpired = Otp.findOne({ userId });
    const currentTime = Date.now();
    const checkTime = new Date(isExpired?.updatedAt);
    if (currentTime - checkTime.getTime() > 15 * 60 * 1000) {
      await Otp.findOneAndUpdate(
        {
          userId,
        },
        { isActive: false, status: Constants.INACTIVE }
      );
      return Helper.errorMsg(res, Constants.OTP_EXPIRED, 200);
    }
    const result = await Otp.findOneAndUpdate(
      {
        otp,
        userId,
        status: Constants.INACTIVE,
        isActive: true,
      },
      { isActive: false }
    );
    if (!result) return Helper.errorMsg(res, Constants.INVALID_OTP, 200);
    await User.findByIdAndUpdate(result.userId, {
      password: hashedPassword,
    });
    return Helper.successMsg(res, Constants.PASSWORD_CHANGED, {});
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
export const logout = async (req, res) => {
  try {
    const result = await User.findByIdAndUpdate(
      req.user._id,
      { deviceToken: null, isOnline: false },
      { new: true }
    );
    return Helper.successMsg(res, Constants.LOGOUT, {});
  } catch (err) {
    console.error(err);
    return Helper.errorMsg(res, err, 500);
  }
};

