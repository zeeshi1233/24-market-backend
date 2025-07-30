import express from "express";
import upload from "../Middleware/uploadMiddleware.js";
import { protect } from "../Middleware/ProtectedRoutes.js";
import { CreateCommunity,DeleteCommunity,GetCommunity, UpdateCommunity } from "../controller/Community.js";

const CommunityRouter = express.Router();
CommunityRouter.post("/create", protect, upload, CreateCommunity);
CommunityRouter.get("/get", protect, upload, GetCommunity);
CommunityRouter.get("/get/:id", protect, upload, GetCommunity);
CommunityRouter.put("/update/:id", UpdateCommunity);
CommunityRouter.delete("/delete/:id", DeleteCommunity);


export default CommunityRouter;
