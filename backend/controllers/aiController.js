import FormData from "form-data";
import AIChat from "../models/AIChat.js";
import User from "../models/User.js";
import CropCycle from "../models/CropCycle.js";
import { 
    getUserContext, 
    forwardToFastAPI, 
    forwardVoiceToFastAPI, 
    forwardTranscribeToFastAPI, 
    findMessengerConversations, 
    checkAIHealth,
    forwardActionExecuteToFastAPI
} from "../services/aiService.js";
import { getAgriculturalRecommendations } from "../services/recommendationService.js";

// 0. HEALTH CHECK
export const getAIHealthStatus = async (req, res) => {
    try {
        const aiHealth = await checkAIHealth();
        return res.json({
            status: aiHealth.online ? "healthy" : "degraded",
            backend: "connected",
            ai_service: aiHealth
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            backend: "connected",
            error: error.message
        });
    }
};

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
        let pendingAction = null;
        let conversationSummary = "";
        let contextFacts = {};

        if (session_id && session_id !== "no-history") {
            chat = await AIChat.findOne({ _id: session_id, user: req.user.id });
            if (chat) {
                // Token-aware context window: take the most recent 15 messages for active history
                const recentMessages = chat.messages.slice(-15);
                history = recentMessages.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                }));

                pendingAction = chat.pending_action || null;
                conversationSummary = chat.summary || "";
                contextFacts = chat.context_facts || {};

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
            language: language || "en",
            pending_action: pendingAction,
            conversation_summary: conversationSummary,
            context_facts: contextFacts
        };

        const result = await forwardToFastAPI(fastApiPayload, authToken);

        if (!result.success) {
            return res.status(500).json({
                session_id: session_id,
                ...result.data,
                details: result.details
            });
        }

        const responseData = result.data;

        // 4. Append AI response to DB, store action and update pending_action
        if (chat && responseData) {
            chat.messages.push({
                sender: 'ai',
                text: responseData.reply || "No response",
                intent: responseData.intent || "UNKNOWN",
                structured_data: responseData.structured_data,
                action: responseData.action || null
            });

            // Update pending action state
            if (responseData.pending_action !== undefined) {
                chat.pending_action = responseData.pending_action;
            } else if (responseData.action?.type === "CONFIRMATION_REQUIRED") {
                chat.pending_action = responseData.action.pending_action;
            }

            if (responseData.conversation_summary) {
                chat.summary = responseData.conversation_summary;
            }
            if (responseData.context_facts) {
                chat.context_facts = { ...(chat.context_facts || {}), ...responseData.context_facts };
            }

            chat.updatedAt = Date.now();
            await chat.save();
        }

        // 5. Return to frontend
        res.json(responseData);
    } catch (error) {
        console.error("AI Chat Controller Unexpected Error:", error.message);
        res.status(500).json({
            session_id: req.body.session_id,
            reply: "An unexpected error occurred in the proxy.",
            intent: "ERROR",
            success: false,
            details: error.message
        });
    }
};

// 4a. CONFIRM PENDING ACTION
export const confirmAction = async (req, res) => {
    try {
        const { session_id, action_id, overrides, language } = req.body;
        const authToken = req.header("auth-token");
        
        const chat = await AIChat.findOne({ _id: session_id, user: req.user.id });
        if (!chat) return res.status(404).json({ error: "Chat session not found." });
        
        const pending = chat.pending_action;
        if (!pending) {
            return res.status(400).json({ error: "No pending action found to confirm." });
        }
        
        if (action_id && pending.action_id && pending.action_id !== action_id) {
            return res.status(400).json({ error: "Action ID mismatch or action already executed." });
        }
        
        const userContext = await getUserContext(req.user.id);
        const finalParams = {
            ...(pending.extracted_params || {}),
            ...(overrides || {})
        };
        
        // Forward execution to FastAPI
        const execResult = await forwardActionExecuteToFastAPI({
            intent: pending.intent,
            parameters: finalParams,
            auth_token: authToken,
            user_context: userContext,
            language: language || req.body.language || "en"
        }, authToken);
        
        if (!execResult.success) {
            return res.status(500).json({
                success: false,
                reply: execResult.data?.reply || "Execution failed on server.",
                details: execResult.error
            });
        }
        
        const replyText = execResult.data?.reply || "Action confirmed and executed successfully.";
        
        // Append AI message confirming completion
        chat.messages.push({
            sender: "ai",
            text: replyText,
            intent: pending.intent,
            structured_data: execResult.data?.data || {},
            action: execResult.data?.action || null
        });
        
        // Clear pending action
        chat.pending_action = null;
        chat.updatedAt = Date.now();
        await chat.save();
        
        return res.json({
            success: true,
            reply: replyText,
            action: execResult.data?.action,
            pending_action: null
        });
    } catch (error) {
        console.error("Confirm Action Error:", error);
        return res.status(500).json({ error: "Failed to confirm action", details: error.message });
    }
};

// 4b. CANCEL PENDING ACTION
export const cancelAction = async (req, res) => {
    try {
        const { session_id, action_id, language } = req.body;
        const chat = await AIChat.findOne({ _id: session_id, user: req.user.id });
        if (!chat) return res.status(404).json({ error: "Chat session not found." });
        
        chat.pending_action = null;
        
        const cancelMsg = language === 'te' 
            ? "చర్య రద్దు చేయబడింది." 
            : language === 'hi' 
            ? "कार्य रद्द कर दिया गया है।" 
            : "The pending action has been cancelled.";
            
        chat.messages.push({
            sender: "ai",
            text: cancelMsg,
            intent: "CANCEL_ACTION",
            action: null
        });
        chat.updatedAt = Date.now();
        await chat.save();
        
        return res.json({
            success: true,
            reply: cancelMsg,
            pending_action: null
        });
    } catch (error) {
        console.error("Cancel Action Error:", error);
        return res.status(500).json({ error: "Failed to cancel action", details: error.message });
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
        const filename = req.file.originalname || `voice_${Date.now()}.m4a`;
        const contentType = req.file.mimetype || "audio/m4a";

        formData.append("audio", req.file.buffer, { filename, contentType });
        formData.append("audio_file", req.file.buffer, { filename, contentType });
        formData.append("session_id", req.body.session_id || "default_session");
        formData.append("user_context", JSON.stringify(userContext));
        formData.append("current_page_context", req.body.current_page_context || "{}");
        formData.append("auth_token", authToken || "");
        formData.append("language", req.body.language || "en");

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

// 5b. SPEECH-TO-TEXT ONLY PROXY
export const transcribeAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded to backend" });
        }
        
        const authToken = req.header("auth-token");

        const formData = new FormData();
        const filename = req.file.originalname || `voice_${Date.now()}.m4a`;
        const contentType = req.file.mimetype || "audio/m4a";

        formData.append("audio", req.file.buffer, { filename, contentType });
        formData.append("audio_file", req.file.buffer, { filename, contentType });
        formData.append("language", req.body.language || "en");

        const result = await forwardTranscribeToFastAPI(formData, authToken);
        
        if (!result.success) {
            return res.status(500).json({ 
                error: "Failed to transcribe audio via AI service", 
                details: result.error,
                text: ""
            });
        }
        
        res.json(result.data);
    } catch (error) {
        console.error("AI Transcribe Controller Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
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

// 8. INTELLIGENT AGRICULTURAL RECOMMENDATIONS
export const getWeatherRecommendations = async (req, res) => {
    try {
        const { weather, forecast, locationName } = req.body;
        if (!weather) {
            return res.status(400).json({ error: "Weather data is required" });
        }

        let userCrops = [];
        let userProfile = {};

        if (req.user && req.user.id) {
            try {
                const [crops, user] = await Promise.all([
                    CropCycle.find({ user: req.user.id, status: 'active' }).select('cropName area sowingDate status'),
                    User.findById(req.user.id).select('name village district landPlots mainCrops farmingStyle')
                ]);
                userCrops = crops || [];
                userProfile = user || {};
            } catch (err) {
                console.warn("Could not fetch user crop context for recommendations:", err.message);
            }
        }

        const result = await getAgriculturalRecommendations({
            weather,
            forecast,
            userCrops,
            userProfile,
            locationName: locationName || weather?.name || ''
        });

        res.json({
            success: true,
            ...result,
            locationName: locationName || weather?.name || '',
            generatedAt: new Date()
        });
    } catch (error) {
        console.error("Weather recommendations error:", error);
        res.status(500).json({ error: "Failed to generate agricultural recommendations", details: error.message });
    }
};
