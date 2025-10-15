// routes/adminRoutes.js
import express from "express";
import { loginAdmin, registerAdmin } from "../Admin/AdminAuth.js";
import { isAdmin, protect } from "../Middleware/ProtectedRoutes.js";
import {
  deleteProduct,
  getAllProducts,
  getSingleProductById,
} from "../Admin/Product.js";
import {
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  getCategories,
  getSubCategoriesByCategory,
  updateCategory,
  updateSubCategory,
} from "../Admin/Category.js";
import {
  adminUpdateOrderStatus,
  deleteOrder,
  getAdminDashboardStats,
  getAllOrders,
  getOrderById,
  releasePaymentToSeller,
} from "../Admin/Order.js";
import { deleteUser, getAllUsers, getSingleUserById } from "../Admin/User.js";
import {
  approvePremiumAd,
  getAllPremiumAds,
  rejectPremiumAd,
} from "../Admin/PremiumAds.js";

const AdminRouter = express.Router();
// Auth Routes
AdminRouter.post("/register", registerAdmin);
AdminRouter.post("/login", loginAdmin);
// Product Route
AdminRouter.get("/get-products", protect, getAllProducts);
AdminRouter.get("/get-single-product/:id", protect, getSingleProductById);
AdminRouter.delete("/delete-product/:id", protect, deleteProduct);
// Product Route
AdminRouter.get("/get-users", protect, getAllUsers);
AdminRouter.get("/get-single-user/:id", protect, getSingleUserById);
AdminRouter.delete("/delete-user/:id", protect, deleteUser);

// Category
AdminRouter.post("/create-category", protect, createCategory);
AdminRouter.post("/create-sub-category", protect, createSubCategory);
AdminRouter.get("/get-categories", getCategories);
AdminRouter.get("/get-sub-categories/:id", getSubCategoriesByCategory);

// SUBCATEGORY
AdminRouter.put("/update-category/:id", protect, updateCategory);
AdminRouter.delete("/delete-category/:id", protect, deleteCategory);
AdminRouter.put("/subcategory/:id", protect, updateSubCategory);
AdminRouter.delete("/subcategory/:id", protect, deleteSubCategory);

AdminRouter.get("/orders", protect, getAllOrders); // Get all orders
AdminRouter.get("/orders/:id", protect, getOrderById); // Get single order
AdminRouter.patch("/orders/:id", protect, adminUpdateOrderStatus); // Update status
AdminRouter.delete("/orders/:id", protect, deleteOrder); // Delete order
AdminRouter.post("/release-payment", protect, releasePaymentToSeller); // Release Payment order
AdminRouter.get("/get-stats", protect, getAdminDashboardStats); // Release Payment order

// Premium Ads
AdminRouter.get("/premium-ads", protect, getAllPremiumAds);
AdminRouter.post("/aprove-ads/:id", protect, approvePremiumAd);
AdminRouter.post("/reject-ads/:id", protect, rejectPremiumAd);

export default AdminRouter;
