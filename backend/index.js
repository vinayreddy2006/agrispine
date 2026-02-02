import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";               // 👈 Import HTTP
import { Server } from "socket.io";    // 👈 Import Socket.io
import path from "path";
import { fileURLToPath } from "url";

// Import Routes
import authRoutes from "./routes/auth.js";
import cropRoutes from "./routes/crops.js";
import machineRoutes from "./routes/machines.js";
import postRoutes from "./routes/posts.js";
import chatRoutes from "./routes/chat.js"; // 👈 Import Chat Routes
import bookingRoutes from "./routes/bookings.js";
import Message from "./models/Message.js"; // 👈 Import Model for Socket saving

// 👇 DEFINE __dirname MANUALLY (Required for ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// --- SOCKET.IO SETUP ---
const server = http.createServer(app); // Wrap Express
const io = new Server(server, {
  cors: {
    origin: "*", // Allow frontend to connect
    methods: ["GET", "POST"]
  }
});

// --- SOCKET LOGIC ---
io.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  // 1. Join Village Room & MARK AS READ
  socket.on("join_village", async ({ village, userId }) => {
    socket.join(village);    
    try {
        await Message.updateMany(
            { village: village, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );
        
        // Notify everyone (to update ticks)
        io.to(village).emit("messages_read_update", { userId, village });
    } catch (e) {
        console.error("Error marking read:", e);
    }
  });

  // 2. Handle Sending Message
  // 2. Handle Sending Message
  socket.on("send_message", async (data) => {
    // 👇 ADD 'image' to destructuring
    const { senderId, senderName, village, text, image, audio } = data;

    // A. Save to Database (Include image!)
    try {
        const newMessage = new Message({ 
            senderId, 
            senderName, 
            village, 
            text, 
            image, // 👈 Save the image URL
            audio // 👈 Save the audio URL
        });
        await newMessage.save();

        // B. Broadcast to everyone
        io.to(village).emit("receive_message", data);
        
    } catch (error) {
        console.error("Socket Save Error:", error.message);
    }
  });

  // 3. Handle Deletion Broadcast
  socket.on("delete_message", (data) => {
    // data = { messageId, village }
    io.to(data.village).emit("message_deleted", data.messageId);
  });

  // 4. Handle Reaction/Star Broadcast
  socket.on("update_message", (data) => {
    // data = { message, village } -> message contains updated reactions/stars
    io.to(data.village).emit("message_updated", data.message);
  });

  socket.on("disconnect", () => {
    console.log("🔥: A user disconnected");
  });
});
// -----------------------

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/community", postRoutes);
app.use("/api/chat", chatRoutes); // 👈 Mount Chat Route
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/bookings",bookingRoutes);

const PORT = process.env.PORT || 5000;

// 👇 IMPORTANT: Listen using 'server', not 'app'
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});