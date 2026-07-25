import axios from "axios";
import FormData from "form-data";
import User from "../models/User.js";
import CropCycle from "../models/CropCycle.js";
import Machine from "../models/Machine.js";
import Conversation from "../models/Conversation.js";
import AIChat from "../models/AIChat.js";

const rawAiUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
const cleanAiUrl = rawAiUrl.replace(/\/api\/ai\/?$/, '').replace(/\/$/, '');
const FASTAPI_URL = `${cleanAiUrl}/api/ai`;

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

export const forwardToFastAPI = async (fastApiPayload, authToken) => {
    let response = null;
    let retries = 15; // Increased to 15 (75 seconds) because Render free tier cold starts can take > 50s
    let lastError = null;
    
    while (retries > 0) {
        try {
            response = await axios.post(`${FASTAPI_URL}/chat`, fastApiPayload, {
                headers: { "auth-token": authToken },
                timeout: 30000 // 30 second timeout per request
            });
            break; 
        } catch (err) {
            lastError = err;
            const isTimeout = err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || !err.response;
            const isGatewayError = err.response && (err.response.status === 502 || err.response.status === 503 || err.response.status === 504);
            
            if (isTimeout || isGatewayError) {
                retries--;
                if (retries > 0) {
                    console.log(`AI Service unavailable (Cold Start). Retrying... (${retries} attempts left)`);
                    await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds between retries
                }
            } else {
                break; 
            }
        }
    }

    if (!response) {
        console.error("AI Chat Proxy Error after retries:", lastError?.message || lastError);
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
    let response = null;
    let retries = 15;
    let lastError = null;

    while (retries > 0) {
        try {
            response = await axios.post(`${FASTAPI_URL}/voice`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    "auth-token": authToken
                },
                timeout: 40000 // Voice processing might take longer + cold start
            });
            break;
        } catch (err) {
            lastError = err;
            const isTimeout = err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || !err.response;
            const isGatewayError = err.response && (err.response.status === 502 || err.response.status === 503 || err.response.status === 504);
            
            if (isTimeout || isGatewayError) {
                retries--;
                if (retries > 0) {
                    console.log(`AI Voice Service unavailable (Cold Start). Retrying... (${retries} attempts left)`);
                    await new Promise(res => setTimeout(res, 5000)); 
                }
            } else {
                break;
            }
        }
    }

    if (!response) {
        console.error("AI Voice Proxy Error:", lastError?.response?.data || lastError?.message || lastError);
        return { success: false, error: lastError?.response?.data || lastError?.message || "ProxyError" };
    }

    return { success: true, data: response.data };
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
