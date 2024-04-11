
// import * as Helper from "../services/HelperFunction.js";
// import * as validatePost from "../services/SchemaValidate/homeSchema.js";
// import { Logs } from "../middleware/log.js";
// import { Constants } from "../services/Constants.js";
// import mongoose,{ObjectId} from "mongoose";



// export const createPage = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.createPage, req.body, res)) return;
//     const page = await Page.create({
//       user_id: req.user._id,
//       school_id:req.user.school_id,
//       ...req.body,
//     });
//     if (!page) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 404);
//     }
//     await Logs(req, Constants.DATA_SAVED, next);
//     return Helper.successMsg(res, Constants.DATA_SAVED, page);
//   } catch (err) {
//     console.log("Errors", err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const updatePage = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.updatePage, req.body, res)) return;
//     const { page_id, ...rest } = req.body;
//     const page = await Page.findByIdAndUpdate(page_id, rest);
//     if (!page) {
//       Logs(req, Constants.DATA_NOT_SAVED, next);
//       return Helper.errorMsg(res, Constants.DATA_NOT_SAVED, 404);
//     }
//     await Logs(req, Constants.DATA_UPDATED, next);
//     return Helper.successMsg(res, Constants.DATA_UPDATED, page);
//   } catch (err) {
//     console.log("Errors", err);
//     Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const getPages = async (req, res) => {
//   try {
//     if (Helper.validateRequest(validatePost.getPage, req.query, res)) return;
//     const { type, school_id, page_id, search } = req.query;
//     let projectOption = {
//       __v: 0,
//       updatedAt: 0,
//     };
//     let matchOptions = {};
//     if(page_id){
//         matchOptions={
//             _id:new mongoose.Types.ObjectId(page_id)
//         }
//     }
//     if (type) {
//       if (type === "OFFICERLIST") {
//         matchOptions = {
//           user_id: new mongoose.Types.ObjectId(req.user._id),
//         };
//         projectOption={
//           name:1,
//           description:1,
//           profile_pic:1
//         }
//       } else if (type === "STUDENTLIST") {
//         matchOptions = {
//           followed_by: { $in: new mongoose.Types.ObjectId(req.user._id) },
//         };
//       }
//     }
//     let sortOption = {
//       createdAt: -1,
//     };

//     const aggregate = [
//       {
//         $match: matchOptions,
//       },
//       {
//         $project: projectOption,
//       },
//       {
//         $sort: sortOption,
//       },
//     ];
//     const passion = await Page.aggregate(aggregate);
//     return Helper.successMsg(res, Constants.DATA_GET, passion);
//   } catch (err) {
//     console.log(err);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
// export const deletePage = async (req, res, next) => {
//   try {
//     if (Helper.validateRequest(validatePost.idSchema, req.query, res)) return;
//     await Passion.findByIdAndDelete(req.query.id);
//     await Logs(req, Constants.DATA_DELETED, next);
//     return Helper.successMsg(res, Constants.DATA_DELETED, {});
//   } catch (err) {
//     console.log(err);
//     await Logs(req, Constants.SOMETHING_WRONG, next);
//     return Helper.errorMsg(res, Constants.SOMETHING_WRONG, 500);
//   }
// };
