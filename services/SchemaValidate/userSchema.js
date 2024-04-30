import joi from "joi";

const passwordPattern =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,50}$/;
export const passwordSchema = joi
  .string()
  .pattern(passwordPattern)
  .messages({
    "string.pattern.base":
      "Password must contain at least one capital letter, one number, and one special character.",
  })
  .min(6)
  .max(50)
  .required();
export const signupSchema = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  countryCode: joi.string().required(),
  mobileNumber: joi.string().min(10).max(10).required(),
  password: passwordSchema,
  socialMediaId: joi.string(),
});
export const merchantSignupSchema = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  countryCode: joi.string().required(),
  mobileNumber: joi.string().min(10).max(10).required(),
  password: passwordSchema,
  openingHours: joi.array().items(joi.string().required()),
  profilePic: joi.binary().allow("", null),
  coverPic: joi.binary().allow("", null),
  location: joi
    .object({
      apartmentNo: joi.number(),
      street: joi.string(),
      landMark: joi.string(),
      city: joi.string(),
      zipCode: joi.string(),
      country: joi.string(),
      coordinates: joi.array().items(joi.number()).required(),
    })
    .required(),
  bio: joi.string(),
  title: joi.string().required(),
});
export const updatemerchantSchema = joi.object({
  merchantId: joi.string().hex().length(24).required(),
  name: joi.string(),
  email: joi.string().email(),
  countryCode: joi.string(),
  mobileNumber: joi.string().min(10).max(10),
  openingHours: joi.array().items(joi.string()),
  services: joi.array(),
  profilePic: joi.binary().allow("", null),
  coverPic: joi.binary().allow("", null),
  gallery: joi.array().items(joi.binary()),
  location: joi.object({
    apartmentNo: joi.number(),
    street: joi.string(),
    landMark: joi.string(),
    city: joi.string(),
    zipCode: joi.string(),
    country: joi.string(),
    coordinates: joi.array().items(joi.number()),
  }),
  bio: joi.string(),
  title: joi.string(),
});
export const deletePhotoGallery = joi.object({
  merchantId: joi.string().hex().length(24).required(),
  name: joi.string().required(),
});
export const getmerchantSchema = joi.object({
  restaurantId: joi.string().hex().length(24),
  sortBy: joi.string(),
  rating: joi.string(),
  search: joi.string(),
  services: joi
    .array()
    .items(
      joi.string().valid("Catering", "Drive-Thru", "Dine-In", "Restaurant")
    ),
});

export const loginSchema = joi.object({
  email: joi.string().email().when("socialMediaId", {
    is: joi.exist(),
    then: joi.forbidden(),
    otherwise: joi.required(),
  }),
  password: joi.string().max(50).when("socialMediaId", {
    is: joi.exist(),
    then: joi.forbidden(),
    otherwise: joi.required(),
  }),
  socialMediaId: joi.string(),
});

export const otpSchema = joi.object({
  email: joi.when("user_id", {
    is: joi.exist(),
    then: joi.forbidden(),
    otherwise: joi.string().email().required(),
  }),
  user_id: joi.string().hex().length(24),
  otp: joi.string().min(4).max(4).required(),
  type: joi.string().valid("SIGNUP", "FORGOT", "LOGIN").required(),
});
export const verifyOtpSchema = joi.object({
  email: joi.when("user_id", {
    is: joi.exist(),
    then: joi.forbidden(),
    otherwise: joi.string().email().required(),
  }),
  otp: joi.string().min(4).max(4).required(),
});
export const resetSchema = joi.object({
  userId: joi.string().hex().length(24).required(),
  otp: joi.string().required(),
  password: passwordSchema,
});
export const changePasswordSchema = joi.object({
  oldPassword: passwordSchema,
  newPassword: passwordSchema,
});
export const emailSchema = joi.object({
  email: joi.string().email().required(),
});
export const userIdSchema = joi.object({
  userId: joi.string().hex().length(24).required(),
});
export const userIdSchemaOptional = joi.object({
  userId: joi.string().hex().length(24),
});
export const userSearchQuery = joi.object({
  name: joi.string().allow(""),
  group_id: joi.string().hex().length(24),
});
export const groupIdSchema = joi.object({
  group_id: joi.string().hex().length(24).required(),
});
export const groupRequestSchema = joi.object({
  group_id: joi.string().hex().length(24).required(),
  notification_id: joi.string().hex().length(24).required(),
});
export const deleteChatSchema = joi.object({
  group_id: joi.string().hex().length(24).required(),
  type: joi.string().valid("DELETE", "EXIT").required(),
});
export const groupSchema = joi.object({
  name: joi.string().min(2).max(100).required(),
  description: joi.string().min(1).max(10000).required(),
  file: joi.any(),
  user_id: joi.array().items(joi.string().regex(/^[0-9a-fA-F]{24}$/)),
});
export const updateGroupSchema = joi.object({
  group_id: joi.string().hex().length(24).required(),
  name: joi.string().min(2).max(100),
  description: joi.string().min(20).max(10000),
  notification_muted: joi.boolean().strict(true),
  // file:joi.array().items(joi.binary()),
  user_id: joi.array().items(joi.string().regex(/^[0-9a-fA-F]{24}$/)),
});
export const chatSchema = joi.object({
  group_id: joi.string().hex().length(24).required(),
  message_text: joi.when("message_file", {
    is: joi.exist(),
    then: joi.optional(),
    otherwise: joi.string().min(1).required(),
  }),
  message_file: joi.binary(),
});
export const updateUserSchema = joi.object({
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
  profile_pic: joi.string().allow(""),
});
export const updateAddressSchema = joi.object({
  apartmentNo: joi.string(),
  street: joi.string(),
  landMark: joi.string(),
  city: joi.string(),
  country: joi.string(),
  zipCode: joi.string(),
  addressType: joi
    .string()
    .valid("HOME", "OFFICE", "WORK", "CURRENT", "OTHER")
    .required(),
  addressTitle: joi.string(),
  coordinates: joi.array().items(joi.number()),
});
