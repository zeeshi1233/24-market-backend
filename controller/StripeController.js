import { stripe } from "../stripe/Stripe.js";
import User from "../model/UserSchema.js";
import asyncHandler from "../Middleware/AsyncHandlers.js";
import { ApiError, ApiSuccess } from "../utils/ApiResponse.js";

// ================== ADD CARD ================== //
export const addCard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { paymentMethodId } = req.body; // from frontend stripe Elements

  if (!paymentMethodId) {
    return ApiError(res, "Payment Method ID required", 400);
  }

  // 1) Find user
  const user = await User.findById(userId);
  if (!user) return ApiError(res, "User not found", 404);

  // 2) Ensure stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId: user._id.toString() },
    });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  }

  // 3) Attach card to customer
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

  // 4) (Optional) Set as default
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  return ApiSuccess(res, "Card added successfully", { paymentMethodId });
});

// ================== GET CARDS ================== //
export const getCards = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user || !user.stripeCustomerId) {
    return ApiError(res, "No cards found for this user", 404);
  }

  // Fetch all cards linked with stripe customer
  const paymentMethods = await stripe.paymentMethods.list({
    customer: user.stripeCustomerId,
    type: "card",
  });

  return ApiSuccess(res, "Cards retrieved successfully", paymentMethods.data);
});

export const deleteCard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { paymentMethodId } = req.body;

  if (!paymentMethodId) return ApiError(res, "Payment Method ID required", 400);

  const user = await User.findById(userId);
  if (!user || !user.stripeCustomerId)
    return ApiError(res, "User not found", 404);

  // Detach payment method from Stripe
  await stripe.paymentMethods.detach(paymentMethodId);

  return ApiSuccess(res, "Card deleted successfully");
});

// ================== UPDATE CARD ================== //

export const updateCard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { oldPaymentMethodId, newPaymentMethodId } = req.body;

  if (!newPaymentMethodId)
    return ApiError(res, "New Payment Method ID required", 400);

  const user = await User.findById(userId);
  if (!user || !user.stripeCustomerId)
    return ApiError(res, "User not found", 404);

  // 1) Attach new card
  await stripe.paymentMethods.attach(newPaymentMethodId, {
    customer: user.stripeCustomerId,
  });

  // 2) Make it default
  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: { default_payment_method: newPaymentMethodId },
  });

  // 3) Optionally delete old card
  if (oldPaymentMethodId) {
    try {
      await stripe.paymentMethods.detach(oldPaymentMethodId);
    } catch (err) {
      console.warn("Old card could not be deleted:", err.message);
    }
  }

  return ApiSuccess(res, "Card updated successfully", { newPaymentMethodId });
});
