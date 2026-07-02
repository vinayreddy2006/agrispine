import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
  isGroup: { type: Boolean, default: false },
  groupName: { type: String, default: "" },
  groupIcon: { type: String, default: "" },
  village: { type: String, default: "" }, // Keep village for old group compatibility
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  pinnedMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Conversation", ConversationSchema);
