import asyncHandler from "../Middleware/AsyncHandlers.js";
import OrderSchema from "../model/OrderSchema.js";
import ProductSchema from "../model/ProductSchema.js";
import User from "../model/UserSchema.js";
import { stripe } from "../stripe/Stripe.js";
import { ApiError, ApiSuccess } from "../utils/ApiResponse.js";

// ============ PLACE ORDER WITH STRIPE PAYMENT ============ //
export const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    productId,
    quantity,
    deliveryAddress,
    paymentData: {
      saveCard,
      paymentMethodId, // new card
      savedPaymentMethodId, // saved card (optional)
    },
  } = req.body;

  if (!productId || !quantity) {
    throw new ApiError(400, "Product and quantity are required");
  }

  // 1) Check product availability
  const product = await ProductSchema.findById(productId);
  if (!product || product.status === "sold") {
    throw new ApiError(400, "Product not available");
  }

  // 2) Get or create Stripe customer
  const user = await User.findById(userId);
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
  let shouldSaveCard = false;

  // 3) Handle payment method
  if (savedPaymentMethodId) {
    const paymentMethod = await stripe.paymentMethods.retrieve(
      savedPaymentMethodId
    );
    if (paymentMethod.customer !== customerId) {
      throw new ApiError(400, "Invalid saved card selected.");
    }
    finalPaymentMethodId = savedPaymentMethodId;
  } else {
    finalPaymentMethodId = paymentMethodId;

    if (saveCard) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
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
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: "usd",
    payment_method: finalPaymentMethodId,
    customer: customerId,
    confirmation_method: "manual",
    confirm: true,
    description: `Order for ${product.title}`,
    metadata: {
      userId: userId.toString(),
      productId: product._id.toString(),
    },
  });

  // 5) Payment Status
  if (paymentIntent.status === "requires_action") {
    return res.status(200).json(
      new ApiSuccess(200, "Payment requires additional authentication", {
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
      })
    );
  } else if (paymentIntent.status !== "succeeded") {
    throw new ApiError(400, "Payment failed. Please try again.");
  }

  // 6) Create order after success
  const order = new OrderSchema({
    buyer: userId,
    product: productId,
    quantity,
    totalAmount: product.price * quantity,
    deliveryAddress,
    paymentMethod: "card",
    paymentStatus: "paid",
    paymentId: paymentIntent.id,
  });

  await order.save();

  // Update product status if only 1
  if (quantity === 1) {
    product.status = "sold";
    await product.save();
  }

  // Push order in user
  await User.findByIdAndUpdate(userId, {
    $push: { orders: order._id },
  });

  res.status(200).json(
    new ApiSuccess(200, "Order placed successfully", {
      order,
      cardSaved: shouldSaveCard,
    })
  );
});
