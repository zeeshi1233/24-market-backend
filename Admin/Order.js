// ============ ADMIN ORDER CONTROLLER ============ //

import Stripe from "stripe";
import asyncHandler from "../Middleware/AsyncHandlers.js";
import OrderSchema from "../model/OrderSchema.js";
import { ApiError, ApiSuccess } from "../utils/ApiResponse.js";

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

  if (!order.seller.stripeAccountId) {
    return ApiError(
      res,
      "Seller does not have a connected Stripe account",
      400
    );
  }

  // ✅ Transfer money from Admin’s Stripe balance to Seller’s connected account
  const transfer = await Stripe.transfers.create({
    amount: order.totalAmount * 100, // cents
    currency: "usd",
    destination: order.seller.stripeAccountId, // seller connected account ID
    metadata: {
      orderId: order._id.toString(),
      sellerId: order.seller._id.toString(),
    },
  });

  order.paymentStatus = "released";
  await order.save();

  return ApiSuccess(res, "Payment released to seller successfully", {
    order,
    transfer,
  });
});
