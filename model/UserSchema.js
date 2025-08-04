import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: "" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /.+\@.+\..+/,
    },
    phoneNumber: {
      type: String,
      required: true,
      match: /^\+?(\d{1,3})?(\d{10})$/,
    },
    profilePic: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },

    postedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // 🧾 For Buying
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    // 📦 For saving delivery addresses (can be multiple)
    savedAddresses: [
      {
        street: String,
        city: String,
        postalCode: String,
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // this must match your Product model name exactly
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    wishlist: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // this must match your Product model name exactly
        },
       
      },
    ],
  },
  { timestamps: true } // Adds createdAt and updatedAt timestamps to the schema
);

const User = mongoose.model("User", userSchema);

export default User;
