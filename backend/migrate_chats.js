import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";
import User from "./models/User.js";

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // 1. Find all distinct villages that have messages
        const villages = await Message.distinct("village");
        console.log(`Found ${villages.length} villages with messages.`);

        for (const village of villages) {
            if (!village) continue;

            // Find all users who belong to this village to add them as participants
            const usersInVillage = await User.find({ village });
            const participantIds = usersInVillage.map(u => u._id);

            // Create or find a Conversation for this village
            let conversation = await Conversation.findOne({ village, isGroup: true });
            
            if (!conversation) {
                console.log(`Creating Conversation for village: ${village}`);
                conversation = new Conversation({
                    isGroup: true,
                    groupName: `${village} Village`,
                    village: village,
                    participants: participantIds,
                    admins: [], // Old village chats don't have explicit admins yet
                });
                await conversation.save();
            }

            // Update all messages in this village to point to the new conversation
            const result = await Message.updateMany(
                { village: village, conversationId: { $exists: false } },
                { $set: { conversationId: conversation._id } }
            );
            console.log(`Updated ${result.modifiedCount} messages for village ${village}.`);

            // Update latestMessage for conversation
            const latestMsg = await Message.findOne({ conversationId: conversation._id }).sort({ createdAt: -1 });
            if (latestMsg) {
                conversation.latestMessage = latestMsg._id;
                await conversation.save();
            }
        }

        console.log("Migration complete!");
        process.exit(0);

    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
