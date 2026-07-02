import mongoose from "mongoose";

const AIChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    default: "New Chat"
  },
  messages: [
    {
      sender: { type: String, enum: ['user', 'ai'], required: true },
      text: { type: String, required: true },
      intent: { type: String, default: "" },
      structured_data: { type: mongoose.Schema.Types.Mixed, default: {} },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("AIChat", AIChatSchema);
