import express from "express";
import fetchUser from "../middlewares/fetchUser.js";
import { createBooking, getMyBookings, updateStatus } from "../controllers/bookingController.js";

const router = express.Router();

// POST /api/bookings/book -> Create Request
router.post("/book", fetchUser, createBooking);

// GET /api/bookings/fetchall -> See my history
router.get("/fetchall", fetchUser, getMyBookings);

// PUT /api/bookings/status/:id -> Accept/Reject (Owner only)
router.put("/status/:id", fetchUser, updateStatus);

export default router;