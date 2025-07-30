import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      match: /.+\@.+\..+/,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expirationTime: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
