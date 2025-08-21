// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, default: 1 },
  totalAmount: { type: Number, required: true },
  deliveryAddress: Object,

  paymentMethod: { type: String, enum: ["card", "cod"], default: "card" },
  paymentStatus: { type: String, enum: ["pending", "paid", "refunded"], default: "pending" },

  orderStatus: {
    type: String,
    enum: ["pending", "shipped", "delivered", "cancelled"],
    default: "pending",
  },

  paymentId: String, // Stripe PaymentIntent ID
}, { timestamps: true });


export default mongoose.model("Order", orderSchema);
