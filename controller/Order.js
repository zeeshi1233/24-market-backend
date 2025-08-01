// controllers/orderController.js
import OrderSchema from "../model/OrderSchema.js";
import ProductSchema from "../model/ProductSchema.js";
import User from "../model/UserSchema.js";

// import Stripe from "stripe";
// import Product from "../models/Product.js";

// controllers/orderController.js

export const placeOrder = async (req, res) => {
  const { productId, quantity, deliveryAddress, paymentMethod, stripePaymentIntentId } = req.body;

  try {
    const product = await ProductSchema.findById(productId);
    if (!product || product.status === "sold") {
      return res.status(400).json({ error: "Product not available" });
    }

    // Confirm the PaymentIntent was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    const total = product.price * quantity;

    const order = new OrderSchema({
      buyer: req.user.id,
      product: productId,
      quantity,
      totalAmount: total,
      deliveryAddress,
      paymentMethod,
      paymentStatus: "paid",
      paymentId: stripePaymentIntentId,
    });

    await order.save();

    if (quantity === 1) {
      product.status = "sold";
      await product.save();
    }

    await User.findByIdAndUpdate(req.user.id, {
      $push: { orders: order._id },
    });

    res.status(200).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to place order" });
  }
};


// controllers/stripeController.js

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export const createStripeSession = async (req, res) => {
//   try {
//     const { productId, quantity } = req.body;

//     const product = await Product.findById(productId);
//     if (!product) return res.status(404).json({ error: "Product not found" });

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       line_items: [
//         {
//           price_data: {
//             currency: "usd",
//             product_data: {
//               name: product.title,
//               description: product.description,
//             },
//             unit_amount: product.price * 100,
//           },
//           quantity,
//         },
//       ],
//       mode: "payment",
//       success_url: `${process.env.CLIENT_URL}/success`,
//       cancel_url: `${process.env.CLIENT_URL}/cancel`,
//     });

//     res.status(200).json({ url: session.url });
//   } catch (error) {
//     res.status(500).json({ error: "Stripe session creation failed" });
//   }
// };
