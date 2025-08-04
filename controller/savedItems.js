import mongoose from "mongoose";
import User from "../model/UserSchema.js";

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const existingItemIndex = user.wishlist?.findIndex(
      (item) => item?.product?.toString() === productId
    ); 


    if (existingItemIndex !== -1) {
      res.status(400).json({ success: false, message: "Already Exist Item" });
    } else {
      user.wishlist.push({ product: productId });
    }

    await user.save();

    const populatedUser = await User.findById(req.user.id).populate("wishlist.product");

    res.status(200).json({ success: true, wishlist: populatedUser.wishlist });
  } catch (err) {
    console.error("Add to Wishlist error:", err);
    res.status(500).json({ success: false, error: "Failed to add to Wishlist" });
  }
};

export const getWishList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlist.product"); // populates the actual product

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    console.error("Error fetching Wishlist:", err);
    res.status(500).json({ success: false, error: "Failed to fetch Wishlist" });
  }
};


export const removeFromWishList = async (req, res) => {
  try {
    const { productId } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { wishlist: { product: productId } },
    });

    res.status(200).json({ success: true, message: "Removed from Wishlist" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to remove from Wishlist" });
  }
};
