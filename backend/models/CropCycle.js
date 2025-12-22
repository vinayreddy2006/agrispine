import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
  // Link this crop to a specific Farmer
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  cropName: {
    type: String,
    required: true
  },
  
  area: {
    type: Number, // e.g., 2.5 acres
    required: true
  },
  
  sowingDate: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ['active', 'harvested', 'sold'],
    default: 'active'
  },

  // Track expenses for this specific crop
  expenses: [
    {
      type: { type: String }, 
      amount: { type: Number },
      date: { type: Date, default: Date.now }
    }
  ]

}, { timestamps: true });

export default mongoose.model("CropCycle", cropSchema);