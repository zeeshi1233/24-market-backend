// ============ ADMIN ORDER CONTROLLER ============ //
import asyncHandler from "../Middleware/AsyncHandlers.js";
import OrderSchema from "../model/OrderSchema.js";
import { ApiError, ApiSuccess } from "../utils/ApiResponse.js";
import { stripe } from "../stripe/Stripe.js";
import User from "../model/UserSchema.js";
// Get all orders (with buyer & seller info)
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await OrderSchema.find()
    .populate("buyer", "firstName lastName email")
    .populate("seller", "firstName lastName email")
    .populate("product");

  return ApiSuccess(res, "All orders fetched (Admin)", orders);
});

// Get order by ID
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await OrderSchema.findById(id)
    .populate("buyer", "firstName lastName email")
    .populate("seller", "firstName lastName email")
    .populate("product");

  if (!order) return ApiError(res, "Order not found", 404);

  return ApiSuccess(res, "Order fetched (Admin)", order);
});

// Update order status (Admin override)
export const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // pending, shipped, delivered, cancelled, refunded

  const order = await OrderSchema.findById(id);
  if (!order) return ApiError(res, "Order not found", 404);

  order.orderStatus = status;
  await order.save();

  return ApiSuccess(res, "Order status updated by Admin", order);
});

// Delete order (Admin only – optional)
export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await OrderSchema.findById(id);
  if (!order) return ApiError(res, "Order not found", 404);

  await OrderSchema.findByIdAndDelete(id);

  return ApiSuccess(res, "Order deleted successfully (Admin)");
});

// ============ ADMIN: RELEASE PAYMENT TO SELLER AFTER DELIVERY ============ //
export const releasePaymentToSeller = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await OrderSchema.findById(orderId).populate("seller buyer");

  if (!order) return ApiError(res, "Order not found", 404);
  const user = await User.findById(order.seller._id);
  if (order.orderStatus !== "delivered") {
    return ApiError(res, "Order is not marked as delivered yet", 400);
  }

  if (order.paymentStatus !== "paid") {
    return ApiError(
      res,
      "Payment not captured or already released/refunded",
      400
    );
  }
 console.log(user)
  if (!user.stripeAccountId) {
    return ApiError(
      res,
      "Seller does not have a connected Stripe account",
      400
    );
  }

  // --------------------------
  const totalAmount = order.totalAmount; // in EUR/USD etc.
  const commissionRate = 0.1; // 10%
  const commissionAmount = totalAmount * commissionRate;
  const sellerAmount = totalAmount - commissionAmount;

  // ✅ Transfer seller’s share only
  const transfer = await stripe.transfers.create({
    amount: Math.round(sellerAmount * 100), // cents
    currency: "usd",
    destination: user.stripeAccountId,
    metadata: {
      orderId: order._id.toString(),
      sellerId: user._id.toString(),
      commission: commissionAmount.toFixed(2),
    },
  });

  // 💾 Save commission info in DB
  order.paymentStatus = "released";
  order.commissionAmount = commissionAmount;
  await order.save();

  return ApiSuccess(res, "Payment released to seller successfully", {
    order,
    commissionAmount,
    sellerAmount,
    transfer,
  });
});

export const createOnboardingLink = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);

  // if (!user || user.role !== "seller") {
  //   return ApiError(res, "Only sellers can onboard", 400);
  // }

  if (!user.stripeAccountId) {
    return ApiError(res, "Seller does not have a Stripe account", 400);
  }

  const accountLink = await stripe.accountLinks.create({
    account: user.stripeAccountId, // seller’s connected account
    refresh_url: "https://e-commerce-web-marketing.vercel.app/", // agar fail ho to redirect
    return_url: "https://e-commerce-web-marketing.vercel.app/", // complete hone ke baad redirect
    type: "account_onboarding",
  });

  return ApiSuccess(res, "Stripe onboarding link created", {
    url: accountLink.url,
  });
});
