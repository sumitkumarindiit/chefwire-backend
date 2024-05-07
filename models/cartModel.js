import mongoose from "mongoose";

const Schema = mongoose.Schema;
const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    couponId:{
      type:Schema.Types.ObjectId,
      ref:"Coupon"
    },
    items: [
      {
        restaurantMenuId: {
          type: Schema.Types.ObjectId,
          ref: "RestaurantMenu",
          index: true,
          required: true,
        },
        price: [
          {
            sizeId: {
              type: Schema.Types.ObjectId,
            },
            size:{type:String},
            unitPrice: { type: Number },
            quantity: { type: Number },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
