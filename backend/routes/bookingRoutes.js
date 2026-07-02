import express from "express";
import fetchUser from "../middlewares/fetchUser.js"; 
import { 
    createBooking, 
    getMyBookings, 
    updateStatus, 
    deleteBooking 
} from "../controllers/bookingController.js";

const router = express.Router();

// 1. Create a Booking (POST /api/bookings/book)
router.post("/book", fetchUser, createBooking);

// 2. Get My Bookings (GET /api/bookings/fetchall)
router.get("/fetchall", fetchUser, getMyBookings);

// 3. Update Status (Accept/Reject) (PUT /api/bookings/status/:id)
router.put("/status/:id", fetchUser, updateStatus);

// 4. Delete Booking (DELETE /api/bookings/delete/:id)
router.delete("/delete/:id", fetchUser, deleteBooking);

export default router;