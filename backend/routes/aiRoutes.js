import express from "express";
import multer from "multer";
import fetchuser from "../middlewares/fetchuser.js";
import {
    getAllChats,
    createChat,
    getChatById,
    renameChat,
    deleteChat,
    processChat,
    processVoice,
    getAllMessengerConversations,
    getMessengerConversationByName
} from "../controllers/aiController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store audio in memory

// AI Chat Operations
router.get("/chats", fetchuser, getAllChats);
router.post("/chats/new", fetchuser, createChat);
router.get("/chats/:id", fetchuser, getChatById);
router.put("/chats/:id", fetchuser, renameChat);
router.delete("/chats/:id", fetchuser, deleteChat);

// Main AI Endpoints
router.post("/chat", fetchuser, processChat);
router.post("/voice", fetchuser, upload.single("audio_file"), processVoice);

// Messenger AI Endpoints
router.get("/messenger/conversations", fetchuser, getAllMessengerConversations);
router.get("/messenger/conversation-by-name", fetchuser, getMessengerConversationByName);

export default router;
