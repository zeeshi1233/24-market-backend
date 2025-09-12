import cloudinary from "../cloudinaryConfig.js";
import asyncHandler from "../Middleware/AsyncHandlers.js";
import { ApiError, ApiSuccess } from "../utils/ApiResponse.js";
import ProductSchema from "../model/ProductSchema.js";
import PremiumAdSchema from "../model/PremiumAdSchema.js";
import { stripe } from "../stripe/Stripe.js";

// 💰 Fee mapping
const adPricing = {
  10: 10, // $10 for 10 days
  20: 18, // $18 for 20 days
  30: 25, // $25 for 30 days
};

export const requestPremiumAd = asyncHandler(async (req, res) => {
  const { productId, paymentMethodId, durationDays } = req.body;
  const userId = req.user.id;
  const images = req.files;

  if (!images || images.length === 0) {
    return ApiError(res, "No image uploaded", 400);
  }

  if (!adPricing[durationDays]) {
    return ApiError(res, "Invalid ad duration", 400);
  }

  const uploadPromises = images.map((image) => {
    return new Promise((resolve, reject) => {
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (image.size > MAX_FILE_SIZE) {
        return reject(new Error("File size exceeds 10MB limit."));
      }
      cloudinary.uploader
        .upload_stream({ folder: "24-market-premium-ads" }, (error, result) => {
          if (error) return reject(new Error("Cloudinary upload failed."));
          resolve(result.secure_url);
        })
        .end(image.buffer);
    });
  });

  const [bannerUrl] = await Promise.all(uploadPromises);

  const product = await ProductSchema.findById(productId);
  if (!product) return ApiError(res, "Product not found", 404);
  if (String(product.seller) !== String(userId)) {
    return ApiError(res, "You can only promote your own product", 403);
  }

  // Stripe payment
  const adFee = adPricing[durationDays];
  const paymentIntent = await stripe.paymentIntents.create({
    amount: adFee * 100,
    currency: "eur",
    payment_method: paymentMethodId,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never", // 🚀 force no redirects
    },
  });

  const premiumAd = await PremiumAdSchema.create({
    product: productId,
    user: userId,
    bannerImage: bannerUrl,
    stripePaymentId: paymentIntent.id,
    durationDays,
    status: "pending",
  });

  return ApiSuccess(res, "Premium Ad requested", premiumAd);
});

export const getUserPremiumAds = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  // Expired ads ko update karo
  await PremiumAdSchema.updateMany(
    { user: userId, expiryDate: { $lt: now }, status: "approved" },
    { $set: { status: "expired", isApproved: false } }
  );

  const ads = await PremiumAdSchema.find({ user: userId })
    .populate("product", "title price images")
    .sort({ createdAt: -1 });

  return ApiSuccess(res, "Your Premium Ads", ads);
});
