import asyncHandler from "../Middleware/AsyncHandlers.js";
import OrderSchema from "../model/OrderSchema.js";
import ProductSchema from "../model/ProductSchema.js";
import User from "../model/UserSchema.js";
import { stripe } from "../stripe/Stripe.js";
import { ApiError, ApiSuccess } from "../utils/ApiResponse.js";

// ============ PLACE ORDER WITH STRIPE PAYMENT ============ //
export const placeOrder = asyncHandler(async (req, res) => {
  const userId = req?.user?.id;
  const {
    productId,
    quantity,
    deliveryAddress,
    paymentData: {
      saveCard,
      paymentMethodId, // new card
      savedPaymentMethodId, // saved card (optional)
    } = {},
    paymentMethod = "card", // default = card, you can pass "cod"
  } = req.body;

  if (!productId || !quantity) {
    return ApiError(res, "Product and quantity are required", 400);
  }

  // 1) Check product availability
  const product = await ProductSchema.findById(productId).populate("seller");
  if (!product || product.status === "sold") {
    return ApiError(res, "Product not available", 400);
  }

  const user = await User.findById(userId);
  if (!user) return ApiError(res, "User not found", 404);

  let paymentIntent;
  let shouldSaveCard = false;

  if (paymentMethod === "card") {
    // 2) Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    let finalPaymentMethodId;

    // 3) Handle payment method
    if (savedPaymentMethodId) {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        savedPaymentMethodId
      );
      if (paymentMethod.customer !== customerId) {
        return ApiError(res, "Invalid saved card selected.", 400);
      }
      finalPaymentMethodId = savedPaymentMethodId;
    } else {
      finalPaymentMethodId = paymentMethodId;

      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      if (saveCard) {
        shouldSaveCard = true;
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });
        user.stripePaymentMethodId = paymentMethodId;
        await user.save();
      }
    }

    // 4) Create PaymentIntent
    const totalAmount = product.price * quantity * 100; // cents
    paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      customer: customerId,
      payment_method: finalPaymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      description: `Order for ${product.title}`,
      metadata: {
        userId: userId.toString(),
        productId: product._id.toString(),
      },
    });

    if (!saveCard && !savedPaymentMethodId) {
      await stripe.paymentMethods.detach(finalPaymentMethodId);
    }

    if (paymentIntent.status === "requires_action") {
      return ApiSuccess(res, "Payment requires additional authentication", {
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
      });
    } else if (paymentIntent.status !== "succeeded") {
      return ApiError(res, "Payment failed. Please try again.", 400);
    }
  }

  // 5) Create order
  const order = new OrderSchema({
    buyer: userId,
    seller: product.seller, // ✅ required field
    product: productId,
    quantity,
    totalAmount: product.price * quantity,
    deliveryAddress,
    paymentMethod: paymentMethod,
    paymentStatus: paymentMethod === "card" ? "paid" : "pending",
    paymentId: paymentIntent?.id || null,
    orderStatus: "pending",
  });

  await order.save();

  if (quantity === 1) {
    product.status = "sold";
    await product.save();
  }

  // Push order in user
  await User.findByIdAndUpdate(userId, {
    $push: { orders: order._id },
    $set: { cart: [] }, // 🧹 clear cart after order
  });

  return ApiSuccess(res, "Order placed successfully", {
    order,
    cardSaved: shouldSaveCard,
  });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const orders = await OrderSchema.find({ buyer: userId })
    .populate("product")
    .populate("seller", "firstName lastName email");
  return ApiSuccess(res, "User orders fetched", orders);
});

export const getSellerOrders = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const orders = await OrderSchema.find({ seller: sellerId })
    .populate("product")
    .populate("buyer", "firstName lastName email");
    console.log(sellerId,"sellerId")
  return ApiSuccess(res, "Seller orders fetched", orders);
});




// Seller And Admin

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // pending, shipped, delivered, cancelled

  const order = await OrderSchema.findById(id);
  if (!order) return ApiError(res, "Order not found", 404);

  order.orderStatus = status;
  await order.save();

  return ApiSuccess(res, "Order status updated", order);
});



export const finalizeOrder = asyncHandler(async (req, res) => {
  const { orderId, action } = req.body; // "release" or "refund"

  const order = await OrderSchema.findById(orderId).populate("seller buyer");
  if (!order) return ApiError(res, "Order not found", 404);

  if (action === "release") {
    // Transfer money to seller Stripe account (must be connected account)
    await stripe.transfers.create({
      amount: order.totalAmount * 100, // cents
      currency: "usd",
      destination: order.seller.stripeAccountId, // seller’s connected Stripe account ID
      metadata: { orderId: order._id.toString() },
    });
    order.paymentStatus = "paid";
  } else if (action === "refund") {
    // Refund buyer
    await stripe.refunds.create({ payment_intent: order.paymentId });
    order.paymentStatus = "refunded";
  } else {
    return ApiError(res, "Invalid action", 400);
  }

  await order.save();
  return ApiSuccess(res, "Order finalized", order);
});
