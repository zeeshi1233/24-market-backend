// routes/adminRoutes.js
import express from "express";
import { loginAdmin, registerAdmin } from "../Admin/AdminAuth.js";
import { isAdmin, protect } from "../Middleware/ProtectedRoutes.js";
import { getAllProducts, getSingleProductById } from "../Admin/Product.js";
import {
  createCategory,
  createSubCategory,
  getCategories,
  getSubCategoriesByCategory,
} from "../Admin/Category.js";
import {
  adminUpdateOrderStatus,
  deleteOrder,
  getAllOrders,
  getOrderById,
  releasePaymentToSeller,
} from "../Admin/Order.js";
import { deleteUser, getAllUsers, getSingleUserById } from "../Admin/User.js";

const AdminRouter = express.Router();
// Auth Routes
AdminRouter.post("/register", registerAdmin);
AdminRouter.post("/login", loginAdmin);
// Product Route
AdminRouter.get("/get-products", protect, getAllProducts);
AdminRouter.get("/get-single-product/:id", protect, getSingleProductById);
// Product Route
AdminRouter.get("/get-users", protect, getAllUsers);
AdminRouter.get("/get-single-user/:id", protect, getSingleUserById);
AdminRouter.delete("/delete-user/:id", protect, deleteUser);

// Category
AdminRouter.post("/create-category", protect, createCategory);
AdminRouter.post("/create-sub-category", protect, createSubCategory);
AdminRouter.get("/get-categories", getCategories);
AdminRouter.get("/get-sub-categories/:id", getSubCategoriesByCategory);

AdminRouter.get("/orders", protect, getAllOrders); // Get all orders
AdminRouter.get("/orders/:id", protect, getOrderById); // Get single order
AdminRouter.patch("/orders/:id", protect, adminUpdateOrderStatus); // Update status
AdminRouter.delete("/orders/:id", protect, deleteOrder); // Delete order
AdminRouter.post("/release-payment", protect, releasePaymentToSeller); // Release Payment order

export default AdminRouter;
