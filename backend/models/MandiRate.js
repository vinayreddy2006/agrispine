import mongoose from "mongoose";

const MandiRateSchema = new mongoose.Schema({
  market: { type: String, required: true },
  crop: { type: String, required: true },
  type: { type: String, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  modal: { type: Number, required: true },
  trend: { type: String, enum: ["up", "down", "stable"], default: "stable" },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("MandiRate", MandiRateSchema);
