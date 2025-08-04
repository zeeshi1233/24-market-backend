import express from "express";
import { protect } from "../Middleware/ProtectedRoutes.js";
import { addToWishlist, getWishList, removeFromWishList } from "../controller/savedItems.js";
const wishListRoute = express.Router();
wishListRoute.post("/add", protect, addToWishlist);
wishListRoute.get("/get-items", protect, getWishList);
wishListRoute.post("/remove", protect, removeFromWishList);

export default wishListRoute;
