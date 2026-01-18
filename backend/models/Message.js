import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: { type: String, required: true },
  village: { type: String, required: true }, 

  text: { type: String }, 
  image: { type: String },
  audio: { type: String },
  
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

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Message", MessageSchema);