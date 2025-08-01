import User from "../model/UserSchema.js";

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const user = await User.findById(req.user.id);
    const existingItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex !== -1) {
      // If already in cart, update quantity
      user.cart[existingItemIndex].quantity += quantity || 1;
    } else {
      user.cart.push({ product: productId, quantity: quantity || 1 });
    }

    await user.save();
    res.status(200).json({ success: true, cart: user.cart });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to add to cart" });
  }
};

export const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product");
    res.status(200).json({ success: true, cart: user.cart });
  } catch (err) {
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
    res.status(500).json({ success: false, error: "Failed to remove from cart" });
  }
};

