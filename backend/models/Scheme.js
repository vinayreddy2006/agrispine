import mongoose from "mongoose";

const SchemeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  provider: { type: String, required: true },
  providerColor: { type: String, default: "bg-blue-100 text-blue-700" },
  amount: { type: String, required: true },
  description: { type: String, required: true },
  eligibility: { type: String, required: true },
  applyDate: { type: String, required: true },
  paymentDate: { type: String, required: true },
  link: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Scheme", SchemeSchema);
