import mongoose from "mongoose";

const PollSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  question: { type: String, required: true },
  options: [{
    text: { type: String, required: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  }],
  multipleChoice: { type: Boolean, default: false },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

export default mongoose.model("Poll", PollSchema);
