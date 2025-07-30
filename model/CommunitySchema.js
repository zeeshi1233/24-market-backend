import mongoose from "mongoose";

const CommunitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  userDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String },
  },
  description: { type: String, required: true },
  image: { type: String },
});

const Community = mongoose.model("Community", CommunitySchema);
export { Community };
