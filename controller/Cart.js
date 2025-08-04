import mongoose from "mongoose";
import User from "../model/UserSchema.js";
import ProductSchema from "../model/ProductSchema.js";

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Check if productId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    // Check if product exists
    const product = await ProductSchema.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if product is already in cart
    const existingItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex !== -1) {
      // Update quantity
      user.cart[existingItemIndex].quantity += quantity || 1;
    } else {
      // Add new item to cart
      user.cart.push({ product: productId, quantity: quantity || 1 });
    }

    await user.save();

    const populatedUser = await User.findById(req.user.id).populate("cart.product");

    res.status(200).json({ success: true, cart: populatedUser.cart });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ success: false, error: "Failed to add to cart" });
  }
};

export const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product"); // populates the actual product

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, cart: user.cart });
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ success: false, error: "Failed to fetch cart" });
  }
};


export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { cart: { product: productId } },
    });

    res.status(200).json({ success: true, message: "Removed from cart" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to remove from cart" });
  }
};
