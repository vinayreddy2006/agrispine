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
    enum: ['farmer', 'provider', 'buyer', 'user'], 
    default: 'user' 
  },
  role: { 
    type: String, 
    default: 'user' 
  },
  village: { type: String, default: "" },
  mandal: { type: String, default: "" },
  district: { type: String, default: "" },
  state: { type: String, default: "" },
  isLocationConfirmed: { type: Boolean, default: false },
  locationCoordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  placeId: { type: String, default: "" },
  formattedAddress: { type: String, default: "" },
  bio: { type: String, default: "" },
  profileImage: { type: String, default: "" },
  
  // Rich Profile Additions
  farmingStartYear: { type: Number },
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
