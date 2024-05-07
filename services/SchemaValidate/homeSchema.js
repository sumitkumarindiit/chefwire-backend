import joi from "joi";
import { Constants } from "../Constants.js";

export const categorySchema = joi.object({
  restaurantId: joi.string().hex().length(24),
  name: joi.string().min(2).max(100).required(),
  icon: joi.binary(),
});
export const updateCategorySchema = joi.object({
  id: joi.string().hex().length(24).required(),
  name: joi.string().min(2).max(100),
  icon: joi.string(),
});

export const privacySchema = joi.object({
  name: joi.string().valid("privacy policy", "terms and conditions").required(),
  // description: joi.string().required()
});
export const privacyGetSchema = joi.object({
  type: joi.string().valid("TERM", "PRIVACY").required(),
});
export const excelSchema = joi.object({
  name: joi
    .string()
    .required()
    .regex(/\.xlsx$/i),
  filename: joi.binary().required(),
});
export const globalSchema = joi.object({
  type: joi.string().valid("ACADEMIN").required(),
});

export const idSchema = joi.object({
  id: joi.string().hex().length(24).required(),
});
export const optionalIdSchema = joi.object({
  id: joi.string().hex().length(24),
});
export const offerSchema = joi.object({
  couponId: joi.string().hex().length(24).required(),
  typeId: joi.string().hex().length(24),
  type: joi
    .string()
    .valid("RESTAURANT", "DINEIN", "CATERER", "FOOD", "GLOBAL", "QUEST")
    .required(),
  category: joi
    .string()
    .valid("RESTAURANT", "DINEIN", "CATERER", "FOOD", "QUEST")
    .required(),
  name: joi.string().allow(""),
  banner: joi.binary().required(),
  validTill: joi.date(),
  users: joi.array(),
});
export const questSchema = joi.object({
  couponId: joi.string().hex().length(24).required(),
  questTitle: joi.string().required(),
  rules: joi.array().items(joi.string()),
  banner: joi.binary(),
  validTill: joi.date(),
});
export const getQuestSchema = joi.object({
  questId: joi.string().hex().length(24),
});
export const updateQuestSchema = joi.object({
  couponId: joi.string().hex().length(24),
  questTitle: joi.string(),
  rules: joi.array().items(joi.string()),
  validTill: joi.date(),
});
export const couponSchema = joi.object({
  code: joi.string().required(),
  discount: joi.number().required(),
  discountType: joi.string().valid("FLAT", "UPTO"),
  validTill: joi.date(),
  isGlobal: joi.boolean().strict(true),
  eligibleUsers: joi.array().items(
    joi.object({
      userId: joi.string().hex().length(24).required(),
      validTill: joi.date(),
    })
  ),
  excludedUsers: joi.array().items(joi.string().hex().length(24).required()),
});
export const menuSchema = joi.object({
  categoryId: joi.string().hex().length(24).required(),
  name: joi.string().required(),
  nutrition: joi.array().items(
    joi.object({
      name: joi.string().required(),
      value: joi.number().required(),
    })
  ),
  description: joi.string().required(),
  price: joi.array().items(
    joi.object({
      size: joi.string().required(),
      price: joi.number().required(),
    })
  ),
  profilePic: joi.binary().required(),
});
export const getMenuSchema = joi.object({
  categoryId: joi.string().hex().length(24),
  menuId: joi.string().hex().length(24),
  type: joi.string().valid("CATERING", "RESTAURANT").required(),
});
export const makeOrderSchema = joi.object({
  restaurantId: joi.string().hex().length(24).required(),
  addressId: joi.string().hex().length(24).required(),
  couponId: joi.string().hex().length(24),
  orderType: joi.string().valid("CATERER", "DINEIN", "FOOD"),
  paymentMethod: joi.string(),
  items: joi.when("orderType", {
    is: "CATERER",
    then: joi.array().items(joi.string().hex().length(24)),
    otherwise: joi
      .array()
      .items(
        joi.object({
          restaurantMenuId: joi.string().hex().length(24).required(),
          price: joi.array().items(
            joi.object({
              sizeId: joi.string().hex().length(24).required(),
              size: joi.string().required(),
              unitPrice: joi.number().required(),
              quantity: joi.number().required(),
            })
          ),
        })
      )
      .required(),
  }),
  eventName: joi.string(),
  eventType: joi.string(),
  eventDate: joi.date(),
  eventTime: joi.string(),
  NoOfGuest: joi.number(),
  description: joi.string(),
});
export const getOrderSchema = joi.object({
  orderId: joi.string().hex().length(24),
  type: joi.when("orderId", {
    is: joi.exist(),
    then: joi.forbidden(),
    otherwise: joi.string().valid("UPCOMING", "PAST").required(),
  }),
});
export const addCartSchema = joi.object({
  items: joi
    .array()
    .items(
      joi.object({
        restaurantMenuId: joi.string().hex().length(24).required(),
        price: joi.array().items(
          joi.object({
            sizeId: joi.string().hex().length(24).required(),
            size: joi.string().required(),
            unitPrice: joi.number().required(),
            quantity: joi.number().required(),
          })
        ),
      })
    )
    .required(),
});
export const QnaSchema = joi.object({
  question: joi.string().required(),
  answer: joi.string().required(),
});
export const updateQnaSchema = joi.object({
  qnaId: joi.string().hex().length(24).required(),
  question: joi.string().required(),
  answer: joi.string().required(),
  status: joi.string().valid(Constants.ACTIVE, Constants.INACTIVE),
});
export const updateQnaOrderSchema = joi.array().items(
  joi.object({
    qnaId: joi.string().hex().length(24).required(),
    order: joi.number().required(),
  })
);
export const getQnaSchema = joi.object({
  qnaId: joi.string().hex().length(24),
  restaurantId: joi.string().hex().length(24),
  type: joi.string(),
});
export const feedBackSchema = joi.object({
  restaurantId: joi.string().hex().length(24).required(),
  orderId: joi.string().required(),
  rating: joi.number().required(),
  reviewText: joi.string(),
});
export const tableSlotSchema = joi.object({
  type: joi.string().valid("BREAKFAST","LUNCH","DINNER").required(),
  startTime: joi.string().required().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: joi.string().required().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  interval: joi.number().required(),
  capacity:joi.number().required()
});
