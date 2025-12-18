import dotenv from "dotenv";
// 1. Configure dotenv BEFORE importing other things
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// Import Routes
import authRoutes from "./routes/auth.js"; 
import cropRoutes from "./routes/crops.js";
import machineRoutes from "./routes/machines.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
const connectDB = async () => {
  try {
    // 2. Debugging: Check if URI is loaded
    console.log("Attempting to connect to:", process.env.MONGO_URI); 

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1); 
  }
};

// Connect to DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/machines", machineRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});