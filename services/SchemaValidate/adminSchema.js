import joi from "joi";
import { Constants } from "../Constants.js";
import { passwordSchema } from "./userSchema.js";

export const blockOrUnblockSchema = joi.object({
  user_id: joi.string().hex().length(24).required(),
  status: joi.string().valid(Constants.ACTIVE, Constants.INACTIVE).required(),
});
export const updateUserSchema = joi.object({
  user_id: joi.string().hex().length(24).required(),
  first_name: joi.string(),
  last_name: joi.string(),
  email: joi.string().email(),
  phone_number: joi.string().min(10).max(10),
  country: joi.string(),
  country_code: joi.string(),
  state: joi.string(),
  state_code: joi.string(),
  city: joi.string(),
  zip_code: joi.string().min(3).max(8),
  cover_photo: joi.any(),
  about: joi.string(),
  role: joi.string().hex().length(24).required(),
  profile_pic: joi.string().allow("",null),
});
export const deleteProjectSchema = joi.object({
  project_id: joi.string().hex().length(24).required(),
  status: joi.string().valid(Constants.ACTIVE, Constants.INACTIVE).required(),
});
export const nameSchema = joi.object({
  name: joi.string().required(),
});
export const schoolSchema = joi.object({
  name: joi.string().required(),
  school_id_number:joi.string().required()
});
export const updateSchoolSchema = joi.object({
  id:joi.string().hex().length(24).required(),
  name: joi.string(),
  school_id_number:joi.string()
});
export const nameUpdateSchema = joi.object({
  id:joi.string().hex().length(24).required(),
  name: joi.string(),
});
export const deleteGroupSchema = joi.object({
  group_id: joi.string().hex().length(24).required(),
  status: joi.string().valid(Constants.ACTIVE, Constants.INACTIVE).required(),
});
export const deletePostSchema = joi.object({
  post_id: joi.string().hex().length(24).required(),
  status: joi.string().valid(Constants.ACTIVE, Constants.INACTIVE).required(),
});
export const deleteCommentSchema = joi.object({
  comment_id: joi.string().hex().length(24).required(),
  status: joi.string().valid(Constants.ACTIVE, Constants.INACTIVE).required(),
});
export const getPostSchema = joi.object({
  post_id: joi.string().hex().length(24),
  is_admin_post: joi.boolean(),
  user_id: joi.string().hex().length(24),
  filter: joi.string().allow(""),
  sort: joi.string().allow(""),
});
export const getCommentSchema = joi.object({
  comment_id: joi.string().hex().length(24),
  user_id: joi.string().hex().length(24),
  filter: joi.string().allow(""),
  sort: joi.string().allow(""),
});
export const getGroupSchema = joi.object({
  group_id: joi.string().hex().length(24),
  user_id: joi.string().hex().length(24),
  filter: joi.string().allow(""),
  sort: joi.string().allow(""),
});
export const getChatSchema = joi.object({
  page:joi.string().allow(""),
  message_id: joi.string().hex().length(24),
  group_id: joi.string().hex().length(24),
  user_id: joi.string().hex().length(24),
  filter: joi.string().allow(""),
  sort: joi.string().allow(""),
});
export const getPassionSchema = joi.object({
  passion_id: joi.string().hex().length(24),
  user_id: joi.string().hex().length(24),
  filter: joi.string().allow(""),
  sort: joi.string().allow(""),
});
export const getRoleSchema = joi.object({
  role_id: joi.string().hex().length(24),
  filter: joi.string().allow(""),
});
export const createRoleSchema = joi.object({
  role: joi.string().required(),
  permissions: joi
    .object()
    .pattern(
      joi.string(),
      joi.object({
        view: joi.boolean(),
        edit: joi.boolean(),
        delete: joi.boolean(),
        add: joi.boolean(),
      })
    )
    .required(),
});
export const addOrgUser = joi.object({
  role: joi.string().hex().length(24).required(),
  first_name: joi.string().required(),
  last_name: joi.string().required(),
  email: joi.string().email().required(),
  profile_pic: joi.string(),
  phone_number: joi.string().min(10).max(10).required(),
  country: joi.string().required(),
  country_code: joi.string().required(),
  state_code: joi.string().required(),
  state: joi.string().required(),
  city: joi.string().required(),
  zip_code: joi.string().min(3).max(8).required(),
  password: passwordSchema,
});
export const updateRoleSchema = joi.object({
  role_id: joi.string().hex().length(24).required(),
  role: joi.string(),
  permissions: joi.object().pattern(
    joi.string(),
    joi.object({
      view: joi.boolean(),
      edit: joi.boolean(),
      delete: joi.boolean(),
      add: joi.boolean(),
    })
  ),
});
export const roleIdSchema = joi.object({
  role_id: joi.string().hex().length(24).required(),
});
export const privacySchema = joi.object({
  name: joi.string().valid("privacy policy", "terms and conditions").required(),
  description: joi.string().required(),
});
export const postSchema = joi.object({
  tags: joi.array().items(joi.string()),
  description: joi.string().when("media", {
    is: joi.exist(),
    then: joi.string().allow(""),
    otherwise: joi.string().required(),
  }),
  media: joi
    .array()
    .items(joi.object({ filename: joi.string(), type: joi.string() })),
});
export const createFaqCatSchema = joi.object({
  name: joi.string().required(),
});
export const updateFaqCatSchema = joi.object({
  faq_cat_id: joi.string().hex().length(24).required(),
  name: joi.string(),
  status: joi.string().valid(Constants.ACTIVE, Constants.INACTIVE),
});
export const updateRCatSchema = joi.object({
  resource_cat_id: joi.string().hex().length(24).required(),
  name: joi.string(),
  status: joi.string().valid(Constants.ACTIVE, Constants.INACTIVE),
});
export const updateFaqOrderSchema = joi
  .array()
  .items(
    joi.object({
      faq_id: joi.string().hex().length(24).required(),
      order: joi.number().required(),
    })
  );
export const updateFaqCatOrderSchema = joi
  .array()
  .items(
    joi.object({
      faq_cat_id: joi.string().hex().length(24).required(),
      order: joi.number().required(),
    })
  );
export const updateOrderSchema = joi
  .array()
  .items(
    joi.object({
      id: joi.string().hex().length(24).required(),
      order: joi.number().required(),
    })
  );
export const faqCatIdSchema = joi.object({
  faq_cat_id: joi.string().hex().length(24).required(),
});
export const faqCatIdOptionalSchema = joi.object({
  faq_cat_id: joi.string().hex().length(24),
});
export const createFaqSchema = joi.object({
  faq_cat_id:joi.string().hex().length(24).required(),
  question: joi.string().required(),
  answer: joi.string().required(),
});
export const createResourceSchema = joi.object({
  parent_id:joi.string().hex().length(24).required(),
  name: joi.string().required(),
  link: joi.string().uri().required(),
});
export const updateFaqSchema = joi.object({
  faq_id: joi.string().hex().length(24).required(),
  question: joi.string(),
  answer: joi.string(),
  status: joi.string().valid(Constants.ACTIVE, Constants.INACTIVE),
});
export const resetSchema = joi.object({
  email: joi.string().email().required(),
  verification_string: joi.string().required(),
  password: passwordSchema,
});
export const updateResourceSchema = joi.object({
  resource_id: joi.string().hex().length(24).required(),
  link: joi.string(),
  name: joi.string(),
  status: joi.string().valid(Constants.ACTIVE, Constants.INACTIVE),
});
export const faqIdSchema = joi.object({
  faq_id: joi.string().hex().length(24).required(),
});
export const idSchema = joi.object({
  id: joi.string().hex().length(24).required(),
});
export const deleteSchema = joi.object({
  id: joi.string().hex().length(24).required(),
  status: joi.string().valid(Constants.ACTIVE,Constants.INACTIVE).required(),
});
export const getIdOptionalSchema = joi.object({
  id: joi.string().hex().length(24),
  filter:joi.string().allow(""),
  page:joi.string()
});
export const faqIdOptionalSchema = joi.object({
  faq_id: joi.string().hex().length(24),
});
export const getFaqSchema = joi.object({
  faq_id: joi.string().hex().length(24),
  faq_cat_id: joi.string().hex().length(24),
});
export const getFaqCatSchema = joi.object({
  faq_cat_id: joi.string().hex().length(24),
  list: joi.boolean(),
});
export const getRCatSchema = joi.object({
  resource_cat_id: joi.string().hex().length(24),
  resource_id:joi.string().hex().length(24),
  list: joi.boolean(),
});

