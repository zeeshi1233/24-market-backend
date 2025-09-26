import express from "express";
import { protect } from "../Middleware/ProtectedRoutes.js";
import {
  createAuction,
  finalizeAuction,
  getAllAuctions,
  getAuctionById,
  getAuctionWinner,
  getBidById,
  getBidsByAuctionId,
  placeBid,
} from "../controller/Auction.js";
import upload from "../Middleware/uploadMiddleware.js";

const auctionRouter = express.Router();

auctionRouter.post("/create", protect, upload, createAuction);
auctionRouter.post("/bid", protect, placeBid);
auctionRouter.post("/finalize/:id", protect, finalizeAuction);
// Auctions
auctionRouter.get("/", getAllAuctions);
auctionRouter.get("/:id", getAuctionById);

// Bids
auctionRouter.get("/:id/bids", getBidsByAuctionId);
auctionRouter.get("/bids/:id", getBidById);

// Winner
auctionRouter.get("/:id/winner", getAuctionWinner);
export default auctionRouter;
