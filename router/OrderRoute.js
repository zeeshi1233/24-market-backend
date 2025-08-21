import express from "express";
import { protect } from "../Middleware/ProtectedRoutes.js";
import { getSellerOrders, getUserOrders, placeOrder, updateOrderStatus } from "../controller/Order.js";

const orderRoute = express.Router();

orderRoute.post("/buy-product", protect, placeOrder);
orderRoute.get("/get-user-orders", protect, getUserOrders);
orderRoute.get("/get-seller-orders", protect, getSellerOrders);
orderRoute.put("/update-order/:id", protect, updateOrderStatus);

export default orderRoute;
