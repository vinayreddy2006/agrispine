import express from "express";
import fetchUser, { optionalFetchUser } from "../middlewares/fetchUser.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import {
  createPost,
  getAllPosts,
  getSinglePost,
  updatePost,
  deletePost,
  toggleLikePost,
  addComment,
  deleteComment,
  addReplyToComment,
  deleteReplyFromComment,
  toggleLikeComment,
  toggleLikeReply,
  uploadMedia,
  addReply,
  reportPost
} from "../controllers/postController.js";

const router = express.Router();

// ROUTE 1: Get All Posts (GET /community/fetchall)
router.get("/fetchall", optionalFetchUser, getAllPosts);

// ROUTE 2: Get Single Post (GET /community/post/:id)
router.get("/post/:id", optionalFetchUser, getSinglePost);

// ROUTE 3: Create a Post (POST /community/add)
router.post("/add", fetchUser, createPost);

// ROUTE 4: Update a Post (PUT /community/post/:id)
router.put("/post/:id", fetchUser, updatePost);

// ROUTE 5: Delete a Post (DELETE /community/post/:id)
router.delete("/post/:id", fetchUser, deletePost);

// ROUTE 6: Like/Unlike a Post (PUT /community/like/:id)
router.put("/like/:id", fetchUser, toggleLikePost);

// ROUTE 7: Add a Comment (POST /community/comment/:id)
router.post("/comment/:id", fetchUser, addComment);

// ROUTE 8: Delete a Comment (DELETE /community/comment/:id/:commentId)
router.delete("/comment/:id/:commentId", fetchUser, deleteComment);

// ROUTE 9: Reply to a Comment (POST /community/reply/:id/:commentId)
router.post("/reply/:id/:commentId", fetchUser, addReplyToComment);

// ROUTE 10: Delete a Reply (DELETE /community/reply/:id/:commentId/:replyId)
router.delete("/reply/:id/:commentId/:replyId", fetchUser, deleteReplyFromComment);

// ROUTE 11: Like/Unlike a Comment (PUT /community/like-comment/:id/:commentId)
router.put("/like-comment/:id/:commentId", fetchUser, toggleLikeComment);

// ROUTE 12: Like/Unlike a Reply (PUT /community/like-reply/:id/:commentId/:replyId)
router.put("/like-reply/:id/:commentId/:replyId", fetchUser, toggleLikeReply);

// ROUTE 13: Upload Post Media (POST /community/upload)
router.post("/upload", fetchUser, upload.array("files", 10), uploadMedia);

// ROUTE 14: Legacy Reply to a Post (POST /community/reply/:id)
router.post("/reply/:id", fetchUser, addReply);

// ROUTE 15: Report a Post (POST /community/report/:id)
router.post("/report/:id", fetchUser, reportPost);

export default router;
