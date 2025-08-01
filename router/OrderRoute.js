import express from "express";
import { protect } from "../Middleware/ProtectedRoutes.js";
import { placeOrder } from "../controller/Order.js";

const orderRoute = express.Router();

orderRoute.post("/buy-product", protect, placeOrder);

export default orderRoute;
