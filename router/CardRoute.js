import express from "express";
import { addCard, getCards, deleteCard, updateCard } from "../controller/StripeController.js";
import { protect } from "../Middleware/ProtectedRoutes.js";

const CardRoute = express.Router();

CardRoute.post("/add", protect, addCard);
CardRoute.get("/get", protect, getCards);
CardRoute.delete("/delete", protect, deleteCard);
CardRoute.put("/update", protect, updateCard);

export default CardRoute;
