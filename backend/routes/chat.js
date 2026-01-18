import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";
import { getVillageMessages, deleteMessage, clearChat, starMessage, reactToMessage, removeReaction, deleteMultipleMessages, deleteForMe, uploadMessageImage  } from "../controllers/chatController.js";
import fetchUser from "../middlewares/fetchUser.js";

const router = express.Router();

router.get("/:village", fetchUser, getVillageMessages);
router.delete("/delete/:id", fetchUser, deleteMessage);       // Delete One
router.delete("/clear/:village", fetchUser, clearChat);       // Clear All
router.put("/star/:id", fetchUser, starMessage);              // Star
router.put("/react/:id", fetchUser, reactToMessage);          // React
router.put("/react/remove/:id", fetchUser, removeReaction); // 👈 Remove Reaction Route
router.post("/delete-multiple", fetchUser, deleteMultipleMessages); // 👈 Bulk Delete Route
router.put("/delete-for-me", fetchUser, deleteForMe);
router.post("/upload", fetchUser, upload.single("image"), uploadMessageImage);

export default router;