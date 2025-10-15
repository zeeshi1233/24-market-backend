import cloudinary from "../cloudinaryConfig.js";
import asyncHandler from "../Middleware/AsyncHandlers.js";
import { ApiError, ApiSuccess } from "../utils/ApiResponse.js";
import ProductSchema from "../model/ProductSchema.js";
import PremiumAdSchema from "../model/PremiumAdSchema.js";
import { stripe } from "../stripe/Stripe.js";

// 💰 Updated fee mapping
const adPricing = {
  2: 0, // ✅ Free for 2 days
  10: 5, // €5 for 10 days
  20: 10, // €10 for 20 days
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

  // ✅ Upload images to Cloudinary
  const uploadPromises = images.map((image) => {
    return new Promise((resolve, reject) => {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
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

  const adFee = adPricing[durationDays];
  let paymentIntent = null;

  // ✅ Only charge via Stripe if price > 0
  if (adFee > 0) {
    paymentIntent = await stripe.paymentIntents.create({
      amount: adFee * 100,
      currency: "eur",
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });
  }

  const premiumAd = await PremiumAdSchema.create({
    product: productId,
    user: userId,
    bannerImage: bannerUrl,
    stripePaymentId: paymentIntent ? paymentIntent.id : null,
    durationDays,
    status: adFee === 0 ? "approved" : "pending", // Free ads = auto approved
    isApproved: adFee === 0, // instantly active
  });

  return ApiSuccess(
    res,
    adFee === 0
      ? "Free Premium Ad activated for 2 days!"
      : "Premium Ad request submitted successfully.",
    premiumAd
  );
});

export const getUserPremiumAds = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  // Expire old ads automatically
  await PremiumAdSchema.updateMany(
    { user: userId, expiryDate: { $lt: now }, status: "approved" },
    { $set: { status: "expired", isApproved: false } }
  );

  const ads = await PremiumAdSchema.find({ user: userId })
    .populate("product", "title price images")
    .sort({ createdAt: -1 });

  return ApiSuccess(res, "Your Premium Ads", ads);
});
