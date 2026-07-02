import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";
import { 
    getConversations, 
    createConversation, 
    getConversationMessages, 
    clearChat, 
    starMessage, 
    reactToMessage, 
    removeReaction, 
    deleteMultipleMessages, 
    deleteMessage, 
    deleteForMe, 
    uploadMessageFile,
    pinMessage,
    updateGroupIcon
} from "../controllers/chatController.js";
import fetchUser from "../middlewares/fetchUser.js";

const router = express.Router();

// Conversations
router.get("/conversations", fetchUser, getConversations);
router.post("/conversations", fetchUser, createConversation);
router.put("/conversations/:conversationId/pin", fetchUser, pinMessage);
router.put("/conversations/:id/icon", fetchUser, upload.single("image"), updateGroupIcon);

// Messages
router.get("/messages/:conversationId", fetchUser, getConversationMessages);
router.delete("/clear/:conversationId", fetchUser, clearChat);
router.delete("/delete/:id", fetchUser, deleteMessage);
router.put("/star/:id", fetchUser, starMessage);
router.put("/react/:id", fetchUser, reactToMessage);
router.put("/react/remove/:id", fetchUser, removeReaction);
router.post("/delete-multiple", fetchUser, deleteMultipleMessages);
router.put("/delete-for-me", fetchUser, deleteForMe);

// Uploads
router.post("/upload", fetchUser, upload.single("file"), uploadMessageFile);

// Send message via REST (used by AI)
router.post("/messages", fetchUser, async (req, res) => {
    try {
        const { conversationId, text } = req.body;
        const senderId = req.user.id;
        // In a real scenario we might need senderName/village, but we can fetch it
        const user = await import("../models/User.js").then(m => m.default.findById(senderId));
        
        const Message = (await import("../models/Message.js")).default;
        const Conversation = (await import("../models/Conversation.js")).default;
        
        const newMessage = new Message({
            senderId,
            senderName: user.name,
            village: user.village,
            text,
            conversationId
        });
        await newMessage.save();
        
        await Conversation.findByIdAndUpdate(conversationId, { latestMessage: newMessage._id, updatedAt: Date.now() });
        
        // Emit Socket Event so UI updates instantly
        if (req.io) {
            req.io.to(conversationId).emit("receive_message", newMessage);
        }
        
        res.json({ success: true, message: newMessage });
    } catch (error) {
        console.error("REST Save Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;