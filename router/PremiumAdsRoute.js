import express from "express";
import { protect } from "../Middleware/ProtectedRoutes.js";
import { getUserPremiumAds, requestPremiumAd } from "../controller/premiumAds.js";
import upload from "../Middleware/uploadMiddleware.js";
const premiumAdsRoute = express.Router();
premiumAdsRoute.post("/request",upload, protect, requestPremiumAd);
premiumAdsRoute.get("/my-ads", protect, getUserPremiumAds);
export default premiumAdsRoute;
