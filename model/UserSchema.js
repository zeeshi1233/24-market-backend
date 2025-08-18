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

    // 🎭 Role (for future distinction: buyer/seller/admin)
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },

    // 🛒 Selling
    postedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // 🧾 Buying
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    // 📦 Saved delivery addresses
    savedAddresses: [
      {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        isDefault: { type: Boolean, default: false },
      },
    ],

    // ✅ Stripe Integration (direct card payments)
    stripeCustomerId: { type: String, default: null },
    stripePaymentMethodId: {
      type: String,
      default: null,
    },

    // ☑️ Verification flags
    isVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },

    // 🛒 Cart
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],

    // 💖 Wishlist
    wishlist: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
