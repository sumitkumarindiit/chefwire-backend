import joi from "joi";
import { Constants } from "../Constants.js";

export const categorySchema = joi.object({
  name: joi.string().min(2).max(100).required(),
  icon:joi.binary().required(),
});
export const updateCategorySchema = joi.object({
  id: joi.string().hex().length(24).required(),
  name: joi.string().min(2).max(100),
  icon:joi.string(),
});
export const passionIdSchema = joi.object({
  passion_id: joi.string().hex().length(24).required(),
});
export const getPassion = joi.object({
  passion_id: joi.string().hex().length(24),
  list:joi.string().valid("DROPDOWN"),
  page:joi.string()
});
export const privacySchema = joi.object({
  name:joi.string().valid("privacy policy","terms and conditions").required(),
  // description: joi.string().required()
})
export const privacyGetSchema = joi.object({
  type:joi.string().valid("TERM","PRIVACY").required()
})
export const excelSchema = joi.object({
  name: joi.string().required().regex(/\.xlsx$/i),
  filename: joi.binary().required()
});
export const globalSchema = joi.object({
  type: joi.string().valid("ACADEMIN").required()
});

export const createPage = joi.object({
  name:joi.string().required(),
  description: joi.string().min(20).max(10000).required(),
  profile_pic:joi.string(),
})
export const updatePage = joi.object({
  page_id:joi.string().hex().length(24).required(),
  name:joi.string().required(),
  description: joi.string().min(20).max(10000).required(),
  profile_pic:joi.string(),
  cover_pic:joi.string(),
})
export const getPage = joi.object({
  page_id:joi.string().hex().length(24),
  type:joi.string().valid("STUDENT","OFFICER","STUDENTLIST","OFFICERLIST").required(),
  search:joi.string()
})
export const idSchema = joi.object({
  id:joi.string().hex().length(24).required()
})
export const optionalIdSchema = joi.object({
  id:joi.string().hex().length(24)
})
export const offerSchema = joi.object({
  couponId:joi.string().hex().length(24).required(),
  typeId:joi.string().hex().length(24),
  type:joi.string().valid("RESTAURANT", "DINEIN", "CATERER", "FOOD", "GLOBAL", "QUEST").required(),
  category:joi.string().valid("RESTAURANT", "DINEIN", "CATERER", "FOOD", "QUEST").required(),
  name:joi.string().allow(""),
  banner:joi.binary().required(),
  validTill:joi.date(),
  users:joi.array(),
})
export const questSchema = joi.object({
  couponId:joi.string().hex().length(24).required(),
  questTitle:joi.string().required(),
  rules:joi.array().items(joi.string()),
  banner:joi.binary(),
  validTill:joi.date(),
})
export const updateQuestSchema = joi.object({
  couponId:joi.string().hex().length(24),
  questTitle:joi.string(),
  rules:joi.array().items(joi.string()),
  validTill:joi.date(),
  
})
