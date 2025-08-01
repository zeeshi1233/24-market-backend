import express from "express";
import { addToCart, getCart, removeFromCart } from "../controller/Cart.js";
import { protect } from "../Middleware/ProtectedRoutes.js";
const cartRouter = express.Router();
cartRouter.post("/add", protect, addToCart);
cartRouter.get("/get-items", protect, getCart);
cartRouter.post("/remove", protect, removeFromCart);

export default cartRouter;
