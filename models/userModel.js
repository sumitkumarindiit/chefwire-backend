import mongoose from "mongoose";
import { Constants } from "../services/Constants.js";

const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    role: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "Role",
    },
    plan:{
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
      ref: "Plan",
    },
    name: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    title: {
      type: String,
      lowercase: true,
      default: null,
    },
    email: {
      type: String,
      lowercase: true,
      required: true,
      index: true,
    },
    profilePic: {
      type: String,
      default: null,
    },
    coverPic: {
      type: String,
      default: null,
    },
    gallery: [String],
    menu: [String],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // Longitude first, then Latitude
        default: [],
        index: "2dsphere",
      },
    },

    openingHours: [String],
    services: [
      {
        type: Schema.Types.ObjectId,
        ref: "Service",
        index: true,
      },
    ],
    profession: {
      type: String,
      default: null,
    },
    mobileNumber: {
      type: String,
      required: true,
      index: true,
    },
    countryCode: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      index: true,
    },
    bio: {
      type: String,
      default: null,
    },
    socialMediaId: {
      type: String,
      default: null,
      index: true,
    },
    signUpType: {
      type: String,
      uppercase: true,
      enum: ["GOOGLE", "FACEBOOK", "APPLE", "EMAIL"],
      default: "EMAIL",
    },
    deviceToken: {
      type: String,
      default: null,
    },
    jwtToken: {
      type: String,
      default: null,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    followers: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        time: { type: Date, default: Date.now() },
      },
    ],
    followings: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        time: { type: Date, default: Date.now() },
      },
    ],
    savedPosts: [{ type: Schema.Types.ObjectId, ref: "Post", index: true }],
    unreadMessages: [],
    unreadNotification:{
      type:Number,
      default:0
    },
    status: {
      type: String,
      enum: [Constants.ACTIVE, Constants.INACTIVE],
      default: Constants.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);
const User = mongoose.model("User", userSchema);
export default User;
