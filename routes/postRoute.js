import express from 'express';
import * as Controller from "../controllers/index.js";
import {authenticate} from "../middleware/auth.js";

const post = express.Router();

post.post('/create-post',authenticate,Controller.Post.createPost);
post.patch('/like',authenticate,Controller.Post.likePost);
post.patch('/unlike-post',authenticate,Controller.Post.unLikePost);
post.get("/get-posts",authenticate,Controller.Post.getAllPost);
post.get("/get-liked-users",authenticate,Controller.Post.getAllLikedUsersOfPost);
post.post("/comment",authenticate,Controller.Post.commentPost);
post.get("/get-comments",authenticate,Controller.Post.getAllCommentsOfPost);
post.get("/get-replies",authenticate,Controller.Post.getAllRepliesOfComments);
post.patch("/share-post",authenticate,Controller.Post.sharePost);
post.patch("/like-comment",authenticate,Controller.Post.likeComment);
post.patch("/unlike-comment",authenticate,Controller.Post.unLikeComment);
post.delete("/delete-comment",authenticate,Controller.Post.deleteComment);
post.patch("/delete-post",authenticate,Controller.Post.deletePost);
post.patch("/report-post",authenticate,Controller.Post.reportPost);
post.patch("/save-post",authenticate,Controller.Post.savePost);
// post.patch("/report-comment",authenticate,studentRoute,Controller.Post.reportComment);

/** CREATE POST */
/**
 * @swagger
 * '/post/create-post':
 *  post:
 *     tags:
 *     - Post Controller
 *     summary: Create a new post
 *     requestBody:
 *      required: true
 *      content:
 *       multipart/form-data:
 *           schema:
 *            type: object
 *            required:
 *              - description
 *            properties:
 *              tags:
 *                type: string
 *                default: xyz  
 *              description:
 *                type: string
 *                default: singh  
 *              file:
 *                type: string
 *                format: binary
 *     responses:
 *      200:
 *        description: Data saved
 *      400:
 *        description: Data not saved
 *      500:
 *        description: Server Error
 */


/** LIKE POST */
/**
 * @swagger
 * '/post/like':
 *  patch:
 *     tags:
 *     - Post Controller
 *     summary: Like post
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *           schema:
 *            type: object
 *            required:
 *              - post_id
 *            properties:
 *              post_id:
 *                type: string
 *                default: 65939c211edc32615e4a5b89
 *     responses:
 *      200:
 *        description: Data saved
 *      400:
 *        description: Data not saved
 *      500:
 *        description: Server Error
 */


/** UNLIKE POST */
/**
 * @swagger
 * '/post/unlike-post':
 *  patch:
 *     tags:
 *     - Post Controller
 *     summary: UNLike post
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *           schema:
 *            type: object
 *            required:
 *              - post_id
 *            properties:
 *              post_id:
 *                type: string
 *                default: 65939c211edc32615e4a5b89
 *     responses:
 *      200:
 *        description: Data saved
 *      400:
 *        description: Data not saved
 *      500:
 *        description: Server Error
 */


/** GET ALL POST */
/**
 * @swagger
 * '/post/get-posts':
 *  get:
 *     tags:
 *     - Post Controller
 *     summary: Get all post
 *     requestBody:
 *      required: false
 *      content:
 *       application/json:
 *     responses:
 *      200:
 *        description: Data saved
 *      400:
 *        description: Data not saved
 *      500:
 *        description: Server Error
 */


/** COMMENT POST */
/**
 * @swagger
 * '/post/comment':
 *  post:
 *     tags:
 *     - Post Controller
 *     summary: Comment post
 *     requestBody:
 *      required: true
 *      content:
 *      multipart/form-data:
 *           schema:
 *            type: object
 *            required:
 *              - post_id
 *              - comment
 *            properties:
 *              post_id:
 *                type: string
 *                default: 65939c211edc32615e4a5b89
 *              comment:
 *                type: string
 *                default: good
 *              file:
 *                type: string
 *                format: binary
 *     responses:
 *      200:
 *        description: Data saved
 *      400:
 *        description: Data not saved
 *      500:
 *        description: Server Error
 */


/** SHARE POST */
/**
 * @swagger
 * '/post/share-post':
 *  post:
 *     tags:
 *     - Post Controller
 *     summary: Share post
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *           schema:
 *            type: object
 *            required:
 *              - post_id
 *            properties:
 *              post_id:
 *                type: string
 *                default: 65939c211edc32615e4a5b89
 *     responses:
 *      200:
 *        description: Data saved
 *      400:
 *        description: Data not saved
 *      500:
 *        description: Server Error
 */

/** LIKE COMMENT */
/**
 * @swagger
 * '/post/like-comment':
 *  patch:
 *     tags:
 *     - Post Controller
 *     summary: Like Comment
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *           schema:
 *            type: object
 *            required:
 *              - comment_id
 *            properties:
 *              comment_id:
 *                type: string
 *                default: 65939c211edc32615e4a5b89
 *     responses:
 *      200:
 *        description: Data saved
 *      400:
 *        description: Data not saved
 *      500:
 *        description: Server Error
 */

/** DELETE POST */
/**
 * @swagger
 * '/post/delete-post':
 *  patch:
 *     tags:
 *     - Post Controller
 *     summary: Delete post
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *           schema:
 *            type: object
 *            required:
 *              - post_id
 *            properties:
 *              post_id:
 *                type: string
 *                default: 65939c211edc32615e4a5b89
 *     responses:
 *      200:
 *        description: Data saved
 *      400:
 *        description: Data not saved
 *      500:
 *        description: Server Error
 */


/** REPORT POST */
/**
 * @swagger
 * '/post/report-post':
 *  patch:
 *     tags:
 *     - Post Controller
 *     summary: Report post
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *           schema:
 *            type: object
 *            required:
 *              - post_id
 *            properties:
 *              post_id:
 *                type: string
 *                default: 65939c211edc32615e4a5b89
 *              message:
 *                type: string
 *                default: this is not good
 *     responses:
 *      200:
 *        description: Data saved
 *      400:
 *        description: Data not saved
 *      500:
 *        description: Server Error
 */

/** UNLIKE COMMENT */
/**
 * @swagger
 * '/post/unlike-comment':
 *  patch:
 *     tags:
 *     - Post Controller
 *     summary: UNLike comment
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *           schema:
 *            type: object
 *            required:
 *              - comment_id
 *            properties:
 *              comment_id:
 *                type: string
 *                default: 65939c211edc32615e4a5b89
 *     responses:
 *      200:
 *        description: Data saved
 *      400:
 *        description: Data not saved
 *      500:
 *        description: Server Error
 */
export default post;