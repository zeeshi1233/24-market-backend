import asyncHandler from "../Middleware/AsyncHandlers.js";
import PremiumAdSchema from "../model/PremiumAdSchema.js";
import { stripe } from "../stripe/Stripe.js";
import { ApiError, ApiSuccess } from "../utils/ApiResponse.js";

export const getAllPremiumAds = asyncHandler(async (req, res) => {
  const { status } = req.query; // optional filter: ?status=pending/approved/rejected/expired

  const filter = {};
  if (status) filter.status = status;

  const ads = await PremiumAdSchema.find(filter)
    .populate("user", "firstName email") // show user details
    .populate("product", "title price images") // show product details
    .sort({ createdAt: -1 });

  if (!ads || ads.length === 0) {
    return ApiError(res, "No premium ads found", 404);
  }

  return ApiSuccess(res, "Premium ads fetched successfully", ads);
});

export const approvePremiumAd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ad = await PremiumAdSchema.findById(id);
  if (!ad) return ApiError(res, "Ad not found", 404);

  ad.status = "approved";
  ad.isApproved = true;

  // ⏳ Expiry ab yahan se start hoga
  if (ad.durationDays) {
    ad.expiryDate = new Date(
      Date.now() + ad.durationDays * 24 * 60 * 60 * 1000
    );
  }

  await ad.save();
  return ApiSuccess(res, "Premium Ad approved", ad);
});

export const rejectPremiumAd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ad = await PremiumAdSchema.findById(id);
  if (!ad) return ApiError(res, "Ad not found", 404);

  ad.status = "rejected";
  ad.isApproved = false;
  ad.expiryDate = null; // ensure koi timer start na ho
  await ad.save();

  // Refund agar Stripe se payment hui ho
  if (ad.stripePaymentId) {
    try {
      await stripe.refunds.create({ payment_intent: ad.stripePaymentId });
    } catch (error) {
      console.error("Refund error:", error);
      return ApiError(res, "Refund failed", 500);
    }
  }

  return ApiSuccess(res, "Premium Ad rejected and refunded", ad);
});
