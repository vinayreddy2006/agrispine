import mongoose from "mongoose";

const AdminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: "superadmin" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("AdminUser", AdminUserSchema);
