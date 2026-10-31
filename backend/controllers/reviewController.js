import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Machine from "../models/Machine.js";

// ADD A VERIFIED REVIEW (Renter Only, on Completed Bookings)
export const addReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ message: "Booking ID and rating (1-5) are required" });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking record not found" });
    }

    // Only renter can submit a review
    if (booking.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the renter who booked this service can submit a review" });
    }

    // Check status is completed
    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Reviews can only be submitted after the rental is marked completed" });
    }

    // Check if already reviewed
    const existing = await Review.findOne({ booking: bookingId });
    if (existing || booking.reviewSubmitted) {
      return res.status(400).json({ message: "A review has already been submitted for this booking" });
    }

    const newReview = new Review({
      booking: bookingId,
      machine: booking.machine,
      provider: booking.provider,
      renter: req.user.id,
      rating: Math.round(numRating),
      comment: (comment || "").trim()
    });

    const savedReview = await newReview.save();

    booking.reviewSubmitted = true;
    await booking.save();

    // Recalculate Machine genuine average rating
    const allReviews = await Review.find({ machine: booking.machine });
    const count = allReviews.length;
    const avg = count > 0 ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / count) : 0;
    const roundedAvg = Math.round(avg * 10) / 10;

    await Machine.findByIdAndUpdate(booking.machine, {
      $set: {
        rating: roundedAvg,
        ratingCount: count
      }
    });

    const populatedReview = await Review.findById(savedReview._id)
      .populate("renter", "name profileImage village district");

    res.status(201).json({
      success: true,
      review: populatedReview,
      newRating: roundedAvg,
      newRatingCount: count
    });

  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET REVIEWS FOR A MACHINE
export const getMachineReviews = async (req, res) => {
  try {
    const { machineId } = req.params;
    const reviews = await Review.find({ machine: machineId })
      .populate("renter", "name profileImage village district")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching machine reviews:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
