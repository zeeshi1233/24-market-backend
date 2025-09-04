import ProductSchema from "../model/ProductSchema.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await ProductSchema.find({ status: "available" })
      .populate({
        path: "seller",
        select: "firstName lastName email phoneNumber profilePic",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getSingleProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductSchema.findById(id).populate({
      path: "seller",
      select: "firstName lastName email phoneNumber profilePic",
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error("Error fetching single product:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductSchema.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.seller.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized: Not your product" });
    }

    await product.deleteOne();

    // Optionally remove from user's postedProducts
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { postedProducts: id },
    });

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
