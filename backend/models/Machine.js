import mongoose from "mongoose";

const machineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  name: { type: String, required: true },
  
  type: { 
    type: String, 
    required: true // e.g., "Tractor", "Harvester", "Drone"
  },
  
  price: {
    type: Number,
    required: true 
  },
  
  priceUnit: {
    type: String,
    enum: ['hour', 'acre'], 
    default: 'hour',
    required: true
  },

  description: { type: String },
  available: { type: Boolean, default: true },
  image: { type: String, default: "https://cdn-icons-png.flaticon.com/512/2318/2318736.png" }

}, { timestamps: true });

export default mongoose.model("Machine", machineSchema);