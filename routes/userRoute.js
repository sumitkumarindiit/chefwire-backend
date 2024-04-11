import express from "express";
import * as Controller from "../controllers/index.js";
import {authenticate, studentRoute} from "../middleware/auth.js";
const user = express.Router();

user.patch(
  "/change-password",
  authenticate,
  Controller.User.changePassword
);
// user.post("/send-request",authenticate,studentRoute,Controller.Action.sendFriendRequest);
// user.post("/cancel-request",authenticate,studentRoute,Controller.Action.cancelFriendRequest);
// user.post("/cancel-sent-request",authenticate,studentRoute,Controller.Action.cancelSentFriendRequest);
// user.post("/accept-request",authenticate,studentRoute,Controller.Action.acceptFriendRequest);
// user.get("/all-received-request",authenticate,studentRoute,Controller.Action.getAllReciedFriendRequest);
// user.get("/all-sent-request",authenticate,studentRoute,Controller.Action.getAllSentFriendRequest);
// user.get("/all-friends",authenticate,studentRoute,Controller.Action.getAllFriends);
// user.patch("/remove-friend",authenticate,studentRoute,Controller.Action.removeFriends);
// user.patch("/block-friend",authenticate,studentRoute,Controller.Action.blockFriends);
// user.patch("/unblock-user",authenticate,studentRoute,Controller.Action.unBlockUser);
// user.post("/create-group",authenticate,studentRoute,Controller.Action.createGroup);
// user.get("/get-group-members",authenticate,studentRoute,Controller.Action.getGroupMembers);
// user.get("/get-groups",authenticate,studentRoute,Controller.Action.getAllGroups);
// user.patch("/update-group",authenticate,studentRoute,Controller.Action.updateGroup);
// user.patch("/delete-chat",authenticate,studentRoute,Controller.Action.deleteChat);
// user.get("/get-chats",authenticate,studentRoute,Controller.Action.getAllChats);
// user.patch("/delete-group",authenticate,studentRoute,Controller.Action.deleteGroup);
// user.get("/get-user-profile",authenticate,Controller.User.getUserProfile);
// user.post("/send-message",authenticate,studentRoute,Controller.Action.sendMessage);
// user.get("/get-chat-message",authenticate,studentRoute,Controller.Action.getMessages);
// user.post("/create-chat",authenticate,studentRoute,Controller.Action.createOrGetAOneOnOneChat);
// user.get("/get-all-user-list",authenticate,Controller.User.getAllUsers);
// user.put("/update-user",authenticate,studentRoute,Controller.User.updateUser);
// user.get("/get-notifications",authenticate,Controller.User.getNotifications);
// user.patch("/delete-notifications",authenticate,studentRoute,Controller.User.deleteNotifications);
// user.get("/get-suggestions",authenticate,studentRoute,Controller.User.suggestFriendList);
// user.get("/get-group-media",authenticate,studentRoute,Controller.Action.getMediaAndLinksOFGroup);
// user.patch("/accept-group-request",authenticate,studentRoute,Controller.Action.acceptGroupRequest);
// user.patch("/reject-group-request",authenticate,studentRoute,Controller.Action.rejectGroupRequest);
// user.get("/unread-messages",authenticate,Controller.Action.getUnreadMessages);
// user.patch("/update-unread-messages",authenticate,studentRoute,Controller.Action.updateUnreadMessages);

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


/** CHANGE_PASSWORD */
/**
 * @swagger
 * '/user/change-password':
 *  patch:
 *     tags:
 *     - User Controller
 *     summary: Change password
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - old_password
 *              - new_password
 *            properties:
 *              old_password:
 *                type: string
 *                default: Test@123
 *              new_password:
 *                type: string
 *                default: Test@123
 *     responses:
 *      200:
 *        description: Password changed
 *      404:
 *        description: Incorrect old password
 *      401:
 *        description: Invalid token
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

/** SEND FRIEND REQUEST */
/**
 * @swagger
 * '/user/send-request':
 *  post:
 *     tags:
 *     - Action Controller
 *     summary: Send friend request
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - user_id
 *            properties:
 *              user_id:
 *                type: string
 *                default: 658c0ca8ffd678b1913fce54
 *     responses:
 *      200:
 *        description: Friend request sent
 *      404:
 *        description: Invalid user id
 *      500:
 *        description: Server Error
 */

/** CANCEL FRIEND REQUEST */
/**
 * @swagger
 * '/user/cancel-request':
 *  post:
 *     tags:
 *     - Action Controller
 *     summary: Cancel friend request
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - user_id
 *            properties:
 *              user_id:
 *                type: string
 *                default: 658c0ca8ffd678b1913fce54
 *     responses:
 *      200:
 *        description: Canceled friend request
 *      404:
 *        description: Invalid user id
 *      500:
 *        description: Server Error
 */


/** ACCEPT FRIEND REQUEST */
/**
 * @swagger
 * '/user/accept-request':
 *  post:
 *     tags:
 *     - Action Controller
 *     summary: Accept friend request
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - user_id
 *            properties:
 *              user_id:
 *                type: string
 *                default: 658c0ca8ffd678b1913fce54
 *     responses:
 *      200:
 *        description: Accepted friend request
 *      404:
 *        description: Invalid user id
 *      500:
 *        description: Server Error
 */


/** ALL RECEIVED FRIEND REQUEST */
/**
 * @swagger
 * '/user/all-received-request':
 *  get:
 *     tags:
 *     - Action Controller
 *     summary: Get all received friend request
 *     requestBody:
 *      required: false
 *      content:
 *        application/json:
 *     responses:
 *      200:
 *        description: Accepted friend request
 *      404:
 *        description: Invalid user id
 *      500:
 *        description: Server Error
 */


/** ALL SENT FRIEND REQUEST */
/**
 * @swagger
 * '/user/all-sent-request':
 *  get:
 *     tags:
 *     - Action Controller
 *     summary: Get all sent friend request
 *     requestBody:
 *      required: false
 *      content:
 *        application/json:
 *     responses:
 *      200:
 *        description: Accepted friend request
 *      404:
 *        description: Invalid user id
 *      500:
 *        description: Server Error
 */


/** GET ALL FRIENDS */
/**
 * @swagger
 * '/user/all-friends':
 *  get:
 *     tags:
 *     - Action Controller
 *     summary: Get all sent friends
 *     requestBody:
 *      required: false
 *      content:
 *        application/json:
 *     responses:
 *      200:
 *        description: Accepted friend request
 *      404:
 *        description: Invalid user id
 *      500:
 *        description: Server Error
 */


/** REMOVE FRIEND */
/**
 * @swagger
 * '/user/remove-friend':
 *  patch:
 *     tags:
 *     - Action Controller
 *     summary: Remove friend
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - user_id
 *            properties:
 *              user_id:
 *                type: string
 *                default: 658c0ca8ffd678b1913fce54
 *     responses:
 *      200:
 *        description: Friend removed
 *      404:
 *        description: Invalid user id
 *      500:
 *        description: Server Error
 */
/** BLOCK FRIEND */
/**
 * @swagger
 * '/user/block-friend':
 *  patch:
 *     tags:
 *     - Action Controller
 *     summary: Block friend
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - user_id
 *            properties:
 *              user_id:
 *                type: string
 *                default: 658c0ca8ffd678b1913fce54
 *     responses:
 *      200:
 *        description: Friend blocked
 *      404:
 *        description: Invalid user id
 *      500:
 *        description: Server Error
 */


/** MAKE GROUP */
/**
 * @swagger
 * '/user/create-group':
 *  post:
 *     tags:
 *     - Action Controller
 *     summary: MAKE GROUP
 *     requestBody:
 *      required: true
 *      content:
 *        multipart/form-data:
 *           schema:
 *            type: object
 *            required:
 *              - name
 *              - description
 *            properties:
 *              name:
 *                type: string
 *                default: fun
 *              description:
 *                type: string
 *                default: this is for fun
 *              file:
 *                type: string
 *                format: binary
 *              user_id:
 *                type: array
 *                items:
 *                  type: string
 *     responses:
 *      200:
 *        description: Group created
 *      500:
 *        description: Server Error
 */

/** GET GROUP MEMBERS */
/**
 * @swagger
 * '/user/get-group-members':
 *  get:
 *     tags:
 *     - Action Controller
 *     summary: Get all members of a group
 *     parameters:
 *       - in: query
 *         name: group_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the group to get members from
 *     responses:
 *      200:
 *        description: Data fetched 
 *      404:
 *        description: Invalid group id
 *      500:
 *        description: Server Error
 */

/** GET GROUP*/
/**
 * @swagger
 * '/user/get-groups':
 *  get:
 *     tags:
 *     - Action Controller
 *     summary: Get all group
 *     responses:
 *      200:
 *        description: Data fetched 
 *      404:
 *        description: Invalid group id
 *      500:
 *        description: Server Error
 */

/** GET ALL CHATS*/
/**
 * @swagger
 * '/user/get-chats':
 *  get:
 *     tags:
 *     - Action Controller
 *     summary: Get all chats
 *     responses:
 *      200:
 *        description: Data fetched 
 *      404:
 *        description: Invalid group id
 *      500:
 *        description: Server Error
 */

/** GET USER PROFILE */
/**
 * @swagger
 * '/user/get-user-profile':
 *  get:
 *     tags:
 *     - Action Controller
 *     summary: Get user profile
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         required: false
 *         description: The ID of the user to get
 *     responses:
 *      200:
 *        description: Data fetched 
 *      404:
 *        description: Invalid group id
 *      500:
 *        description: Server Error
 */

/** DELETE GROUP */
/**
 * @swagger
 * '/user/delete-group':
 *  patch:
 *     tags:
 *     - Action Controller
 *     summary: Delete a group
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - group_id
 *            properties:
 *              group_id:
 *                type: string
 *                default: 658c0ca8ffd678b1913fce54
 *     responses:
 *      200:
 *        description: Data fetched 
 *      404:
 *        description: Invalid group id
 *      500:
 *        description: Server Error
 */
export default user;
