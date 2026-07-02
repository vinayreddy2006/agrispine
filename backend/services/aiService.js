import axios from "axios";
import FormData from "form-data";
import User from "../models/User.js";
import CropCycle from "../models/CropCycle.js";
import Machine from "../models/Machine.js";
import Conversation from "../models/Conversation.js";
import AIChat from "../models/AIChat.js";

const FASTAPI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000/api/ai";

// Fetch user context for LLM
export const getUserContext = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return {};
        
        const cropCount = await CropCycle.countDocuments({ user: userId });
        const machineCount = await Machine.countDocuments({ owner: userId });

        return {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            userType: user.userType,
            village: user.village,
            district: user.district,
            bio: user.bio,
            farmingStartYear: user.farmingStartYear,
            mainCrops: user.mainCrops,
            farmingStyle: user.farmingStyle,
            preferredLanguage: user.preferredLanguage,
            stats: {
                totalCrops: cropCount,
                totalMachines: machineCount
            }
        };
    } catch (e) {
        console.error("Context fetch error:", e);
        return {};
    }
};

// Forward chat to FastAPI with retry logic
export const forwardToFastAPI = async (fastApiPayload, authToken) => {
    let response = null;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
        try {
            response = await axios.post(`${FASTAPI_URL}/chat`, fastApiPayload, {
                headers: { "auth-token": authToken },
                timeout: 20000 // 20 second timeout
            });
            break; 
        } catch (err) {
            lastError = err;
            if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || !err.response) {
                retries--;
                if (retries > 0) await new Promise(res => setTimeout(res, 1500)); 
            } else {
                break; 
            }
        }
    }

    if (!response) {
        console.error("AI Chat Proxy Error after retries:", lastError?.message);
        return {
            success: false,
            error: lastError?.code || "ProxyError",
            details: lastError?.message,
            data: {
                reply: "The AI service is temporarily unavailable or restarting. Please try again in a few moments.",
                intent: "ERROR",
                action: null
            }
        };
    }

    return { success: true, data: response.data };
};

// Forward Voice to FastAPI
export const forwardVoiceToFastAPI = async (formData, authToken) => {
    try {
        const response = await axios.post(`${FASTAPI_URL}/voice`, formData, {
            headers: {
                ...formData.getHeaders(),
                "auth-token": authToken
            },
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error("AI Voice Proxy Error:", error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

// Messenger AI Matching
export const findMessengerConversations = async (userId, name, type) => {
    const conversations = await Conversation.find({ participants: userId })
        .populate("participants", "name");
        
    const matches = [];
    
    for (const conv of conversations) {
        let convName = "";
        let convType = conv.isGroup ? "group" : "individual";
        
        if (conv.isGroup) {
            convName = conv.groupName;
        } else {
            const other = conv.participants.find(p => p._id.toString() !== userId);
            convName = other ? other.name : "Unknown";
        }
        
        if (name && convName.toLowerCase() === name.toLowerCase()) {
            if (!type || type === "auto" || type.toLowerCase() === convType) {
                matches.push({ id: conv._id.toString(), type: convType, name: convName });
            }
        } else if (!name) {
            matches.push({ id: conv._id.toString(), type: convType, name: convName });
        }
    }
    return matches;
};
