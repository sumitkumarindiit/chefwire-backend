import express from "express";
import * as Controller from "../controllers/index.js";
import {authenticate} from "../middleware/auth.js";
const home = express.Router();

home.get("/dashboard",authenticate,Controller.Home.getDashBoard);
home.post("/create-category",authenticate,Controller.Admin.createCategory);
home.get("/get-categories",authenticate,Controller.Home.getCategory);
home.put("/update-category",authenticate,Controller.Admin.updateCategory);
home.delete("/delete-category",authenticate,Controller.Admin.deleteCategory);
home.post("/create-service",authenticate,Controller.Admin.createService);
home.get("/get-services",authenticate,Controller.Home.getServices);
home.put("/update-service",authenticate,Controller.Admin.updateService);
home.delete("/delete-service",authenticate,Controller.Admin.deleteService);
home.post("/create-offer",authenticate,Controller.Admin.createOffer);
home.get("/get-restaurants",authenticate,Controller.Merchant.getRestaurants);

/** CREATE CATEGORY */
/**
 * @swagger
 * '/home/create-category':
 *  post:
 *     tags:
 *     - Home Controller
 *     summary: CREATE CATEGORY
 *     requestBody:
 *      required: true
 *      content:
 *        multipart/form-data:
 *           schema:
 *            type: object
 *            required:
 *              - name
 *              - icon
 *            properties:
 *              name:
 *                type: string
 *                default: fun
 *              file:
 *                type: string
 *                format: binary
 *     responses:
 *      200:
 *        description: Category created
 *      500:
 *        description: Server Error
 */

/** GET ALL CATEGORY */
/**
 * @swagger
 * '/home/get-categories':
 *  get:
 *     tags:
 *     - Home Controller
 *     summary: GET ALL CATEGORY
 *     responses:
 *      200:
 *        description: Category get
 *      500:
 *        description: Server Error
 */

/** GET PASSION */
/**
 * @swagger
 * '/home/get-passion':
 *  get:
 *     tags:
 *     - Home Controller
 *     summary: GET PASSION DETAILS
 *     parameters:
 *       - in: query
 *         name: passion_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the passion to get passion details
 *     responses:
 *      200:
 *        description: Passion get
 *      500:
 *        description: Server Error
 */

// /** DELETE PASSION */
// /**
//  * @swagger
//  * '/home/delete-passion':
//  *  patch:
//  *     tags:
//  *     - Home Controller
//  *     summary: DELETE PASSION
//  *     requestBody:
//  *      required: true
//  *      content:
//  *        application/json:
//  *           schema:
//  *            type: object
//  *            required:
//  *              - passion_id
//  *            properties:
//  *              passion_id:
//  *                type: string
//  *                default: 659fce654ef31e7af0c17aaf
//  *     responses:
//  *      200:
//  *        description: Passion created
//  *      500:
//  *        description: Server Error
//  */

// /** EDIT PASSION */
// /**
//  * @swagger
//  * '/home/edit-passion':
//  *  post:
//  *     tags:
//  *     - Home Controller
//  *     summary: EDIT PASSION
//  *     requestBody:
//  *      required: true
//  *      content:
//  *        multipart/form-data:
//  *           schema:
//  *            type: object
//  *            required:
//  *              - name
//  *              - description
//  *              - url
//  *              - genre
//  *            properties:
//  *              name:
//  *                type: string
//  *                default: fun
//  *              description:
//  *                type: string
//  *                default: this is for fun
//  *              url:
//  *                type: string
//  *                default: http://example.com
//  *              file:
//  *                type: string
//  *                format: binary
//  *              genre:
//  *                type: array
//  *                items:
//  *                  type: string
//  *                  default: fun
//  *     responses:
//  *      200:
//  *        description: Passion created
//  *      500:
//  *        description: Server Error
//  */



export default home;