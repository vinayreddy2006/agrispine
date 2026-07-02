import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: { type: String, required: true },
  village: { type: String }, // Now optional (kept for backward compatibility or migration)
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" }, // New required field for chats

  text: { type: String }, 
  image: { type: String },
  audio: { type: String },
  file: { type: String },
  fileName: { type: String },
  fileSize: { type: String },
  fileType: { type: String },
  poll: { type: mongoose.Schema.Types.ObjectId, ref: "Poll" },
  
  // 👇 NEW FIELDS
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null }, // ID of message being replied to
  replyText: { type: String, default: "" }, // Context text of the original message
  
  starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who starred this
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    emoji: String
  }],
  
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isDeleted: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false }, // NEW FIELD

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Message", MessageSchema);