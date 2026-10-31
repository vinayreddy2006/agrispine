import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  priceUnit: {
    type: String,
    enum: ['hour', 'acre', 'day'],
    default: 'hour',
    required: true
  },
  description: { type: String, default: "" },
  available: { type: Boolean, default: true }
});

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
    enum: ['hour', 'acre', 'day'], 
    default: 'hour',
    required: true
  },

  description: { type: String },
  available: { type: Boolean, default: true },
  image: { type: String, default: "https://cdn-icons-png.flaticon.com/512/2318/2318736.png" },
  condition: { type: String, default: "Good" },
  modelYear: { type: Number },
  specs: { type: String, default: "" },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },

  // Multiple Agricultural Operations/Tasks offered with this machine
  tasks: [taskSchema]

}, { timestamps: true });

export default mongoose.model("Machine", machineSchema);
