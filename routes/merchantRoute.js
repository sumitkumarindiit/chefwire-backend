import express from "express";
import * as Controller from "../controllers/index.js";
import {authenticate} from "../middleware/auth.js";
const merchant = express.Router();


merchant.patch("/delete-gallery-image",authenticate,Controller.Merchant.deleteSingleImageFromMerchantProfileGallery);
merchant.post("/create-category",authenticate,Controller.Merchant.createCategory);
merchant.put("/update-category",authenticate,Controller.Merchant.updateCategory);
merchant.delete("/delete-category",authenticate,Controller.Merchant.deleteCategory);
merchant.post("/create-menu",authenticate,Controller.Merchant.createMenu);


export default merchant;