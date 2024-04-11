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
       return Helper.successMsg(res,Constants.SIGNUP,user);
    }
    let [emailRegistered,mobileRegistered, userRole] = await Promise.all([
      User.findOne({
        email: restBody.email?.toLowerCase(),
      }),
      User.findOne({mobileNumber:restBody.mobileNumber}),
      Role.findOne({ role: "user" }),
    ]);
    if (!userRole) {
      const role = await Role.create({ role: "user" });
      userRole = role;
    }
    if (emailRegistered) {
      if (emailRegistered.status === Constants.INACTIVE) {
        return Helper.warningMsg(res, Constants.INACTIVE_SIGNUP,{});
      } else {
        return Helper.errorMsg(res, Constants.EMAIL_EXIST, 409);
      }
    }else if(mobileRegistered){
      if (mobileRegistered.status === Constants.INACTIVE) {
        return Helper.warningMsg(res, Constants.INACTIVE_SIGNUP,{});
      } else {
        return Helper.errorMsg(res, Constants.MOBILE_EXIST, 409);
      }
    } else {
      const hashedPwd = await bcrypt.hash(password, 10);
      const user = await User.create({
        ...restBody,
        password: hashedPwd,
        role: userRole._id
      });
      const otpRes = await Otp.create({
        user_id: user._id,
        otp
      });
      if (!otpRes) return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 404);
      const messagebody = `Your signup otp is: ${otp}`;
      await Helper.sendMessage("+919304242964", messagebody);
      return Helper.successMsg(res,Constants.OTP_SENT_MOBILE,user);
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
      if (type === "SIGNUP" || type === "LOGIN") {
        const result = await Forgot.findOneAndUpdate(
          {
            user_id: user._id,
            verification_string: otp,
            status: Constants.ACTIVE,
          },
          { status: Constants.INACTIVE }
        );
        if (!result) {
          return Helper.warningMsg(res, Constants.INVALID_OTP);
        }
        await User.findByIdAndUpdate(user._id, { email_verified: true });

        user.token = authUser(user);
        await Helper.sendEmail(email, WelcomeEmail, "Welcome Letter");
        return Helper.successMsg(res, Constants.SIGNUP_SUCCESS, user);
      } else {
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
      return Helper.warningMsg(res, Constants.EMAIL_NOT_EXIST);
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
    const { email, password } = req.body;
    const usr = await User.aggregate([
      {
        $match: { email: email.toLowerCase() },
      },
      ...userCommonAggregation(),
    ]);
    if (!usr[0]) {
      return Helper.warningMsg(res, Constants.EMAIL_NOT_EXIST);
    } else if (usr[0].status !== Constants.ACTIVE) {
      return Helper.errorMsg(res, "BLOCKED", 400);
    } else if (!usr[0].email_verified) {
      const otp = Helper.generateOTP();
      const client = Sib.ApiClient.instance;
      await Forgot.findOneAndUpdate(
        {
          user_id: usr[0]._id,
        },
        {
          verification_string: otp,
          status: Constants.ACTIVE,
        },
        { upsert: true, new: true }
      );
      const mail = OtpMailTemplate(otp);
      await Helper.sendEmail(
        email.toLowerCase(),
        mail,
        "Otp to create Account"
      );
      return Helper.errorMsg(res, Constants.OTP_SENT, 401);
    } else {
      const result = await bcrypt.compare(password, usr[0].password);
      if (!result) {
        return Helper.warningMsg(res, Constants.INCORRECT_PASSWORD);
      } else {
        const result = {
          first_name: usr[0].first_name,
          last_name: usr[0].last_name,
          role: usr[0].role,
          email: usr[0].email,
          phone_number: usr[0].phone_number,
          country: usr[0].country,
          country_code: usr[0].country_code,
          state: usr[0].state,
          state_code: usr[0].state_code,
          city: usr[0].city,
          zip_code: usr[0].zip_code,
          my_network: usr[0].my_network,
          blocked_user: usr[0].blocked_user,
          followed_by: usr[0].followed_by,
          profile_pic: usr[0].profile_pic,
          cover_photo: usr[0].cover_photo,
          school_name: usr[0].school_name,
          institute_name: usr[0].institute_name,
          school_id_number: usr[0].school_id_number,
          gpa: usr[0].gpa,
          sat_act_scores: usr[0].sat_act_scores,
          position: usr[0].position,
          years_of_experience: usr[0].years_of_experience,
          linkedin_profile: usr[0].linkedin_profile,
          unread_messages: usr[0].unread_messages,
          about: usr[0].about,
          token: authUser(usr[0]),
        };
        return Helper.successMsg(res, Constants.LOGIN_SUCCESS, result);
      }
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
