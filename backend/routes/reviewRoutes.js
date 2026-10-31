import express from "express";
import fetchUser, { optionalFetchUser } from "../middlewares/fetchUser.js";
import { addReview, getMachineReviews } from "../controllers/reviewController.js";

const router = express.Router();

// Submit a review (POST /api/reviews/add)
router.post("/add", fetchUser, addReview);

// Get reviews for a machine (GET /api/reviews/machine/:machineId)
router.get("/machine/:machineId", optionalFetchUser, getMachineReviews);

export default router;
