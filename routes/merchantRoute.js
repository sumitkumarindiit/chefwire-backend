import express from "express";
import * as Controller from "../controllers/index.js";
import {authenticate,merchantRoute} from "../middleware/auth.js";
const merchant = express.Router();


merchant.patch("/delete-gallery-image",authenticate,Controller.Merchant.deleteSingleImageFromMerchantProfileGallery);
merchant.post("/create-category",authenticate,Controller.Merchant.createCategory);
merchant.put("/update-category",authenticate,Controller.Merchant.updateCategory);
merchant.delete("/delete-category",authenticate,Controller.Merchant.deleteCategory);
merchant.post("/create-menu",authenticate,merchantRoute,Controller.Merchant.createMenu);
merchant.post("/create-q&a",authenticate,merchantRoute,Controller.Merchant.createQna);
merchant.put("/update-q&a",authenticate,merchantRoute,Controller.Merchant.updateQna);
merchant.patch("/update-q&a-order",authenticate,merchantRoute,Controller.Merchant.updateQnaOrder);
merchant.get("/get-q&a",authenticate,Controller.Merchant.getQnq);
merchant.delete("/delete-q&a",authenticate,merchantRoute,Controller.Merchant.deleteQna);
merchant.post("/create-table-slot",authenticate,merchantRoute,Controller.Merchant.createTableSlot);

export default merchant;