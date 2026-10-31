import express from "express";
import fetchUser, { optionalFetchUser } from "../middlewares/fetchUser.js"; 
import { 
    createBooking, 
    getMyBookings, 
    getRenterBookings,
    getOwnerRequests,
    getMachineBookedDates,
    updateStatus, 
    deleteBooking 
} from "../controllers/bookingController.js";

const router = express.Router();

// 1. Create a Booking (POST /api/bookings/book)
router.post("/book", fetchUser, createBooking);

// 2. Get All User Bookings (GET /api/bookings/fetchall)
router.get("/fetchall", fetchUser, getMyBookings);

// 3. Get Renter Specific Bookings (GET /api/bookings/renter)
router.get("/renter", fetchUser, getRenterBookings);

// 4. Get Owner Specific Requests (GET /api/bookings/requests)
router.get("/requests", fetchUser, getOwnerRequests);

// 5. Get Public Booked Dates for a Machine (GET /api/bookings/machine/:machineId)
router.get("/machine/:machineId", optionalFetchUser, getMachineBookedDates);

// 6. Update Status (PUT /api/bookings/status/:id)
router.put("/status/:id", fetchUser, updateStatus);

// 7. Delete Booking (DELETE /api/bookings/delete/:id)
router.delete("/delete/:id", fetchUser, deleteBooking);

export default router;
