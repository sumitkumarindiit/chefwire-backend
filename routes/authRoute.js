import express from "express";
import * as Controller from "../controllers/index.js";
import { authenticate } from "../middleware/auth.js";

const auth = express.Router();


auth.post("/signup", Controller.Auth.signup);
auth.post("/merchant-signup", Controller.Merchant.signupMerchant);
auth.put("/update-merchant", Controller.Merchant.updateMerchantProfile);
auth.post("/signin", Controller.Auth.signin);
auth.patch("/logout",authenticate, Controller.Auth.logout);
auth.post("/forgot-password", Controller.Auth.forgotPassword);
auth.post("/reset-password", Controller.Auth.resetPassword);
auth.patch("/resend-otp", Controller.Auth.resendOtp);
auth.put("/verify-otp", Controller.Auth.verifyOTP);

export default auth;
/** SIGNUP */
/**
 * @swagger
 * '/user/signup':
 *  post:
 *     tags:
 *     - User Controller
 *     summary: Signup a user
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - first_name
 *              - last_name
 *              - email
 *              - phone_number
 *              - country
 *              - state
 *              - city
 *              - zip_code
 *              - password
 *            properties:
 *              first_name:
 *                type: string
 *                default: xyz  
 *              last_name:
 *                type: string
 *                default: singh  
 *              email:
 *                type: string
 *                default: xyz@gmail.com  
 *              phone_number:
 *                type: string
 *                default: 8989898989  
 *              country:
 *                type: string
 *                default: india  
 *              state:
 *                type: string
 *                default: punjab  
 *              city:
 *                type: string
 *                default: mohali 
 *              zip_code:
 *                type: string
 *                default: 898989 
 *              password:
 *                type: string
 *                default: Test@123
 *     responses:
 *      200:
 *        description: Otp sent to email
 *      409:
 *        description: Conflict
 *      404:
 *        description: Something Wrong
 *      500:
 *        description: Server Error
 */

/** LOGIN */
/**
 * @swagger
 * '/user/login':
 *  post:
 *     tags:
 *     - User Controller
 *     summary: Login a user
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - email
 *              - password
 *            properties:
 *              email:
 *                type: string
 *                default: briddg@yopmail.com
 *              password:
 *                type: string
 *                default: Test@123
 *     responses:
 *      200:
 *        description: Login Success
 *      404:
 *        description: Email Not Found
 *      400:
 *        description: Wrong Password
 *      500:
 *        description: Server Error
 */



/** FORGOT_PASSWORD */
/**
 * @swagger
 * '/user/forgot-password':
 *  post:
 *     tags:
 *     - User Controller
 *     summary: Forgot password
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                default: briddg@yopmail.com
 *     responses:
 *      200:
 *        description: Otp Sent
 *      404:
 *        description: Email Not Found
 *      500:
 *        description: Server Error
 */


/** RESET_PASSWORD */
/**
 * @swagger
 * '/user/reset-password':
 *  post:
 *     tags:
 *     - User Controller
 *     summary: Forgot password
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - password
 *              - user_id
 *              - verification_string
 *            properties:
 *              password:
 *                type: string
 *                default: Test@123
 *            verfication_string:
 *                type: string
 *                default: 4567
 *            user_id:
 *                 type: string
 *                 default: 658c0ca8ffd678b1913fce54
 *     responses:
 *      200:
 *        description: Password changed
 *      404:
 *        description: Invalid OTP
 *      500:
 *        description: Server Error
 */


/** VERIFY_OTP */
/**
 * @swagger
 * '/user/verify-otp':
 *  put:
 *     tags:
 *     - User Controller
 *     summary: Verify OTP
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - email
 *              - otp
 *              - type
 *            properties:
 *              email:
 *                type: string
 *                default: briddg@yopmail.com
 *              otp:
 *                type: string
 *                default: 5555
 *              type:
 *                type: string
 *                default: SIGNUP
 *     responses:
 *      200:
 *        description: Otp verified
 *      404:
 *        description: Invalid OTP or Email not exist
 *      500:
 *        description: Server Error
 */


