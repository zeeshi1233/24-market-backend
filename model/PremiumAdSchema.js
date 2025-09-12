// model/PremiumAdSchema.js
import mongoose from "mongoose";

const PremiumAd = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bannerImage: { type: String, required: true }, // cloudinary / s3 url
    isApproved: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
    },
    stripePaymentId: { type: String },
    durationDays: { type: Number, required: true }, // e.g. 10, 20, 30
    expiryDate: { type: Date }, // auto-set at creation
  },
  { timestamps: true }
);
const PremiumAdSchema = mongoose.model("PremiumAd", PremiumAd);
export default PremiumAdSchema;
