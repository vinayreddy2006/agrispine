import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import UserRelations from "../models/UserRelations.js";

/* =========================================
   CONVERSATION CONTROLLERS
========================================= */

// GET all conversations for the current user
export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({ participants: userId })
            .populate("participants", "name profileImage village")
            .populate("latestMessage")
            .sort({ updatedAt: -1 });
        res.json(conversations);
    } catch (error) {
        console.error("Get Conversations Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// CREATE a new conversation (1-on-1 or group)
export const createConversation = async (req, res) => {
    try {
        const { participantIds, isGroup, groupName } = req.body;
        const userId = req.user.id;

        // Ensure current user is in participants
        const participants = [...new Set([...participantIds, userId])];

        // If it's a 1-on-1 chat, check if it already exists
        if (!isGroup && participants.length === 2) {
            const existingConv = await Conversation.findOne({
                isGroup: false,
                participants: { $all: participants, $size: 2 }
            }).populate("participants", "name profileImage village").populate("latestMessage");

            if (existingConv) {
                return res.json(existingConv);
            }
        }
        
        // If it's a "Message Yourself", check if it exists
        if (!isGroup && participants.length === 1) {
             const existingSelfConv = await Conversation.findOne({
                isGroup: false,
                participants: { $all: participants, $size: 1 }
            }).populate("participants", "name profileImage village").populate("latestMessage");

            if (existingSelfConv) {
                return res.json(existingSelfConv);
            }
        }

        const newConv = new Conversation({
            isGroup: isGroup || false,
            groupName: isGroup ? groupName : "",
            participants,
            admins: isGroup ? [userId] : []
        });

        await newConv.save();
        const populatedConv = await Conversation.findById(newConv._id)
            .populate("participants", "name profileImage village");
            
        res.status(201).json(populatedConv);
    } catch (error) {
        console.error("Create Conversation Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

/* =========================================
   MESSAGE CONTROLLERS
========================================= */

// GET messages for a specific conversation
export const getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({
            conversationId,
            deletedBy: { $ne: req.user.id }
        }).populate("poll").sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Get Messages Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// CLEAR CHAT for a specific conversation (removes unstarred for all)
export const clearChat = async (req, res) => {
    try {
        const { conversationId } = req.params;
        await Message.deleteMany({
            conversationId,
            starredBy: { $size: 0 }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

/* TOGGLE STAR MESSAGE */
export const starMessage = async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).send("Not Found");

        const userId = req.user.id;
        if (msg.starredBy.includes(userId)) {
            msg.starredBy = msg.starredBy.filter(id => id.toString() !== userId);
        } else {
            msg.starredBy.push(userId);
        }

        await msg.save();
        res.json(msg);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

/* ADD REACTION */
export const reactToMessage = async (req, res) => {
    try {
        const { emoji } = req.body;
        const msg = await Message.findById(req.params.id);
        msg.reactions = msg.reactions.filter(r => r.user.toString() !== req.user.id);
        msg.reactions.push({ user: req.user.id, emoji });
        await msg.save();
        res.json(msg);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

/* REMOVE REACTION */
export const removeReaction = async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).send("Not Found");
        msg.reactions = msg.reactions.filter(r => r.user.toString() !== req.user.id);
        await msg.save();
        res.json(msg);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

/* DELETE MULTIPLE MESSAGES (For Everyone) */
export const deleteMultipleMessages = async (req, res) => {
    try {
        const { messageIds } = req.body;
        await Message.deleteMany({
            _id: { $in: messageIds },
            senderId: req.user.id
        });
        res.json({ success: true, ids: messageIds });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

/* DELETE MESSAGE FOR EVERYONE (Soft Delete) */
export const deleteMessage = async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).send("Not Found");
        if (msg.senderId.toString() !== req.user.id) return res.status(401).send("Not Authorized");

        msg.isDeleted = true;
        msg.text = "This message was deleted";
        msg.reactions = [];
        msg.replyText = "";
        
        await msg.save();
        res.json({ success: true, message: msg });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

/* DELETE FOR ME (Single or Multiple) */
export const deleteForMe = async (req, res) => {
    try {
        const { messageIds } = req.body;
        await Message.updateMany(
            { _id: { $in: messageIds } },
            { $addToSet: { deletedBy: req.user.id } }
        );
        res.json({ success: true, ids: messageIds, mode: 'me' });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

/* PIN MESSAGE (In Conversation) */
export const pinMessage = async (req, res) => {
    try {
        const { messageId } = req.body;
        const { conversationId } = req.params;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).send("Conversation Not Found");
        
        conversation.pinnedMessage = messageId || null;
        await conversation.save();
        
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

/* UPLOAD FILE CONTROLLER */
export const uploadMessageFile = (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        
        res.json({ 
            fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype
        });
    } catch (error) {
        res.status(500).send("Server Error during upload");
    }
};

/* UPDATE GROUP ICON */
export const updateGroupIcon = async (req, res) => {
    try {
        const { id } = req.params;
        const conversation = await Conversation.findById(id);
        
        if (!conversation) return res.status(404).send("Conversation Not Found");
        if (!conversation.isGroup) return res.status(400).send("Not a group chat");
        
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        
        conversation.groupIcon = imageUrl;
        await conversation.save();
        
        res.json(conversation);
    } catch (error) {
        console.error("Update Group Icon Error:", error);
        res.status(500).send("Server Error during upload");
    }
};
