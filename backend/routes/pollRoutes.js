import express from "express";
import fetchUser from "../middlewares/fetchUser.js";
import { createPoll, getPollById, votePoll } from "../controllers/pollController.js";

const router = express.Router();

router.post("/create", fetchUser, createPoll);
router.get("/:id", fetchUser, getPollById);
router.put("/vote/:id", fetchUser, votePoll);

export default router;
