// import Privacy from "../models/privacyModel.js";
// import * as Helper from "../services/HelperFunction.js";
// import * as validatePost from "../services/SchemaValidate/homeSchema.js";
// import { Constants } from "../services/Constants.js";

// export const createPrivacy = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validatePost.privacySchema, req.body, res))
//       return;
//     const privacy = await Privacy.create(req.body);
//     if (!privacy) {
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 404);
//     }
//     return Helper.successMsg(res, Constants.DATA_SAVED, privacy);
//   } catch (err) {
//     console.log("Errors", err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };

// export const getPrivacy = async (req, res) => {
//   if (Helper.validateRequest(validatePost.privacyGetSchema, req.query, res))
//     return;
//   try {
//     const { type } = req.query;
//     const privacy = await Privacy.find({
//       ...(type === Constants.PRIVACY_TYPE
//         ? { name: "privacy policy" }
//         : { name: "terms and conditions" }),
//       status: Constants.ACTIVE,
//     });
//     return Helper.successMsg(res, Constants.DATA_GET, privacy);
//   } catch (err) {
//     console.error(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
