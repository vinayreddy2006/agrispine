import mongoose from "mongoose";

const UserRelationsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  favoriteChats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Conversation" }]
});

export default mongoose.model("UserRelations", UserRelationsSchema);
