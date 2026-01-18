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
  
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected', 'completed'], 
    default: 'pending' 
  },
  
  notes: { type: String } // e.g., "Need it for 3 hours"

}, { timestamps: true });

export default mongoose.model("Booking", BookingSchema);