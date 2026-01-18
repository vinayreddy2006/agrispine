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
  profileImage: { type: String, default: "" }

}, { timestamps: true });

export default mongoose.model("User", userSchema);