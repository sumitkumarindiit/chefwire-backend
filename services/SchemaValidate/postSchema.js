import joi from "joi";

export const postSchema = joi.object({
  media: joi.array().items(joi.binary()),
  description: joi.string().when('media', {
    is: joi.exist(),
    then: joi.optional(),
    otherwise: joi.required()
  })
});

export const postIdSchema = joi.object({
  post_id: joi.string().hex().length(24).required(),
  page:joi.string()
});
export const reportSchema = joi.object({
  post_id: joi.string().hex().length(24).required(),
  message: joi.string(),
});
export const reportCmtSchema = joi.object({
  comment_id: joi.string().hex().length(24).required(),
  message: joi.string(),
});
export const likeCmtSchema = joi.object({
  comment_id: joi.string().hex().length(24).required(),
});
export const commentIdSchema = joi.object({
  comment_id: joi.string().hex().length(24).required(),
  page:joi.string()
});
export const commentSchema = joi.object({
  post_id: joi.string().hex().length(24).required(),
  parent_id: joi.string().hex().length(24),
  replied_user_id: joi.string().hex().length(24),
  comment: joi.string().required(),
});
