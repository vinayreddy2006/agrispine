import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  machine: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Machine', 
    required: true 
  },
  
  farmer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  provider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  date: { 
    type: Date, 
    required: true 
  },

  // Selected task / operation
  task: {
    name: { type: String, default: "General Work" },
    price: { type: Number },
    priceUnit: { type: String, default: "hour" }
  },

  duration: {
    type: Number,
    default: 1
  },

  totalAmount: {
    type: Number
  },
  
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'accepted', 'rejected', 'cancelled', 'completed'], 
    default: 'pending' 
  },
  
  notes: { type: String }, // e.g., "Need it for 3 hours, start at 7 AM"

  reviewSubmitted: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("Booking", BookingSchema);
