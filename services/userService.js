import User from "../models/userModel.js";
import FormData from "form-data";
import * as Helper from "./HelperFunction.js";
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
    __v:0,
    updatedAt:0,
    createdAt:0,
 
  };
  if (profile) {
    project = {
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      status: 0,
      mobileVerified: 0,
      deviceToken: 0,
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
      $project: project,
    },
  ];
};
