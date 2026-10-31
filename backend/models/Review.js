import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
    unique: true
  },
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Machine",
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  renter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    default: ""
  }
}, { timestamps: true });

export default mongoose.model("Review", ReviewSchema);
