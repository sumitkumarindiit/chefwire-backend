import User from "../models/userModel.js";
import FormData from "form-data";
import * as Helper from "./HelperFunction.js";
import Coupon from "../models/couponModel.js";
import { Constants } from "./Constants.js";
import DineIn from "../models/dineInModel.js";
export const findMutualFriends = async (my_id, user_id) => {
  try {
    const [user, other_user] = await Promise.all([
      User.findById(my_id)
        .populate("my_network.user_id", "_id first_name last_name profile_pic")
        .populate("blocked_user", "_id first_name last_name")
        .select("-__v -createdAt -updatedAt -status -email_verified -password")
        .lean(),
      User.findById(user_id)
        .populate("my_network.user_id", "_id first_name last_name profile_pic")
        .populate("blocked_user", "_id first_name last_name")
        .select("-__v -createdAt -updatedAt -status -email_verified -password")
        .lean(),
    ]);
    let mutualFriends;
    if (user && other_user) {
      const usersFriendIds = user.my_network.map((friend) => {
        return friend.user_id?._id?.toString();
      });
      const otherUsersFriendIds = other_user.my_network?.map((friend) =>
        friend.user_id?._id?.toString()
      );
      // console.log({usersFriendIds,otherUsersFriendIds});
      const mutualFriendIds = usersFriendIds?.filter((id) =>
        otherUsersFriendIds?.includes(id)
      );
      // console.log({ mutualFriendIds });
      mutualFriends = user.my_network?.filter((friend) => {
        // console.log(friend)
        return mutualFriendIds?.includes(friend.user_id?._id?.toString());
      });
      // console.log(mutualFriends);
      return mutualFriends;
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const textModeration = async (res, comment) => {
  try {
    const data = new FormData();
    data.append("text", comment);
    data.append("lang", "en");
    data.append("mode", "ml");
    data.append("api_user", process.env.SIGHTENGINE_USER);
    data.append("api_secret", process.env.SIGHTENGINE_SECRET);

    const response = await axios({
      url: "https://api.sightengine.com/1.0/text/check.json",
      method: "post",
      data: data,
      headers: data.getHeaders(),
    });
    const data1 = response.data.moderation_classes;
    const disallowedKeys = [];
    for (const key in data1) {
      if (data1[key] > 0.15) {
        disallowedKeys.push(key);
      }
    }

    if (disallowedKeys.length > 0) {
      return `${disallowedKeys[0]} content not allowed`;
    } else {
      return null;
    }
  } catch (error) {
    if (error.response) console.log(error.response.data);
    else console.log(error.message);
    return null;
  }
};
export const imageModeration = async (images) => {
  try {
    for (const image of images) {
      const data = new FormData();
      data.append("media", image.data, {
        filename: image.name,
        contentType: image.mimetype,
      });
      data.append("models", "nudity-2.0");
      data.append("api_user", process.env.SIGHTENGINE_USER);
      data.append("api_secret", process.env.SIGHTENGINE_SECRET);
      const response = await axios({
        method: "post",
        url: "https://api.sightengine.com/1.0/check.json",
        data: data,
        headers: data.getHeaders(),
      });
      const data1 = response.data.nudity;
      if (data1.sexual_activity > 0.15 || data1.sexual_display > 0.15) {
        return `sexual content not allowed`;
      }
    }
    return null;
  } catch (error) {
    if (error.response) console.log(error.response.data);
    else console.log(error.message);
    return null;
  }
};
export const userCommonAggregation = (profile) => {
  let project = {
    __v: 0,
    updatedAt: 0,
    followers: 0,
    followings: 0,
    createdAt: 0,
  };
  if (profile) {
    project = {
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      status: 0,
      followers: 0,
      followings: 0,
      mobileVerified: 0,
      deviceToken: 0,
      jwtToken: 0,
      socialMediaId: 0,
      signupType: 0,
      otpVerified: 0,
      password: 0,
    };
  }
  return [
    {
      $lookup: {
        from: "roles",
        localField: "role",
        foreignField: "_id",
        as: "role",
        pipeline: [
          {
            $project: {
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$role",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "addresses",
        localField: "_id",
        foreignField: "addressId",
        as: "currentAddress",
        pipeline: [
          {
            $match: {
              addressType: "CURRENT",
            },
          },
          {
            $project: {
              __v: 0,
              addressId: 0,
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$currentAddress",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        role: "$role.role",
      },
    },
    {
      $project: project,
    },
  ];
};
export const merchantCommonAggregation = (profile) => {
  const project = {
    __v: 0,
    createdAt: 0,
    updatedAt: 0,
    status: 0,
    mobileVerified: 0,
    deviceToken: 0,
    jwtToken: 0,
    socialMediaId: 0,
    signupType: 0,
    otpVerified: 0,
    password: 0,
  };

  return [
    {
      $lookup: {
        from: "roles",
        localField: "role",
        foreignField: "_id",
        as: "role",
        pipeline: [
          {
            $project: {
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$role",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "plans",
        localField: "plan",
        foreignField: "_id",
        as: "plan",
        pipeline: [
          {
            $project: {
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$plan",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        role: "$role.role",
        plan: "$plan.name",
      },
    },
    {
      $match: {
        role: "merchant",
      },
    },
    {
      $lookup: {
        from: "services",
        localField: "services",
        foreignField: "_id",
        as: "services",
        pipeline: [
          {
            $project: {
              __v: 0,
              updatedAt: 0,
              createdAt: 0,
              icon: 0,
              _id: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        services: "$services.name",
      },
    },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "restaurantId",
        as: "reviews",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "reviewedBy",
              pipeline: [
                {
                  $project: {
                    name: 1,
                    profilePic: 1,
                  },
                },
              ],
            },
          },
          {
            $project: {
              __v: 0,
              updatedAt: 0,
              reviewedId: 0,
              reviewType: 0,
              userId: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        rating: {
          $cond: {
            if: { $gt: [{ $size: "$reviews" }, 0] },
            then: { $avg: "$reviews.rating" },
            else: 0,
          },
        },
      },
    },
    {
      $lookup: {
        from: "qnas",
        localField: "_id",
        foreignField: "restaurantId",
        as: "Q&A",
        pipeline: [
          {
            $project: {
              question: 1,
              answer: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "addresses",
        localField: "_id",
        foreignField: "addressId",
        as: "address",
        pipeline: [
          {
            $project: {
              __v: 0,
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ],
      },
    },
    {
      $project: project,
    },
  ];
};

export const validateCoupon = async (req, couponId) => {
  try {
    const coupon = await Coupon.findOne({
      _id: couponId,
      status: Constants.ACTIVE,
      validTill: { $gt: Date.now() },
    })
      .select("-__v -status -updateAt -createdAt")
      .lean();
    if (!coupon) {
      return {
        status: false,
        message: "This coupon is expired",
      };
    }
    if (coupon.isGlobal) {
      if (
        coupon.excludedUsers
          .map((id) => id.toString())
          .includes(req.user._id.toString())
      ) {
        return {
          status: false,
          message: "You already used this coupon",
        };
      }
    }
    if (!coupon.isGlobal) {
      const users = coupon.eligibleUsers.find((id) =>
        id.userId.toString() === req.user._id.toString()
      );
      if (
        !users
      ) {
        return {
          status: false,
          message: "You are not eligible for this coupon",
        };
      } else {
        if(Helper.isExpired(users.expireTime)){
          return {
            status: false,
            message: "This coupon has been expired",
          };
        }
      }
    }
    return {
      status: true,
      message: "Coupon verified successfully",
      data: coupon,
    };
  } catch (err) {
    return null;
  }
};
export const bookTable = async (date, restaurantId, type, slotId) => {
  try {
    let updateField;
    switch (type) {
      case "BREAKFAST":
        updateField = "breakFastSchedule";
        break;
      case "LUNCH":
        updateField = "lunchSchedule";
        break;
      case "DINNER":
        updateField = "dinnerSchedule";
        break;
      default:
        return {
          status: false,
          message: "Invalid table type",
        };
    }
    const dineIn = await DineIn.findOne({ restaurantId });
    if (!dineIn) {
      return {
        status: false,
        message: "Table not found for this restaurant",
      };
    }
    const schedule = dineIn[updateField];
    const slotIndex = schedule.findIndex(
      (slot) => slot._id.toString() === slotId
    );
    if (slotIndex === -1) {
      return {
        status: false,
        message: "Slot not found",
      };
    }
    const slot = schedule[slotIndex];
    if (slot.booked >= dineIn.capacity) {
      return {
        status: false,
        message: "Slot fully booked",
      };
    }
    slot.booked += 1;
    slot.bookedDate = new Date(date);
    await dineIn.save();
    return {
      status: true,
      message: "Table booked successfully",
    };
  } catch (err) {
    return null;
  }
};
