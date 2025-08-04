import express from "express";
import { deleteProduct, getAllProducts, getSingleProductById, postProductAd, updateProduct } from "../controller/Product.js";
import { protect } from "../Middleware/ProtectedRoutes.js";
import upload from "../Middleware/uploadMiddleware.js";

const productRouter = express.Router();

productRouter.post("/sell-product",protect,upload, postProductAd);  
productRouter.get("/get-products",getAllProducts);  
productRouter.get("/get-product/:id",getSingleProductById);  
productRouter.put("/update-product/:id",protect,upload,updateProduct);  
productRouter.delete("/delete-product/:id",protect,deleteProduct);  

export default productRouter