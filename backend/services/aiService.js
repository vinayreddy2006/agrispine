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

// Direct Health Check of AI Service
export const checkAIHealth = async () => {
    const urlsToTry = [
        `${cleanAiUrl}/health`,
        `${cleanAiUrl}/api/ai/health`,
        "http://127.0.0.1:8000/health",
        "http://localhost:8000/health"
    ];
    const uniqueUrls = [...new Set(urlsToTry)];

    for (const url of uniqueUrls) {
        try {
            const res = await axios.get(url, { timeout: 3000 });
            return { online: true, url, data: res.data };
        } catch (e) {
            // continue checking candidate URLs
        }
    }
    return {
        online: false,
        error: "FastAPI AI service unreachable at configured endpoints",
        checkedUrls: uniqueUrls
    };
};

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
    const candidateEndpoints = [
        `${cleanAiUrl}/api/ai/chat`,
        `http://127.0.0.1:8000/api/ai/chat`,
        `http://localhost:8000/api/ai/chat`
    ];
    const uniqueEndpoints = [...new Set(candidateEndpoints)];

    let lastError = null;

    for (const endpoint of uniqueEndpoints) {
        let retries = 2;
        while (retries > 0) {
            try {
                console.log(`[AI-SERVICE] Attempting to connect to AI Service at: ${endpoint}`);
                const response = await axios.post(endpoint, fastApiPayload, {
                    headers: { "auth-token": authToken },
                    timeout: 10000 // 10 second timeout per request
                });
                return { success: true, data: response.data, endpointUsed: endpoint };
            } catch (err) {
                lastError = err;

                // If it's a 4xx error (like 400 Bad Request or 422), do not retry; return response immediately
                if (err.response && err.response.status >= 400 && err.response.status < 500) {
                    return {
                        success: false,
                        error: `HTTP_${err.response.status}`,
                        details: err.response.data?.detail || err.message,
                        data: {
                            reply: err.response.data?.reply || err.response.data?.detail || "AI service rejected the request.",
                            intent: "ERROR",
                            action: null
                        }
                    };
                }

                const isTimeout = err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || !err.response;
                const isGatewayError = err.response && (err.response.status === 502 || err.response.status === 503 || err.response.status === 504);

                if (isTimeout || isGatewayError) {
                    retries--;
                    if (retries > 0) {
                        console.log(`AI Service connection failed at ${endpoint}. Retrying once...`);
                        await new Promise(res => setTimeout(res, 1000));
                    }
                } else {
                    break;
                }
            }
        }
    }

    console.error("AI Chat Proxy Error after candidate attempts:", lastError?.message || lastError);
    return {
        success: false,
        error: lastError?.code || "ProxyError",
        details: lastError?.message,
        data: {
            reply: "The GramSathi AI service is temporarily unavailable or restarting. Please ensure the local AI service on port 8000 is running.",
            intent: "ERROR",
            action: null
        }
    };
};

// Forward Voice to FastAPI
export const forwardVoiceToFastAPI = async (formData, authToken) => {
    const candidateEndpoints = [
        `${cleanAiUrl}/api/ai/voice`,
        `http://127.0.0.1:8000/api/ai/voice`,
        `http://localhost:8000/api/ai/voice`
    ];
    const uniqueEndpoints = [...new Set(candidateEndpoints)];

    let lastError = null;

    for (const endpoint of uniqueEndpoints) {
        try {
            console.log(`[AI-SERVICE] Forwarding voice to: ${endpoint}`);
            const response = await axios.post(endpoint, formData, {
                headers: {
                    ...formData.getHeaders(),
                    "auth-token": authToken
                },
                timeout: 25000
            });
            return { success: true, data: response.data, endpointUsed: endpoint };
        } catch (err) {
            lastError = err;
            console.error(`AI Voice Proxy Error at ${endpoint}:`, err?.response?.data || err?.message || err);
        }
    }

    return {
        success: false,
        error: lastError?.response?.data || lastError?.message || "VoiceProxyError",
        data: {
            reply: "Could not process voice message at this time.",
            intent: "ERROR",
            action: null
        }
    };
};

// Forward Transcription to FastAPI
export const forwardTranscribeToFastAPI = async (formData, authToken) => {
    const candidateEndpoints = [
        `${cleanAiUrl}/api/ai/transcribe`,
        `http://127.0.0.1:8000/api/ai/transcribe`,
        `http://localhost:8000/api/ai/transcribe`
    ];
    const uniqueEndpoints = [...new Set(candidateEndpoints)];

    let lastError = null;

    for (const endpoint of uniqueEndpoints) {
        try {
            console.log(`[AI-SERVICE] Forwarding audio transcription to: ${endpoint}`);
            const response = await axios.post(endpoint, formData, {
                headers: {
                    ...formData.getHeaders(),
                    "auth-token": authToken
                },
                timeout: 25000
            });
            return { success: true, data: response.data, endpointUsed: endpoint };
        } catch (err) {
            lastError = err;
            console.error(`AI Transcribe Proxy Error at ${endpoint}:`, err?.response?.data || err?.message || err);
        }
    }

    return {
        success: false,
        error: lastError?.response?.data || lastError?.message || "TranscribeProxyError",
        data: {
            reply: "Could not transcribe audio at this time.",
            text: "",
            transcribed_text: ""
        }
    };
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
