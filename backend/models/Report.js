import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  },
  postAuthor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: [
      "Spam",
      "Inappropriate Content",
      "Misleading Agricultural Information",
      "Harassment or Abuse",
      "Fake or Suspicious Information",
      "Other"
    ]
  },
  description: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["pending", "under_review", "dismissed", "resolved"],
    default: "pending"
  },
  adminAction: {
    action: { type: String }, // 'dismissed' | 'post_removed' | 'warned'
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    adminName: { type: String },
    reason: { type: String },
    actionDate: { type: Date }
  }
}, { timestamps: true });

export default mongoose.model("Report", ReportSchema);

