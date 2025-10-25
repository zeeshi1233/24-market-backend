import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema({
  listing_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false, // optional, if chat is about a product
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const MessageSchema = new mongoose.Schema({
  chat_room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true,
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Export models safely (avoid recompilation errors in dev)
export const ChatRoom =
  mongoose.models.ChatRoom || mongoose.model("ChatRoom", ChatRoomSchema);

export const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
