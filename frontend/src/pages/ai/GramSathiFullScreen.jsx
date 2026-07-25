import { useState, useEffect, useRef } from "react";
import { Mic, Send, Plus, MessageSquare, Bot, User, AlertCircle, MoreVertical, Edit2, Trash2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function GramSathiFullScreen() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState("new");
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! I am GramSathi, your AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const skipFetchRef = useRef(false);
  const navigate = useNavigate();

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    
    if (skipFetchRef.current) {
        skipFetchRef.current = false;
        return;
    }

    if (currentChatId !== "new") {
      fetchChatDetails(currentChatId);
    } else {
      setMessages([{ sender: "ai", text: "Hello! I am GramSathi, your AI assistant. How can I help you today?" }]);
    }
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      const fetchedMessages = res.data.messages;
      if (fetchedMessages.length === 0) {
        setMessages([{ sender: "ai", text: "Hello! I am GramSathi, your AI assistant. How can I help you today?" }]);
      } else {
        setMessages(fetchedMessages);
      }
    } catch (e) {
      console.error("Failed to fetch chat details", e);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId("new");
  };

  // -- Chat Management Actions --
  const handleRenameChat = async (id, currentTitle) => {
    const { value: newTitle } = await Swal.fire({
      title: 'Rename Chat',
      input: 'text',
      inputValue: currentTitle,
      showCancelButton: true,
      confirmButtonText: 'Save',
      confirmButtonColor: '#16a34a'
    });
    
    if (newTitle && newTitle.trim() !== currentTitle) {
      try {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chats/${id}`, { title: newTitle.trim() }, {
          headers: { "auth-token": localStorage.getItem("token") }
        });
        setChats(prev => prev.map(c => c._id === id ? { ...c, title: newTitle.trim() } : c));
      } catch (e) {
        Swal.fire('Error', 'Failed to rename chat', 'error');
      }
    }
  };

  const handleDeleteChat = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Chat?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chats/${id}`, {
          headers: { "auth-token": localStorage.getItem("token") }
        });
        setChats(prev => prev.filter(c => c._id !== id));
        if (currentChatId === id) setCurrentChatId("new");
      } catch (e) {
        Swal.fire('Error', 'Failed to delete chat', 'error');
      }
    }
  };

  // -- Speech Actions --
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };
  
  const pauseSpeaking = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  };
  
  const resumeSpeaking = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  };
  
  const replaySpeech = () => {
    if (lastSpokenText) speakText(lastSpokenText);
  };

  const speakText = (text) => {
    window.speechSynthesis.cancel();
    setLastSpokenText(text);
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let endedCount = 0;
    
    sentences.forEach((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      utterance.lang = "en-IN";
      if (index === 0) utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
      };
      utterance.onend = () => {
        endedCount++;
        if (endedCount === sentences.length) {
          setIsSpeaking(false);
          setIsPaused(false);
        }
      };
      utterance.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
      };
      window.speechSynthesis.speak(utterance);
    });
  };

  const handleMicClick = () => {
    stopSpeaking();
    if (!("webkitSpeechRecognition" in window)) {
      Swal.fire("Unsupported", "Voice recognition not supported in this browser.", "info");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSendMessage(transcript);
    };
    recognition.start();
  };

  // -- Sending Message --
  const handleSendMessage = async (text = input) => {
    if (!text.trim()) return;

    const userMessage = { sender: "user", text };
    
    // Optimistic Update immediately adds the message
    setMessages((prev) => {
        if (currentChatId === "new") {
            return [userMessage]; // Fresh start for new chat visually
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
        skipFetchRef.current = true; // Prevent useEffect from clearing our optimistic update
        setCurrentChatId(activeSessionId);
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/ai/chat`,
        {
          session_id: activeSessionId,
          message: text,
          current_page_context: { path: window.location.pathname } 
        },
        { headers: { "auth-token": localStorage.getItem("token") } }
      );

      const aiMessage = {
        sender: "ai",
        text: res.data.reply,
        structured_data: res.data.structured_data,
        action: res.data.action
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      speakText(res.data.reply);

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
        { sender: "error", text: "Failed to communicate with GramSathi. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
      fetchChats();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      
      {/* Sidebar */}
      <div className="w-0 md:w-[280px] flex-shrink-0 bg-[#f9f9f9] dark:bg-[#171717] flex flex-col z-10 transition-all duration-300 overflow-hidden border-r border-slate-200 dark:border-white/10">
        
        {/* Header / New Chat */}
        <div className="p-3">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 bg-white dark:bg-transparent hover:bg-slate-200 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 py-2.5 px-3 rounded-lg transition-colors group border border-slate-200 dark:border-transparent shadow-sm dark:shadow-none"
          >
            <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-500/20 transition-colors">
              <Bot className="w-4 h-4 text-green-600 dark:text-slate-300 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors" />
            </div>
            <span className="font-semibold text-sm">New Chat</span>
            <div className="ml-auto flex items-center justify-center w-7 h-7">
                <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
            </div>
          </button>
        </div>
        
        {/* Chats List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-2 mt-4 mb-1">Today</div>
          
          <div className="space-y-0.5">
            {chats.length === 0 ? (
                <div className="text-center px-4 py-8">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-400 mb-3" />
                    <p className="text-sm text-slate-500">No recent chats</p>
                </div>
            ) : (
                chats.map(chat => (
                <div key={chat._id} className="relative group">
                    <button
                        onClick={() => setCurrentChatId(chat._id)}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            currentChatId === chat._id 
                            ? 'bg-green-100/50 dark:bg-white/10 text-green-900 dark:text-white font-medium' 
                            : 'hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-300'
                        }`}
                    >
                        <span className="truncate text-[13px] font-medium flex-1 tracking-wide">{chat.title}</span>
                    </button>
                    
                    {/* Context Menu Trigger */}
                    <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1 rounded-md transition-opacity bg-gradient-to-l from-slate-950/90 via-slate-950/80 to-transparent ${currentChatId === chat._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === chat._id ? null : chat._id); }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Dropdown Menu */}
                    {menuOpenId === chat._id && (
                        <>
                            {/* Invisible overlay to close menu */}
                            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); }} />
                            
                            <div className="absolute right-2 top-8 w-36 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleRenameChat(chat._id, chat.title); }} className="w-full text-left px-3 py-2 text-[13px] text-slate-200 hover:bg-slate-700 flex items-center gap-3">
                                    <Edit2 className="w-4 h-4 text-slate-400" /> Rename
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleDeleteChat(chat._id); }} className="w-full text-left px-3 py-2 text-[13px] text-red-400 hover:bg-slate-700 flex items-center gap-3">
                                    <Trash2 className="w-4 h-4 text-red-400" /> Delete chat
                                </button>
                            </div>
                        </>
                    )}
                </div>
                ))
            )}
          </div>
        </div>
        
        {/* User Profile / Settings at Bottom (Optional but looks premium) */}
        <div className="p-3 border-t border-slate-200 dark:border-white/10">
            <button className="w-full flex items-center gap-3 hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 py-2.5 px-3 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700">
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 text-left">
                    <div className="text-[13px] font-semibold text-slate-800 dark:text-white">GramSathi AI</div>
                    <div className="text-[11px] text-slate-500">AgriSpine Core</div>
                </div>
            </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative transition-colors">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-32">
          
          {messages.map((msg, idx) => {
            const isUser = msg.sender === "user";
            const isError = msg.sender === "error";

            return (
              <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                
                {!isUser && !isError && (
                  <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 mr-4 mt-1 border border-green-200 dark:border-green-800">
                    <Bot className="w-5 h-5 text-green-600 dark:text-green-500" />
                  </div>
                )}
                
                {isError && (
                  <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0 mr-4 mt-1">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
                  </div>
                )}

                <div className={`max-w-[85%] md:max-w-[70%] break-words rounded-2xl px-5 py-4 shadow-sm text-[15px] leading-relaxed ${
                  isUser 
                    ? "bg-green-600 dark:bg-green-600 text-white rounded-br-sm shadow-green-900/10" 
                    : isError
                      ? "bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-bl-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 rounded-bl-sm shadow-sm"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 ml-4 mt-1 border border-slate-200 dark:border-slate-700">
                    <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 mr-4 mt-1 shadow-sm border border-green-200 dark:border-green-800">
                <Bot className="w-5 h-5 text-green-600 dark:text-green-500" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-6 py-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-900 dark:via-slate-900 pb-8 pt-12 pointer-events-none">
          <div className="max-w-4xl mx-auto relative flex items-end shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-[24px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pointer-events-auto p-2 gap-2 transition-shadow hover:shadow-xl dark:hover:shadow-2xl">
            {isSpeaking && (
              <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-slate-800 dark:bg-slate-700 p-1.5 rounded-full shadow-lg animate-in slide-in-from-bottom-2 border border-slate-700 dark:border-slate-600 z-20">
                {isPaused ? (
                    <button onClick={resumeSpeaking} className="text-white hover:bg-slate-700 dark:hover:bg-slate-600 p-2 rounded-full transition">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                ) : (
                    <button onClick={pauseSpeaking} className="text-white hover:bg-slate-700 dark:hover:bg-slate-600 p-2 rounded-full transition">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    </button>
                )}
                <button onClick={stopSpeaking} className="text-white hover:bg-slate-700 dark:hover:bg-slate-600 p-2 rounded-full transition">
                    <div className="w-3.5 h-3.5 bg-red-500 rounded-sm"></div>
                </button>
                <button onClick={replaySpeech} className="text-white hover:bg-slate-700 dark:hover:bg-slate-600 p-2 rounded-full transition" title="Replay">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
            )}
            
            <button
              onClick={handleMicClick}
              className={`p-3 rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
                isListening ? "bg-red-100 dark:bg-red-900/30 text-red-500 animate-pulse scale-110" : "text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
            
            <textarea
              ref={textareaRef}
              rows={1}
              className="flex-1 bg-transparent py-3 pl-3 pr-4 md:pr-6 focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 text-[15px] resize-none overflow-y-auto min-h-[48px] max-h-[160px] custom-scrollbar self-center"
              placeholder="Ask GramSathi anything..."
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
                  handleSendMessage();
                }
              }}
              autoFocus
            />
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="p-3 mb-0.5 bg-green-600 text-white rounded-[16px] hover:bg-green-700 disabled:opacity-40 disabled:hover:bg-green-600 transition-all shadow-sm flex items-center justify-center flex-shrink-0"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
          <div className="text-center text-[11px] font-medium text-slate-500/70 dark:text-slate-500 mt-4 pointer-events-auto tracking-wide">
            GramSathi can make mistakes. Always verify important farming data.
          </div>
        </div>
      </div>
    </div>
  );
}
