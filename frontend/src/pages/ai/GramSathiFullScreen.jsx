import { useState, useEffect, useRef } from "react";
import { 
  Mic, Send, Plus, MessageSquare, Bot, User, AlertCircle, 
  MoreVertical, Edit2, Trash2, ArrowLeft, Volume2, Square, 
  Play, Pause, RotateCcw, VolumeX, Sparkles, CheckCircle2,
  XCircle, Check, X, ShieldAlert, Clock
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import LanguageSwitcher from "../../components/LanguageSwitcher";

export default function GramSathiFullScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState("new");
  const [messages, setMessages] = useState([
    { 
      sender: "ai", 
      text: t("gramsathi_ai.welcome", "Namaste! I am GramSathi, your AgriSpine AI farming assistant. Ask me anything about crop diseases, pest control, weather advisories, machinery rental, or government schemes."),
      id: "initial_welcome"
    }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionStatusMap, setActionStatusMap] = useState({});

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const skipFetchRef = useRef(false);
  const recognitionRef = useRef(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    fetchChats();
  }, []);

  // Whenever chat changes, stop speaking and load messages
  useEffect(() => {
    stopSpeaking();

    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }

    if (currentChatId !== "new") {
      fetchChatDetails(currentChatId);
    } else {
      setMessages([
        { 
          sender: "ai", 
          text: t("gramsathi_ai.welcome", "Namaste! I am GramSathi, your AgriSpine AI farming assistant. Ask me anything about crop diseases, pest control, weather advisories, machinery rental, or government schemes."),
          id: "welcome_new"
        }
      ]);
    }
  }, [currentChatId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  const fetchChats = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chats`, {
        headers: { "auth-token": localStorage.getItem("token") }
      });
      setChats(res.data);
    } catch (e) {
      console.error("Failed to fetch chats", e);
    }
  };

  const fetchChatDetails = async (id) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chats/${id}`, {
        headers: { "auth-token": localStorage.getItem("token") }
      });
      const fetchedMessages = res.data.messages || [];
      if (fetchedMessages.length === 0) {
        setMessages([
          { 
            sender: "ai", 
            text: t("gramsathi_ai.welcome", "Namaste! I am GramSathi, your AgriSpine AI farming assistant. Ask me anything about crop diseases, pest control, weather advisories, machinery rental, or government schemes."),
            id: "empty_chat"
          }
        ]);
      } else {
        setMessages(fetchedMessages.map((m, idx) => ({ ...m, id: m._id || idx })));
      }
    } catch (e) {
      console.error("Failed to fetch chat details", e);
    }
  };

  const handleNewChat = () => {
    stopSpeaking();
    setCurrentChatId("new");
  };

  // -- Chat Management Actions --
  const handleRenameChat = async (id, currentTitle) => {
    const { value: newTitle } = await Swal.fire({
      title: t('common.edit', 'Rename Chat'),
      input: 'text',
      inputValue: currentTitle,
      showCancelButton: true,
      confirmButtonText: t('common.save', 'Save'),
      cancelButtonText: t('common.cancel', 'Cancel'),
      confirmButtonColor: '#16a34a'
    });
    
    if (newTitle && newTitle.trim() !== currentTitle) {
      try {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chats/${id}`, { title: newTitle.trim() }, {
          headers: { "auth-token": localStorage.getItem("token") }
        });
        setChats(prev => prev.map(c => c._id === id ? { ...c, title: newTitle.trim() } : c));
      } catch (e) {
        Swal.fire(t('common.error', 'Error'), 'Failed to rename chat', 'error');
      }
    }
  };

  const handleDeleteChat = async (id) => {
    const result = await Swal.fire({
      title: t('common.delete', 'Delete Chat?'),
      text: t('ui.permission_denied_desc', 'This action cannot be undone.'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t('common.delete', 'Yes, delete it'),
      cancelButtonText: t('common.cancel', 'Cancel')
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chats/${id}`, {
          headers: { "auth-token": localStorage.getItem("token") }
        });
        setChats(prev => prev.filter(c => c._id !== id));
        if (currentChatId === id) setCurrentChatId("new");
      } catch (e) {
        Swal.fire(t('common.error', 'Error'), 'Failed to delete chat', 'error');
      }
    }
  };

  // Helper: Determine speech language code
  const getSpeechLanguage = () => {
    const lng = localStorage.getItem('i18nextLng') || i18n.language || 'en';
    if (lng.startsWith('te')) return 'te-IN';
    if (lng.startsWith('hi')) return 'hi-IN';
    return 'en-IN';
  };

  // -- Speech Actions --
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setSpeakingMessageId(null);
  };
  
  const pauseSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };
  
  const resumeSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };
  
  const replaySpeech = () => {
    if (lastSpokenText) {
      speakText(lastSpokenText, speakingMessageId);
    }
  };

  const speakText = (text, messageId = null) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    setLastSpokenText(text);
    if (messageId !== null) setSpeakingMessageId(messageId);

    const langCode = getSpeechLanguage();
    // Split into sentences for natural pauses
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let endedCount = 0;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => 
      v.lang === langCode || 
      v.lang.replace('_', '-').toLowerCase().startsWith(langCode.slice(0, 2).toLowerCase())
    );
    
    sentences.forEach((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      utterance.lang = langCode;
      if (matchingVoice) utterance.voice = matchingVoice;
      utterance.pitch = 1.0;
      utterance.rate = 0.95;

      if (index === 0) {
        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
        };
      }
      utterance.onend = () => {
        endedCount++;
        if (endedCount === sentences.length) {
          setIsSpeaking(false);
          setIsPaused(false);
          setSpeakingMessageId(null);
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setSpeakingMessageId(null);
      };
      window.speechSynthesis.speak(utterance);
    });
  };

  // Voice Recording / Speech-to-Text
  const handleMicClick = () => {
    stopSpeaking();
    
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Swal.fire(
        t("ui.error_title", "Unsupported"), 
        t("gramsathi_ai.unsupported_speech", "Voice recognition not supported in this browser."), 
        "info"
      );
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = getSpeechLanguage();
    recognition.continuous = false; // single prompt
    recognition.interimResults = true;

    let transcriptBuffer = "";

    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const combined = (finalTranscript + " " + interimTranscript).trim();
      if (combined) {
        transcriptBuffer = combined;
        setInput(combined);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-submit voice query and trigger automatic voice response
      const queryToSend = transcriptBuffer.trim() || input.trim();
      if (queryToSend) {
        handleSendMessage(queryToSend, true);
      }
    };

    recognition.onerror = (e) => {
      setIsListening(false);
      console.warn("Speech recognition error:", e);
    };
    
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

  // -- Human-in-the-Loop Confirmation Actions --
  const handleConfirmAction = async (pendingAction) => {
    if (!pendingAction || !pendingAction.action_id || actionLoadingId) return;
    setActionLoadingId(pendingAction.action_id);
    stopSpeaking();
    
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/ai/actions/confirm`,
        {
          session_id: currentChatId,
          action_id: pendingAction.action_id,
          language: localStorage.getItem('i18nextLng') || i18n.language || 'en'
        },
        { headers: { "auth-token": localStorage.getItem("token") } }
      );
      
      setActionStatusMap(prev => ({ ...prev, [pendingAction.action_id]: 'confirmed' }));
      
      const successAiMsg = {
        sender: "ai",
        text: res.data.reply || "Task confirmed and executed successfully.",
        action: res.data.action,
        id: Date.now() + 1
      };
      
      setMessages(prev => [...prev, successAiMsg]);
      
      if (res.data.action?.intent === "NAVIGATE" && res.data.action?.path) {
        setTimeout(() => navigate(res.data.action.path), 1200);
      }
    } catch (err) {
      Swal.fire(
        t('common.error', 'Error'),
        err.response?.data?.reply || err.response?.data?.details || err.response?.data?.error || "Failed to confirm action.",
        'error'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelAction = async (pendingAction) => {
    if (!pendingAction || !pendingAction.action_id || actionLoadingId) return;
    setActionLoadingId(pendingAction.action_id);
    stopSpeaking();
    
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/ai/actions/cancel`,
        {
          session_id: currentChatId,
          action_id: pendingAction.action_id,
          language: localStorage.getItem('i18nextLng') || i18n.language || 'en'
        },
        { headers: { "auth-token": localStorage.getItem("token") } }
      );
      
      setActionStatusMap(prev => ({ ...prev, [pendingAction.action_id]: 'cancelled' }));
      
      const cancelAiMsg = {
        sender: "ai",
        text: res.data.reply || "Action cancelled.",
        id: Date.now() + 1
      };
      
      setMessages(prev => [...prev, cancelAiMsg]);
    } catch (err) {
      console.error("Cancel action failed", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEditAction = (pendingAction) => {
    const defaultPrompt = `${pendingAction.title || 'Action'}: `;
    setInput(defaultPrompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // -- Sending Message --
  // isVoiceInput = true -> Auto-speak the AI response
  // isVoiceInput = false -> Text only, NO auto-speak (manual playback available)
  const handleSendMessage = async (textToSend = input, isVoiceInput = false) => {
    const text = (textToSend || "").trim();
    if (!text || isLoading) return;

    // Immediately stop previous speech when new message starts
    stopSpeaking();

    const userMessage = { 
      sender: "user", 
      text,
      isVoice: isVoiceInput,
      id: Date.now()
    };
    
    setMessages((prev) => {
      if (currentChatId === "new") {
        return [userMessage];
      }
      return [...prev, userMessage];
    });
    
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    try {
      let activeSessionId = currentChatId;
      if (currentChatId === "new") {
        const newChatRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chats/new`, {}, {
          headers: { "auth-token": localStorage.getItem("token") }
        });
        activeSessionId = newChatRes.data._id;
        skipFetchRef.current = true;
        setCurrentChatId(activeSessionId);
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/ai/chat`,
        {
          session_id: activeSessionId,
          message: text,
          current_page_context: { path: window.location.pathname },
          language: localStorage.getItem('i18nextLng') || i18n.language || 'en'
        },
        { headers: { "auth-token": localStorage.getItem("token") } }
      );

      const aiMsgId = Date.now() + 1;
      const aiMessage = {
        sender: "ai",
        text: res.data.reply,
        structured_data: res.data.structured_data,
        action: res.data.action,
        isVoiceResponse: isVoiceInput,
        id: aiMsgId
      };
      
      setMessages((prev) => [...prev, aiMessage]);

      // PART 2 REQUIREMENT:
      // If user asked via voice -> auto-speak response using text-to-speech by default
      // If user typed -> text only, do NOT auto-speak (manual play button available)
      if (isVoiceInput && res.data.reply) {
        speakText(res.data.reply, aiMsgId);
      }

      if (res.data.action) {
        if (res.data.action.intent === "NAVIGATE" && res.data.action.path) {
          setTimeout(() => navigate(res.data.action.path), 1500);
        } else if (res.data.action.intent === "REFRESH_UI") {
          setTimeout(() => window.location.reload(), 2000);
        }
      }

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { 
          sender: "error", 
          text: t('gramsathi_ai.voice_error', 'Failed to communicate with GramSathi. Please try again.'),
          id: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
      fetchChats();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      
      {/* Sidebar */}
      <div className="w-0 md:w-[320px] flex-shrink-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl flex flex-col z-10 transition-all duration-300 overflow-hidden border-r border-slate-200/60 dark:border-slate-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none">
        
        {/* Header / New Chat */}
        <div className="p-5 md:p-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                stopSpeaking();
                navigate(-1);
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('common.back', 'Back')}</span>
            </button>
            <LanguageSwitcher />
          </div>

          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3.5 px-4 rounded-2xl transition-all duration-300 shadow-[0_8px_20px_rgba(5,150,105,0.2)] hover:shadow-[0_12px_25px_rgba(5,150,105,0.3)] hover:-translate-y-0.5 font-bold"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[15px] tracking-wide">{t('gramsathi_ai.new_chat', 'New Chat')}</span>
          </button>
        </div>
        
        {/* Chats List */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar mt-2">
          <div className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 px-2 py-3 uppercase">
            {t('gramsathi_ai.chat_history', 'Chat History')}
          </div>
          
          <div className="space-y-1.5">
            {chats.length === 0 ? (
                <div className="text-center px-4 py-10 opacity-70">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-4 stroke-1" />
                    <p className="text-[13px] text-slate-500 font-medium">{t('gramsathi_ai.no_chats', 'No recent chats')}</p>
                </div>
            ) : (
                chats.map(chat => (
                <div key={chat._id} className="relative group">
                    <button
                        onClick={() => setCurrentChatId(chat._id)}
                        className={`w-full text-left flex items-center gap-3.5 px-3 py-3.5 transition-all duration-200 ${
                            currentChatId === chat._id 
                            ? 'bg-green-50/80 dark:bg-green-900/10 text-green-700 dark:text-green-400 font-bold shadow-sm border-l-[3px] border-l-green-600 border-t border-t-transparent border-r border-r-transparent border-b border-b-transparent rounded-r-xl rounded-l-sm' 
                            : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                    >
                        <MessageSquare className={`w-4 h-4 flex-shrink-0 transition-colors ${currentChatId === chat._id ? 'text-green-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
                        <span className="truncate flex-1 tracking-wide text-[14px]">{chat.title}</span>
                    </button>
                    
                    {/* Context Menu Trigger */}
                    <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-200 ${currentChatId === chat._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === chat._id ? null : chat._id); }}
                            className="p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200/80 dark:border-slate-700/80 text-slate-400 hover:text-green-600 hover:border-green-300 hover:shadow-md transition-all duration-200"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Dropdown Menu */}
                    {menuOpenId === chat._id && (
                        <>
                            {/* Invisible overlay to close menu */}
                            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); }} />
                            
                            <div className="absolute right-0 top-12 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-700 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleRenameChat(chat._id, chat.title); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors">
                                    <Edit2 className="w-4 h-4 text-slate-400" /> {t('common.edit', 'Rename')}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleDeleteChat(chat._id); }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 transition-colors">
                                    <Trash2 className="w-4 h-4 text-red-500" /> {t('common.delete', 'Delete chat')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
                ))
            )}
          </div>
        </div>
        
        {/* User Profile / Settings at Bottom */}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
            <div className="w-full flex items-center gap-3.5 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-sm">
                    <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                    <div className="text-[14px] font-bold tracking-wide text-slate-800 dark:text-white">{t('gramsathi_ai.title', 'GramSathi AI')}</div>
                    <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mt-0.5">AgriSpine Core</div>
                </div>
            </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative transition-colors">
        
        {/* Mobile Top Header with Back Button and Language Switcher */}
        <div className="flex md:hidden items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-20">
          <button
            onClick={() => {
              stopSpeaking();
              navigate(-1);
            }}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.back', 'Back')}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('gramsathi_ai.title', 'GramSathi AI')}</span>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-[280px] custom-scrollbar">
          
          {messages.map((msg, idx) => {
            const isUser = msg.sender === "user";
            const isError = msg.sender === "error";
            const isAiMsgSpeaking = isSpeaking && speakingMessageId === (msg.id || idx);

            return (
              <div key={msg.id || idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                
                {!isUser && !isError && (
                  <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 mr-3 mt-1 border border-green-200 dark:border-green-800">
                    <Bot className="w-5 h-5 text-green-600 dark:text-green-500" />
                  </div>
                )}
                
                {isError && (
                  <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
                  </div>
                )}

                <div className={`max-w-[85%] md:max-w-[70%] break-words rounded-2xl px-5 py-4 shadow-sm text-[15px] leading-relaxed relative ${
                  isUser 
                    ? "bg-green-600 dark:bg-green-600 text-white rounded-br-sm shadow-green-900/10" 
                    : isError
                      ? "bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-bl-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 rounded-bl-sm shadow-sm"
                }`}>
                  {/* Badge for voice prompt or response */}
                  {msg.isVoice && (
                    <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-green-100 mb-1.5 opacity-90">
                      <Mic className="w-3 h-3" />
                      <span>{t('gramsathi_ai.start_recording', 'Voice Question')}</span>
                    </div>
                  )}

                  {msg.isVoiceResponse && (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md mb-2">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{t('gramsathi_ai.auto_voice_badge', 'Voice Query - Auto-spoken')}</span>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Structured Confirmation Card for Human-in-the-Loop Operations */}
                  {msg.action?.type === "CONFIRMATION_REQUIRED" && msg.action?.pending_action && (() => {
                    const pending = msg.action.pending_action;
                    const actionId = pending.action_id;
                    const currentStatus = actionStatusMap[actionId] || pending.status || "pending_confirmation";
                    const isExecuting = actionLoadingId === actionId;

                    return (
                      <div className="mt-3.5 p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/30 shadow-md">
                        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                              {pending.title || "Confirm Action"}
                            </span>
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            currentStatus === "confirmed" 
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                              : currentStatus === "cancelled"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 animate-pulse"
                          }`}>
                            {currentStatus === "confirmed" ? "✓ Confirmed" : currentStatus === "cancelled" ? "✕ Cancelled" : "● Awaiting Confirmation"}
                          </span>
                        </div>

                        {pending.summary && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                            {pending.summary}
                          </p>
                        )}

                        {/* Details Table / Grid */}
                        {pending.display_fields && pending.display_fields.length > 0 && (
                          <div className="rounded-lg bg-slate-50 dark:bg-slate-950/50 p-2.5 mb-3 border border-slate-200/60 dark:border-slate-800/60">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {pending.display_fields.map((f, fIdx) => (
                                <div key={fIdx} className="flex flex-col">
                                  <dt className="text-slate-400 dark:text-slate-500 font-medium text-[10px] uppercase tracking-wider">{f.label}</dt>
                                  <dd className="font-bold text-slate-800 dark:text-slate-200">{f.value}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {currentStatus === "confirmed" ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 py-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Executed & saved to AgriSpine.</span>
                          </div>
                        ) : currentStatus === "cancelled" ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-rose-500 dark:text-rose-400 py-1">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span>Action was cancelled.</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              onClick={() => handleConfirmAction(pending)}
                              disabled={isExecuting}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                            >
                              {isExecuting ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>{pending.buttons?.confirm || "Confirm & Execute"}</span>
                            </button>

                            <button
                              onClick={() => handleEditAction(pending)}
                              disabled={isExecuting}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{pending.buttons?.edit || "Edit Details"}</span>
                            </button>

                            <button
                              onClick={() => handleCancelAction(pending)}
                              disabled={isExecuting}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 transition border border-rose-200 dark:border-rose-900/50"
                            >
                              <X className="w-3 h-3" />
                              <span>{pending.buttons?.cancel || "Cancel"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Manual Voice Playback Controls for each AI response */}
                  {!isUser && !isError && msg.text && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                      {isAiMsgSpeaking ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={stopSpeaking}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            title={t('gramsathi_ai.stop', 'Stop')}
                          >
                            <Square className="w-3 h-3 fill-current" />
                            <span>{t('gramsathi_ai.stop', 'Stop')}</span>
                          </button>

                          {isPaused ? (
                            <button
                              onClick={resumeSpeaking}
                              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                              title={t('gramsathi_ai.resume', 'Resume')}
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{t('gramsathi_ai.resume', 'Resume')}</span>
                            </button>
                          ) : (
                            <button
                              onClick={pauseSpeaking}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                              title={t('gramsathi_ai.paused', 'Pause')}
                            >
                              <Pause className="w-3 h-3 fill-current" />
                              <span>{t('gramsathi_ai.paused', 'Pause')}</span>
                            </button>
                          )}

                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            {t('gramsathi_ai.speaking', 'Speaking...')}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => speakText(msg.text, msg.id || idx)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                          title={t('gramsathi_ai.listen', 'Listen')}
                        >
                          <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{t('gramsathi_ai.listen', 'Listen')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 ml-3 mt-1 border border-slate-200 dark:border-slate-700">
                    <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 mr-3 mt-1 shadow-sm border border-green-200 dark:border-green-800">
                <Bot className="w-5 h-5 text-green-600 dark:text-green-500" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-6 py-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs font-medium text-slate-400 ml-2">
                  {t('gramsathi_ai.typing_indicator', 'GramSathi is thinking...')}
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Floating Input & Playback Controls Area */}
        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 pb-8 pt-10 pointer-events-none">
          
          {/* Main Global Playback Status Bar */}
          {isSpeaking && (
            <div className="max-w-xl mx-auto mb-3 pointer-events-auto flex items-center justify-between gap-3 bg-slate-900/95 dark:bg-slate-800/95 text-white p-2.5 px-4 rounded-2xl shadow-xl border border-slate-700/70 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  {isPaused ? t('gramsathi_ai.paused', 'Paused') : t('gramsathi_ai.speaking', 'GramSathi Speaking')}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {isPaused ? (
                  <button 
                    onClick={resumeSpeaking} 
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold flex items-center gap-1"
                    title={t('gramsathi_ai.resume', 'Resume')}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button 
                    onClick={pauseSpeaking} 
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold flex items-center gap-1"
                    title={t('gramsathi_ai.paused', 'Pause')}
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}

                <button 
                  onClick={stopSpeaking} 
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition text-xs font-bold flex items-center gap-1"
                  title={t('gramsathi_ai.stop', 'Stop')}
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>{t('gramsathi_ai.stop', 'Stop')}</span>
                </button>

                <button 
                  onClick={replaySpeech} 
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold"
                  title={t('gramsathi_ai.replay', 'Replay')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Normal Input Bar */}
          <div className="max-w-4xl mx-auto relative flex items-end shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-[24px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pointer-events-auto p-2 gap-2 transition-shadow hover:shadow-xl dark:hover:shadow-2xl">
            
            {/* Microphone Button (Voice Input) */}
            <button
              onClick={handleMicClick}
              className={`p-3 rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
                isListening 
                  ? "bg-red-500 text-white animate-pulse scale-110 shadow-lg shadow-red-500/30" 
                  : "text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              title={isListening ? t('gramsathi_ai.stop_recording', "Stop Recording") : t('gramsathi_ai.start_recording', "Start Voice Input")}
            >
              {isListening ? (
                <div className="w-4 h-4 bg-white rounded-[3px]"></div>
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
            
            {/* Textarea for typing */}
            <textarea
              ref={textareaRef}
              rows={1}
              className="flex-1 bg-transparent py-3 pl-2 pr-4 focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 text-[15px] resize-none overflow-y-auto min-h-[48px] max-h-[160px] custom-scrollbar self-center"
              placeholder={isListening ? t('gramsathi_ai.listening', "Listening... speak now") : t('gramsathi_ai.placeholder', "Ask GramSathi anything about your farm...")}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (isSpeaking) stopSpeaking();
                if (textareaRef.current) {
                  textareaRef.current.style.height = "auto";
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(input, false); // Typed input: isVoiceInput = false -> text only, no auto-speaking
                }
              }}
              autoFocus
            />
            
            {/* Send Button */}
            <button
              onClick={() => handleSendMessage(input, false)} // Typed input: isVoiceInput = false -> text only, no auto-speaking
              disabled={!input.trim() || isLoading}
              className="p-3 mb-0.5 bg-green-600 text-white rounded-[16px] hover:bg-green-700 disabled:opacity-40 disabled:hover:bg-green-600 transition-all shadow-sm flex items-center justify-center flex-shrink-0"
              title={t('gramsathi_ai.send', 'Send')}
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
