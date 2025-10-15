// models/Product.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: true,
  },
  images: [
    {
      url: String,
      public_id: String,
    },
  ],
  brand: String,
  title: String,
  description: String,
  location: String,
  price: Number,
  sellerName: String,
  sellerPhone: String,
  showPhone: { type: Boolean, default: false },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "available" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Product", ProductSchema);
