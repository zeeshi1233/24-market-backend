// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, default: 1 },
  totalAmount: Number,
  paymentMethod: { type: String, enum: ["card", "cod"] },
  paymentStatus: { type: String, default: "pending" },
  deliveryAddress: {
    street: String,
    city: String,
    postalCode: String,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
