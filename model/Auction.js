import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
    },
    refunded: {
      type: Boolean,
      default: false,
    },

    // ✅ Contact Info
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: "US" },
    },
  },
  { timestamps: true }
);

const auctionSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true }, // Auction product details
    description: { type: String },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    startingPrice: { type: Number, required: true },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    currentBid: { type: Number, default: 0 },
    currentBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    bids: [bidSchema], // All user bids inside same model

    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["ongoing", "ended"],
      default: "ongoing",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Auction", auctionSchema);
