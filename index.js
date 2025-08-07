import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import UserRouter from "./router/UserRoute.js";
import cors from "cors";
import productRouter from "./router/ProductRoute.js";
import orderRoute from "./router/OrderRoute.js";
import cartRouter from "./router/CartRoute.js";
import { DbConnectionError } from "./error/DBConnectionError.js";
import wishListRoute from "./router/WishlistRoute.js";
import CardRoute from "./router/CardRoute.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Server is working" });
});
app.use("/user", UserRouter);
app.use("/product", productRouter);
app.use("/order", orderRoute);
app.use("/cart", cartRouter);
app.use("/wishlist", wishListRoute);
app.use("/payment", CardRoute);

// ✅ MongoDB Connection + Server Start
const start = async () => {
  const DB_URI = process.env.MONGODB_URL;
  if (!DB_URI) {
    throw new Error("❌ MONGODB_URL is not defined in environment");
  }

  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    throw new DbConnectionError(err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
};

start();
