import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  title: {
    type: String,
    default: ""
  },

  content: {
    type: String,
    default: ""
  },

  postType: {
    type: String,
    enum: ['general', 'question', 'experience', 'update'],
    default: 'general'
  },

  category: {
    type: String,
    default: 'General Agriculture'
  },

  customCategory: {
    type: String,
    default: ''
  },

  tags: [{ type: String }],

  media: [
    {
      url: { type: String, required: true },
      type: { type: String, enum: ['image', 'video', 'document', 'file'], default: 'image' },
      name: { type: String },
      size: { type: Number }
    }
  ],

  // Likes array of User ObjectIds
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  // Comments with nested replies
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String },
      profileImage: { type: String, default: "" },
      village: { type: String, default: "" },
      district: { type: String, default: "" },
      text: { type: String, required: true },
      likes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
      replies: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          name: { type: String },
          profileImage: { type: String, default: "" },
          village: { type: String, default: "" },
          district: { type: String, default: "" },
          text: { type: String, required: true },
          likes: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          ],
          createdAt: { type: Date, default: Date.now }
        }
      ],
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // Moderation fields
  isReported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },

  // Backward compatibility: legacy replies array
  replies: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]

}, { timestamps: true });

export default mongoose.model("Post", PostSchema);
