import Auction from "../model/Auction.js";
import { finalizeAuction } from "../controller/Auction.js";

setInterval(async () => {
    
  try {
    const now = new Date();

    const nearEndingAuctions = await Auction.find({
      endTime: { $lte: new Date(now.getTime() + 60 * 1000) },
      status: "ongoing",
    });

    for (const auction of nearEndingAuctions) {
      if (auction.endTime <= now) {
        try {
          await finalizeAuction(
            { params: { id: auction._id } },
            {
              status: (code) => ({
                json: (data) =>
                  console.log(`Auction ${auction._id} finalized:`, data),
              }),
            }
          );
        } catch (err) {
          console.error(
            `Error finalizing auction ${auction._id}:`,
            err.message
          );
        }
      }
    }
  } catch (err) {
    console.error("Auction interval error:", err.message);
  }
}, 30 * 1000);

console.log("✅ Auction scheduler started");
