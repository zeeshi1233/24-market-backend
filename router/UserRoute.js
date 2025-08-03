import express from "express";
import {  facebookLogin, forgotPassword, getProfile, googleLogin, Login, Register, resetPassword, SendOtp, ValidateOtp, verifyOtp } from "../controller/User.js";  // Import the controller

import { protect } from "../Middleware/ProtectedRoutes.js";
import upload from "../Middleware/uploadMiddleware.js";

const UserRouter = express.Router();

UserRouter.post("/register",upload, Register);  
// UserRouter.post("/send-otp",SendOtp);  
UserRouter.post("/verify-otp",ValidateOtp);  
UserRouter.post("/login", Login);
UserRouter.post("/forgot-password", forgotPassword);
UserRouter.post("/verify-reset-otp", verifyOtp);
UserRouter.post("/resend-otp", SendOtp);
UserRouter.post("/facebook-login", facebookLogin);
UserRouter.post("/google-login",googleLogin);
UserRouter.post("/reset-password", resetPassword);
UserRouter.get("/get-profile/:id", protect,getProfile);




export default UserRouter;
