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
import authRoutes from "./routes/authRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import machineRoutes from "./routes/machineRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import pollRoutes from "./routes/pollRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import Message from "./models/Message.js";

// 👇 DEFINE __dirname MANUALLY (Required for ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- SOCKET.IO SETUP ---
const server = http.createServer(app); // Wrap Express
const io = new Server(server, {
  cors: {
    origin: "*", // Allow frontend to connect
    methods: ["GET", "POST"]
  }
});

// Middleware to expose io to REST routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- SOCKET LOGIC ---
io.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  // 1. Join Conversation Room & MARK AS READ
  socket.on("join_conversation", async ({ conversationId, userId }) => {
    socket.join(conversationId);    
    try {
        await Message.updateMany(
            { conversationId: conversationId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );
        
        // Notify everyone (to update ticks)
        io.to(conversationId).emit("messages_read_update", { userId, conversationId });
    } catch (e) {
        console.error("Error marking read:", e);
    }
  });

  // 2. Handle Sending Message
  socket.on("send_message", async (data) => {
    const { senderId, senderName, conversationId, village, text, image, audio, file, fileName, fileSize, fileType, poll, replyTo, replyText } = data;

    // A. Save to Database (Include image!)
    try {
        const newMessage = new Message({ 
            senderId, 
            senderName, 
            village, 
            text, 
            image, // 👈 Save the image URL
            audio, // 👈 Save the audio URL
            file,
            fileName,
            fileSize,
            fileType,
            poll: typeof poll === 'object' ? poll._id : poll,
            replyTo,
            replyText,
            conversationId
        });
        await newMessage.save();

        // Update latest message in conversation
        await mongoose.model('Conversation').findByIdAndUpdate(conversationId, { latestMessage: newMessage._id, updatedAt: Date.now() });

        // B. Broadcast to everyone
        io.to(conversationId).emit("receive_message", data);
        
    } catch (error) {
        console.error("Socket Save Error:", error.message);
    }
  });

  // 3. Handle Deletion Broadcast
  socket.on("delete_message", (data) => {
    // data = { messageId, conversationId }
    io.to(data.conversationId).emit("message_deleted", data.messageId);
  });

  // 4. Handle Reaction/Star Broadcast
  socket.on("update_message", (data) => {
    // data = { message, conversationId } -> message contains updated reactions/stars
    io.to(data.conversationId).emit("message_updated", data.message);
  });

  // 5. Handle Poll Voting
  socket.on("vote_poll", async (data) => {
    try {
      const { pollId, optionIndex, userId, conversationId } = data;
      const Poll = (await import("./models/Poll.js")).default;
      const poll = await Poll.findById(pollId);
      if (!poll) return;

      if (!poll.multipleChoice) {
          poll.options.forEach(opt => {
              opt.votes = opt.votes.filter(v => v.toString() !== userId);
          });
      }

      const hasVoted = poll.options[optionIndex].votes.includes(userId);
      if (hasVoted) {
          poll.options[optionIndex].votes = poll.options[optionIndex].votes.filter(v => v.toString() !== userId);
      } else {
          poll.options[optionIndex].votes.push(userId);
      }

      await poll.save();
      io.to(conversationId).emit("poll_updated", poll);
    } catch (e) {
      console.error("Poll vote error:", e);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔥: A user disconnected");
  });
});
// -----------------------

// Database Connection
const connectDB = async (retries = 5, delay = 5000) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    if (retries > 0) {
      console.log(`⏳ Retrying MongoDB connection in ${delay / 1000} seconds... (${retries} retries left)`);
      setTimeout(() => connectDB(retries - 1, delay), delay);
    } else {
      console.error("❌ MongoDB Connection Failed after retries. Operating in degraded mode.");
      // DO NOT process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

connectDB();

// Routes
app.use("/auth", authRoutes);
app.use("/crops", cropRoutes);
app.use("/machines", machineRoutes);
app.use("/community", postRoutes);
app.use("/chat", chatRoutes); 
app.use("/poll", pollRoutes);
app.use("/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/bookings", bookingRoutes);

let currentPort = process.env.PORT || 5000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${currentPort} is already in use. Trying port ${Number(currentPort) + 1}...`);
    currentPort = Number(currentPort) + 1;
    startServer();
  } else {
    console.error("Server Error:", err);
  }
});

const startServer = () => {
  // 👇 IMPORTANT: Listen using 'server', not 'app'
  server.listen(currentPort, () => {
    console.log(`🚀 Server running on port ${currentPort}`);
  });
};

startServer();