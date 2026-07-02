import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  userType: { 
    type: String, 
    enum: ['farmer', 'provider', 'buyer'], 
    default: 'farmer' 
  },
  village: { type: String },
  district: { type: String },
  bio: { type: String, default: "" },
  profileImage: { type: String, default: "" },
  
  // Rich Profile Additions
  farmingStartYear: { type: Number }, // Replaces farmingExperience
  landPlots: [
    {
      name: { type: String, default: 'Main Plot' },
      size: { type: Number }, // In acres
      soilType: { type: String },
      irrigationMethod: { type: String },
    }
  ],
  mainCrops: [{ type: String }],
  farmingStyle: { 
    type: String, 
    enum: ['organic', 'conventional', 'mixed', ''], 
    default: '' 
  },
  preferredLanguage: { type: String, default: 'en' },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

}, { timestamps: true });

export default mongoose.model("User", userSchema);