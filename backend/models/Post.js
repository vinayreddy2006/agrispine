import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  title: {
    type: String,
    required: true
  },

  content: {
    type: String,
    required: true
  },

  // We will store replies directly inside the post for simplicity
  replies: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String, // Store name directly to save a lookup later
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],

  likes: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

export default mongoose.model("Post", PostSchema);