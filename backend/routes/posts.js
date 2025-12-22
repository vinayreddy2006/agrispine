import express from "express";
import fetchUser from "../middlewares/fetchUser.js";
import { createPost, getAllPosts, addReply } from "../controllers/postController.js";

const router = express.Router();

// ROUTE 1: Get All Posts (GET /api/community/fetchall)
router.get("/fetchall", fetchUser, getAllPosts);

// ROUTE 2: Create a Post (POST /api/community/add)
router.post("/add", fetchUser, createPost);

// ROUTE 3: Reply to a Post (POST /api/community/reply/:id)
router.post("/reply/:id", fetchUser, addReply);

export default router;