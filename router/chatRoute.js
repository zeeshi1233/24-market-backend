import express from "express";
import {
  CreateRoom,
  SendMessage,
  GetRoomMessages,
  GetAllChatRoom,
} from "../controller/Chat.js";
import { protect } from "../Middleware/ProtectedRoutes.js";

const chatRoutes = express.Router();

// ✅ 1. Create or get chat room between two users
// POST /api/chat/room
chatRoutes.post("/room",protect, CreateRoom);

// ✅ 2. Send message (store message in MongoDB)
// POST /api/chat/message
chatRoutes.post("/message",protect, SendMessage);

// ✅ 3. Get all messages of a specific chat room
// GET /api/chat/messages/:roomId
chatRoutes.get("/messages/:roomId",protect, GetRoomMessages);

// ✅ 4. Get all chat rooms of a specific user
// GET /api/chat/rooms/:userId
chatRoutes.get("/rooms/:userId",protect, GetAllChatRoom);

export default chatRoutes;
