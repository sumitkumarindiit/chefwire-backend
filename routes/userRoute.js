import express from "express";
import * as Controller from "../controllers/index.js";
import { authenticate } from "../middleware/auth.js";
const user = express.Router();

user.patch("/change-password", authenticate, Controller.User.changePassword);
user.put(
  "/add-or-update-address",
  authenticate,
  Controller.User.addOrUpdateAddress
);
user.patch("/follow", authenticate, Controller.User.follow);
user.patch("/unfollow", authenticate, Controller.User.unFollow);
user.get("/my-reviews", authenticate, Controller.User.getReviews);
user.get("/follower-list",authenticate,Controller.User.getFollowerList);
user.get("/following-list",authenticate,Controller.User.getFollowingList);
user.get("/check-coupon",authenticate,Controller.User.checkCoupon);
user.post("/make-payment",Controller.User.makePayment);
user.get("/get-user-profile", authenticate, Controller.User.getUserProfile);
user.put("/update-user", authenticate, Controller.User.updateUser);
user.post("/create-chat",authenticate,Controller.Chat.createOrGetAOneOnOneChat);
user.patch("/delete-chat",authenticate,Controller.Chat.deleteChat);
user.get("/chats",authenticate,Controller.Chat.getAllChats);
user.post("/message",authenticate,Controller.Chat.sendMessage);
user.get("/message",authenticate,Controller.Chat.getMessages);
user.get("/get-media-or-links",authenticate,Controller.Chat.getMediaAndLinksOFGroup);
user.get("/unread-message",authenticate,Controller.Chat.getUnreadMessages);
user.patch("/unread-message",authenticate,Controller.Chat.updateUnreadMessages);
user.get("/unread-notification",authenticate,Controller.Chat.getUnreadNotification);
user.patch("/unread-notification",authenticate,Controller.Chat.updateUnreadNotification);

export default user;

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
