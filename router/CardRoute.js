import express from "express";
import { addCard, getCards, deleteCard, updateCard } from "../controller/StripeController.js";
import { protect } from "../Middleware/ProtectedRoutes.js";
import { createOnboardingLink } from "../Admin/Order.js";

const CardRoute = express.Router();

CardRoute.post("/add", protect, addCard);
CardRoute.get("/get", protect, getCards);
CardRoute.delete("/delete", protect, deleteCard);
CardRoute.put("/update", protect, updateCard);
CardRoute.put("/stripe-connect", protect,createOnboardingLink);

export default CardRoute;
