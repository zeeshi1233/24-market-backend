import asyncHandler from "../Middleware/AsyncHandlers.js";
import Auction from "../model/Auction.js";
import User from "../model/UserSchema.js";
import { ApiError, ApiSuccess } from "../utils/ApiResponse.js";
import { stripe } from "../stripe/Stripe.js";
import cloudinary from "../cloudinaryConfig.js";

// CREATE AUCTION WITH IMAGES
export const createAuction = asyncHandler(async (req, res) => {
  try {
    // STEP 1: Upload multiple images to Cloudinary
    const images = req.files;

    if (!images || images.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No image file uploaded." });
    }

    const uploadPromises = images.map((image) => {
      return new Promise((resolve, reject) => {
        if (!image.buffer || image.buffer.length === 0) {
          return reject(new Error("Invalid image buffer."));
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (image.size > MAX_FILE_SIZE) {
          return reject(new Error("File size exceeds 10MB limit."));
        }

        cloudinary.uploader
          .upload_stream({ folder: "24-market-auctions" }, (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return reject(new Error("Error uploading to Cloudinary."));
            }
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          })
          .end(image.buffer);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // STEP 2: Save Auction with product details
    const { productName, description, startingPrice, endTime } = req.body;

    const newAuction = new Auction({
      productName,
      description,
      images: uploadedImages,
      startingPrice,
      currentBid: startingPrice,
      seller: req.user.id,
      endTime,
    });

    await newAuction.save();

    // STEP 3: Save auction reference in seller’s profile
    await User.findByIdAndUpdate(req.user.id, {
      $push: { postedAuctions: newAuction._id },
    });

    res.status(200).json({
      message: "Auction created successfully",
      data: newAuction,
    });
  } catch (err) {
    console.error("Create Auction Error:", err.message);
    res.status(500).json({ error: "Failed to create auction." });
  }
});

// PLACE BID
export const placeBid = asyncHandler(async (req, res) => {
  const {
    auctionId,
    bidAmount,
    paymentData: { saveCard, paymentMethodId, savedPaymentMethodId } = {},
    contactInfo: {
      fullName,
      email,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
    } = {},
  } = req.body;

  const userId = req.user.id;

  // 1) Auction check
  const auction = await Auction.findById(auctionId);
  if (!auction) return ApiError(res, "Auction not found", 404);

  if (auction.status === "ended" || new Date() > auction.endTime) {
    return ApiError(res, "Auction already ended", 400);
  }

  if (bidAmount <= auction.currentBid) {
    return ApiError(res, "Bid must be higher than current bid", 400);
  }

  // 2) User check
  const user = await User.findById(userId);
  if (!user) return ApiError(res, "User not found", 404);

  // 3) Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId: userId.toString() },
    });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  }

  // 4) Payment method
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  let finalPaymentMethodId;
  if (savedPaymentMethodId) {
    const pm = await stripe.paymentMethods.retrieve(savedPaymentMethodId);
    if (pm.customer !== customerId) {
      return ApiError(res, "Invalid saved card selected", 400);
    }
    finalPaymentMethodId = savedPaymentMethodId;
  } else {
    finalPaymentMethodId = paymentMethodId;

    if (saveCard) {
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
      user.stripePaymentMethodId = paymentMethodId;
      await user.save();
    }
  }

  // 5) Create PaymentIntent with contact info
  const paymentIntent = await stripe.paymentIntents.create({
    amount: bidAmount * 100,
    currency: "eur",
    customer: customerId,
    payment_method: finalPaymentMethodId,
    confirm: true,
    capture_method: "manual",
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    description: `Bid of €${bidAmount} on auction ${auctionId}`,
    metadata: {
      userId: userId.toString(),
      auctionId: auctionId.toString(),
    },
    shipping: {
      name: fullName,
      phone,
      address: {
        line1: street,
        city,
        state,
        postal_code: postalCode,
        country: country || "US",
      },
    },
    receipt_email: email,
  });

  // 6) Refund previous highest bidder
  if (auction.currentBidder) {
    const lastBid = auction.bids.find(
      (b) => b.bidder.toString() === auction.currentBidder.toString()
    );
    if (lastBid && !lastBid.refunded) {
      try {
        await stripe.paymentIntents.cancel(lastBid.paymentIntentId);
        lastBid.refunded = true;
      } catch (err) {
        console.error(
          "Failed to cancel last bidder's PaymentIntent:",
          err.message
        );
      }
    }
  }

  // 7) Save new bid with contact info
  auction.currentBid = bidAmount;
  auction.currentBidder = userId;
  auction.bids.push({
    bidder: userId,
    amount: bidAmount,
    paymentIntentId: paymentIntent.id,
    fullName,
    email,
    phone,
    address: { street, city, state, postalCode, country },
  });

  await auction.save();

  return ApiSuccess(res, "Bid placed successfully", {
    auction,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  });
});

export const finalizeAuction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const auction = await Auction.findById(id).populate("bids.bidder");
  if (!auction) return ApiError(res, "Auction not found", 404);

  if (auction.status === "ended") {
    return ApiError(res, "Auction already finalized", 400);
  }

  if (new Date() < auction.endTime) {
    return ApiError(res, "Auction has not ended yet", 400);
  }

  const highestBid = auction.bids.reduce(
    (max, b) => (b.amount > (max?.amount || 0) ? b : max),
    null
  );

  if (!highestBid) {
    auction.status = "ended";
    await auction.save();
    return ApiSuccess(res, "Auction ended with no bids", auction);
  }

  // ✅ 1. Winner → Capture hold
  try {
    await stripe.paymentIntents.capture(highestBid.paymentIntentId);
    auction.winner = highestBid.bidder._id; // save winner
  } catch (err) {
    console.error("Winner capture failed:", err.message);
    return ApiError(res, "Payment capture failed", 500);
  }

  // ✅ 2. Losers → Refund / Cancel hold
  for (const bid of auction.bids) {
    if (
      bid.bidder._id.toString() !== highestBid.bidder._id.toString() &&
      !bid.refunded
    ) {
      try {
        const intent = await stripe.paymentIntents.retrieve(
          bid.paymentIntentId
        );

        if (intent.status === "requires_capture") {
          // still on hold → just cancel
          await stripe.paymentIntents.cancel(bid.paymentIntentId);
        } else if (intent.status === "succeeded") {
          // already captured mistakenly → refund it
          await stripe.refunds.create({ payment_intent: bid.paymentIntentId });
        }

        bid.refunded = true;
      } catch (err) {
        console.error(`Refund failed for ${bid._id}:`, err.message);
      }
    }
  }

  auction.status = "ended";
  await auction.save();

  return ApiSuccess(res, "Auction finalized successfully", auction);
});

// GET ALL AUCTIONS
export const getAllAuctions = asyncHandler(async (req, res) => {
  const auctions = await Auction.find().populate(
    "seller",
    "firstName lastName email"
  );
  return ApiSuccess(res, "All auctions fetched", auctions);
});

// GET SINGLE AUCTION BY ID
export const getAuctionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const auction = await Auction.findById(id)
    .populate("seller", "firstName lastName email")
    .populate("bids.bidder", "firstName lastName email");

  if (!auction) return ApiError(res, "Auction not found", 404);

  return ApiSuccess(res, "Auction fetched successfully", auction);
});

// GET ALL BIDS FOR AN AUCTION
export const getBidsByAuctionId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const auction = await Auction.findById(id).populate(
    "bids.bidder",
    "firstName lastName email"
  );

  if (!auction) return ApiError(res, "Auction not found", 404);

  return ApiSuccess(res, "Bids fetched successfully", auction.bids);
});

// GET SINGLE BID BY BID ID
export const getBidById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const auction = await Auction.findOne({ "bids._id": id }).populate(
    "bids.bidder",
    "firstName lastName email"
  );
  if (!auction) return ApiError(res, "Bid not found", 404);

  const bid = auction.bids.id(id);
  return ApiSuccess(res, "Bid fetched successfully", bid);
});


// GET WINNER OF AN AUCTION
export const getAuctionWinner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const auction = await Auction.findById(id)
    .populate("winner", "firstName lastName email")
    .populate("bids.bidder", "firstName lastName email");

  if (!auction) return ApiError(res, "Auction not found", 404);

  if (!auction.winner) return ApiError(res, "No winner for this auction", 404);

  return ApiSuccess(res, "Winner fetched successfully", auction.winner);
});
