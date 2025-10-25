import { ChatRoom, Message } from "../model/Chat";

// ✅ 1. Create or get existing chat room between two users
export const CreateRoom = async (req, res) => {
  try {
    const { user1, user2, listing_id } = req.body;

    // check if room already exists for these users (and listing if applicable)
    const existingRoom = await ChatRoom.findOne({
      participants: { $all: [user1, user2] },
      listing_id: listing_id || null,
    });

    if (existingRoom) {
      return res.json(existingRoom);
    }

    // create new room
    const room = await ChatRoom.create({
      participants: [user1, user2],
      listing_id: listing_id || null,
    });

    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ 2. Send a message (store from Firebase)
export const SendMessage=async (req, res) => {
  try {
    const { chat_room_id, sender_id, message } = req.body;

    const msg = await Message.create({
      chat_room_id,
      sender_id,
      message,
    });

    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ 3. Get all messages of a room
export const GetRoomMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat_room_id: req.params.roomId })
      .populate("sender_id")
      .sort({ created_at: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ 4. Get all chat rooms of a user
export const GetAllChatRoom = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ participants: req.params.userId })
      .populate("participants listing_id")
      .sort({ created_at: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ 5. Delete chat room and all its messages
// router.delete("/room/:roomId", async (req, res) => {
//   try {
//     await Message.deleteMany({ chat_room_id: req.params.roomId });
//     await ChatRoom.findByIdAndDelete(req.params.roomId);
//     res.json({ message: "Chat deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

export default router;
