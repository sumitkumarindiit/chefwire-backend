import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as Helper from "../services/HelperFunction.js";
import * as validateUser from "../services/SchemaValidate/userSchema.js";
import { Constants } from "../services/Constants.js";
import Sib from "sib-api-v3-sdk";
import { userCommonAggregation } from "../services/userService.js";
import { OtpMailTemplate, WelcomeEmail } from "../services/emailTemplate.js";
import Role from "../models/roleAndPermissionModel.js";

export const signup = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.signupSchema, req.body, res))
      return;
    const { password, socialMediaId, ...restBody } = req.body;
    const otp = Helper.generateOTP();
    if (socialMediaId) {
      const registedUser = await User.findOne({ socialMediaId }).lean();
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
      } else {
        return Helper.errorMsg(res, Constants.EMAIL_EXIST, 409);
      }
    } else if (mobileRegistered) {
      if (mobileRegistered.status === Constants.INACTIVE) {
        return Helper.warningMsg(res, Constants.INACTIVE_SIGNUP, {});
      } else {
        return Helper.errorMsg(res, Constants.MOBILE_EXIST, 409);
      }
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
export const logout = async (req, res) => {
  try {
    const result = await User.findByIdAndUpdate(
      req.user._id,
      { deviceToken: null },
      { new: true }
    );
    return Helper.successMsg(res, Constants.LOGOUT, {});
  } catch (err) {
    console.error(err);
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
        const result = await Otp.findOneAndUpdate(
          {
            userId: user._id,
            otp,
            status: Constants.ACTIVE,
          },
          { status: Constants.INACTIVE }
        );
        if (!result) {
          return Helper.warningMsg(res, Constants.INVALID_OTP);
        }
        const currentTime = new Date.now();
        const checkTime = result?.updatedAt
        
        await User.findByIdAndUpdate(user._id, { otpVerified: true });
        return Helper.successMsg(res, Constants.SIGNUP_SUCCESS, user);
      } else if(type==="FORGOT") {
        const result = await Forgot.findOneAndUpdate(
          {
            user_id: user._id,
            verification_string: otp,
            status: Constants.ACTIVE,
          },
          { status: Constants.INACTIVE, is_active: true }
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
export const resendOtp = async (req, res, next) => {
  try {
    if (Helper.validateRequest(validateUser.userIdSchema, req.body, res))
      return;
    const { user_id } = req.body;
    const user = await User.findById(user_id);
    if (user) {
      const otp = Helper.generateOTP();
      const result = await Forgot.findOneAndUpdate(
        { user_id: user._id },
        { verification_string: otp }
      );
      const mail = OtpMailTemplate(otp);
      await Helper.sendEmail(user.email, mail, "Login OTP");
      if (result) {
        return Helper.successMsg(res, Constants.OTP_SENT, {});
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
      emai: email.toLowerCase(),
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
      return Helper.errorMsg(res, Constants.BLOCKED, 200);
    } else if (!usr[0].otpVerified) {
      const otp = Helper.generateOTP();
      await Otp.findOneAndUpdate(
        {
          user_id: usr[0]._id,
        },
        {
          otp,
          status: Constants.ACTIVE,
        },
        { new: true }
      );
      const messagebody = `Your signup otp is: ${otp}`;
      await Helper.sendMessage("+919304242964", messagebody);
      return Helper.errorMsg(res, Constants.OTP_SENT, 200);
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
        name: usr[0].name,
        role: usr[0].role,
        email: usr[0].email,
        mobileNumber: usr[0].mobileNumber,
        countryCode: usr[0].countryCode,
        bio: usr[0].bio,
        profilePic: usr[0].profilePic,
        profession: usr[0].profession,
        signUpType: usr[0].signUpType,
        isOnline:usr[0].isOnline,
        followers:usr[0].followers,
        followings:usr[0].followings,
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
    if (Helper.validateRequest(validateUser.forgotSchema, req.body, res))
      return;
    const { email } = req.body;
    const otp = Helper.generateOTP();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const client = Sib.ApiClient.instance;
      var apiKey = client.authentications["api-key"];
      apiKey.apiKey = process.env.EMAIL_API_KEY;

      const tranEmailApi = new Sib.TransactionalEmailsApi();
      const sender = {
        email: "sumitkumarindiit@gmail.com",
        name: "BriddG",
      };
      const receivers = [
        {
          email: user.email,
        },
      ];
      await Promise.all([
        tranEmailApi.sendTransacEmail({
          sender,
          to: receivers,
          subject: "Reset Password Link",
          htmlContent: `<p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>`,
        }),
        Forgot.findOneAndUpdate(
          { user_id: user._id },
          {
            verification_string: otp,
            user_id: user._id,
            status: Constants.ACTIVE,
          },
          { upsert: true, new: true }
        ),
      ]);
      return Helper.successMsg(res, Constants.EMAIL_SENT, user);
    } else {
      return Helper.errorMsg(res, Constants.EMAIL_NOT_EXIST, 404);
    }
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, err, 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    if (Helper.validateRequest(validateUser.resetSchema, req.body, res)) return;
    const { verification_string, user_id, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const forgot = await Forgot.findOneAndUpdate(
      {
        verification_string,
        user_id,
        status: Constants.INACTIVE,
        is_active: true,
      },
      { is_active: false }
    );
    if (!forgot) return Helper.errorMsg(res, Constants.INVALID_OTP, 404);
    await User.findByIdAndUpdate(forgot.user_id, {
      password: hashedPassword,
    });
    return Helper.successMsg(res, Constants.PASSWORD_CHANGED, {});
  } catch (err) {
    console.log(err);
    return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
  }
};
