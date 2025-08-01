import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import UserRouter from "./router/UserRoute.js";
import cors from "cors";
import productRouter from "./router/ProductRoute.js";
import orderRoute from "./router/OrderRoute.js";
import cartRouter from "./router/CartRoute.js";
// import CommunityRouter from "./router/CommunityRoute.js";
const app = express();
const port = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.json({ 
    message: "Server is working", 
  });
});
app.use("/user", UserRouter);
app.use("/product", productRouter);
app.use("/order", orderRoute);
app.use("/cart",cartRouter);
// app.use("/community", CommunityRouter);
// ✅ Root route for confirmation
// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Run server on port 3000 (for local development)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});