import FormData from "form-data";
import AIChat from "../models/AIChat.js";
import { getUserContext, forwardToFastAPI, forwardVoiceToFastAPI, findMessengerConversations } from "../services/aiService.js";

// 1. GET ALL CHATS
export const getAllChats = async (req, res) => {
    try {
        const chats = await AIChat.find({ user: req.user.id })
            .select("title createdAt updatedAt")
            .sort({ updatedAt: -1 });
        res.json(chats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 2. CREATE NEW CHAT
export const createChat = async (req, res) => {
    try {
        const chat = new AIChat({
            user: req.user.id,
            title: "New Chat",
            messages: []
        });
        await chat.save();
        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ error: "Failed to create chat" });
    }
};

// 3. GET SINGLE CHAT
export const getChatById = async (req, res) => {
    try {
        const chat = await AIChat.findOne({ _id: req.params.id, user: req.user.id });
        if (!chat) return res.status(404).json({ error: "Chat not found" });
        res.json(chat);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch chat" });
    }
};

// 3a. RENAME CHAT
export const renameChat = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) return res.status(400).json({ error: "Title is required" });
        
        const chat = await AIChat.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { title: title },
            { new: true }
        );
        if (!chat) return res.status(404).json({ error: "Chat not found" });
        res.json(chat);
    } catch (error) {
        res.status(500).json({ error: "Failed to rename chat" });
    }
};

// 3b. DELETE CHAT
export const deleteChat = async (req, res) => {
    try {
        const chat = await AIChat.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!chat) return res.status(404).json({ error: "Chat not found" });
        res.json({ success: true, message: "Chat deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete chat" });
    }
};

// 4. MAIN CHAT ENDPOINT (Proxy to FastAPI)
    export const processChat = async (req, res) => {
        try {
            const { session_id, message, current_page_context, language } = req.body;
            const authToken = req.header("auth-token");
            
            // 1. Get user context
            const userContext = await getUserContext(req.user.id);
            
            // 2. Append user message to DB if it's a saved chat and extract history
            let chat = null;
            let history = [];
            if (session_id && session_id !== "no-history") {
                chat = await AIChat.findOne({ _id: session_id, user: req.user.id });
                if (chat) {
                    // Convert DB messages to ChatMessage schema format
                    history = chat.messages.map(m => ({
                        role: m.sender === 'user' ? 'user' : 'assistant',
                        content: m.text
                    }));
    
                    // If it's the first message, update title
                    if (chat.messages.length === 0) {
                        chat.title = message.substring(0, 30) + "...";
                    }
                    chat.messages.push({ sender: 'user', text: message });
                    await chat.save();
                }
            }
    
            // 3. Forward to FastAPI with retry logic for ECONNRESET / Timeouts
            const fastApiPayload = {
                session_id: session_id,
                message: message,
                history: history,
                user_context: userContext,
                current_page_context: current_page_context,
                auth_token: authToken,
                language: language || "en"
            };

        const result = await forwardToFastAPI(fastApiPayload, authToken);

        if (!result.success) {
            return res.json({
                session_id: session_id,
                ...result.data,
                details: result.details
            });
        }

        const responseData = result.data;

        // 4. Append AI response to DB
        if (chat && responseData) {
            chat.messages.push({
                sender: 'ai',
                text: responseData.reply || "No response",
                intent: responseData.intent || "UNKNOWN",
                structured_data: responseData.structured_data
            });
            chat.updatedAt = Date.now();
            await chat.save();
        }

        // 5. Return to frontend
        res.json(responseData);
    } catch (error) {
        console.error("AI Chat Controller Unexpected Error:", error.message);
        res.json({
            session_id: req.body.session_id,
            reply: "An unexpected error occurred in the proxy.",
            intent: "ERROR",
            success: false,
            details: error.message
        });
    }
};

// 5. VOICE PROXY (MULTIPART)
export const processVoice = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded to backend" });
        }
        
        const userContext = await getUserContext(req.user.id);
        const authToken = req.header("auth-token");

        const formData = new FormData();
        formData.append("audio_file", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });
        formData.append("session_id", req.body.session_id || "default_session");
        formData.append("user_context", JSON.stringify(userContext));
        formData.append("current_page_context", req.body.current_page_context || "{}");
        formData.append("auth_token", authToken);

        const result = await forwardVoiceToFastAPI(formData, authToken);
        
        if (!result.success) {
            return res.status(500).json({ 
                error: "Failed to process voice command via FastAPI", 
                details: result.error 
            });
        }
        
        res.json(result.data);
    } catch (error) {
        console.error("AI Voice Controller Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 6. MESSENGER AI: GET ALL CONVERSATIONS
export const getAllMessengerConversations = async (req, res) => {
    try {
        const matches = await findMessengerConversations(req.user.id);
        res.json(matches);
    } catch (error) {
        console.error("Messenger AI Conversations Error:", error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
};

// 7. MESSENGER AI: GET CONVERSATION BY NAME
export const getMessengerConversationByName = async (req, res) => {
    try {
        const { name, type } = req.query;
        if (!name) return res.status(400).json({ error: "Name is required" });
        
        const matches = await findMessengerConversations(req.user.id, name, type);
        res.json(matches);
    } catch (error) {
        console.error("Messenger AI ConvByName Error:", error);
        res.status(500).json({ error: "Failed to fetch conversation by name" });
    }
};
