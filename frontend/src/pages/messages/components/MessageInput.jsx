import React, { useState } from 'react';
import { X, Smile, Paperclip, Send, Mic, Trash2, FileText, Camera, Image as ImageIcon, UserCircle, BarChart2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({
    selectionMode,
    imagePreview,
    filePreview,
    t,
    clearAttachment,
    showInputEmoji,
    setShowInputEmoji,
    setCurrentMessage,
    replyingTo,
    setReplyingTo,
    isRecording,
    formatTime,
    recordingTime,
    cancelRecording,
    stopRecording,
    sendAudioMessage,
    handleDocumentAttach,
    handleGalleryAttach,
    handleCameraAttach,
    handlePollAttach,
    sendMessage,
    currentMessage,
    isUploading,
    startRecording,
    onTyping
}) => {
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

    if (selectionMode) return null;

    return (
        <div className="bg-[#f0f2f5] px-2 md:px-4 py-2 z-20 shrink-0 pb-safe relative shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
            {imagePreview && (
                <div className="bg-white p-2 mb-2 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700">{t('village.photo_selected', { defaultValue: "Photo selected" })}</span>
                            <span className="text-[10px] text-gray-500">{t('village.add_caption', { defaultValue: "Add a caption..." })}</span>
                        </div>
                    </div>
                    <button onClick={clearAttachment} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition"><X className="w-5 h-5" /></button>
                </div>
            )}
            {filePreview && (
                <div className="bg-white p-3 mb-2 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-md flex items-center justify-center ${filePreview.type === 'video' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{filePreview.name}</span>
                            <span className="text-[10px] text-gray-500">{(filePreview.size / 1024 / 1024).toFixed(2)} MB • {filePreview.type === 'video' ? 'Video' : 'Document'}</span>
                        </div>
                    </div>
                    <button onClick={clearAttachment} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition"><X className="w-5 h-5" /></button>
                </div>
            )}
            
            {showInputEmoji && (
                <div className="absolute bottom-16 left-2 z-50 shadow-2xl rounded-lg overflow-hidden w-[350px] max-w-[90vw]">
                    <EmojiPicker onEmojiClick={(e) => setCurrentMessage(prev => prev + e.emoji)} width="100%" />
                </div>
            )}
            
            {replyingTo && (
                <div className="bg-white px-4 py-2 border-l-4 border-green-600 flex justify-between items-center mb-2 rounded-lg shadow-sm">
                    <div className="text-sm overflow-hidden">
                        <p className="text-green-700 font-bold text-xs">{t('village.replying_to', { defaultValue: "Replying to" })} {replyingTo.senderName}</p>
                        <p className="text-gray-500 truncate text-xs">{replyingTo.text}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)}><X className="w-4 h-4 text-gray-500" /></button>
                </div>
            )}

            <div className="flex items-center gap-2">
                {isRecording ? (
                    <div className="flex-1 flex items-center gap-3 bg-red-50 border border-red-100 rounded-full px-4 py-2.5 animate-in fade-in duration-200 shadow-inner">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] shrink-0" />
                        <span className="text-red-600 text-sm font-mono font-medium min-w-[50px]">{formatTime(recordingTime)}</span>
                        
                        <div className="flex-1 flex items-center justify-center gap-0.5 h-6 overflow-hidden opacity-70">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
                                <div 
                                    key={i} 
                                    className="w-1 bg-red-400 rounded-full animate-[bounce_1s_infinite]" 
                                    style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.1}s`, animationDuration: `${Math.random() * 0.5 + 0.5}s` }} 
                                />
                            ))}
                        </div>

                        <button onClick={cancelRecording} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition shrink-0" title={t('common.cancel', { defaultValue: "Cancel" })}><Trash2 className="w-5 h-5" /></button>
                        <button onClick={() => { stopRecording(); setTimeout(sendAudioMessage, 500); }} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition active:scale-95 shrink-0" title={t('village.send_audio', { defaultValue: "Send Audio" })}><Send className="w-5 h-5 ml-0.5" /></button>
                    </div>
                ) : (
                    <>
                        <button type="button" onClick={() => { setShowInputEmoji(!showInputEmoji); setShowAttachmentMenu(false); }} className={`p-2.5 rounded-full transition-all flex items-center justify-center ${showInputEmoji ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-105' : 'text-slate-600 hover:text-green-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-green-400'}`}><Smile className="w-6 h-6" /></button>
                        
                        <div className="relative">
                            <button type="button" onClick={() => { setShowAttachmentMenu(!showAttachmentMenu); setShowInputEmoji(false); }} className={`p-2.5 rounded-full transition-all flex items-center justify-center ${imagePreview ? 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 scale-105' : showAttachmentMenu ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-105' : 'text-slate-600 hover:text-green-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-green-400'}`}><Paperclip className="w-6 h-6" /></button>
                            {showAttachmentMenu && (
                                <div className="absolute bottom-14 left-0 bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-700 p-4 grid grid-cols-3 gap-y-6 gap-x-4 animate-in slide-in-from-bottom-2 zoom-in-95 w-72 z-50">
                                    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => { setShowAttachmentMenu(false); handleDocumentAttach(); }}>
                                        <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all"><FileText className="w-5 h-5"/></div>
                                        <span className="text-[11px] text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">Document</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => { setShowAttachmentMenu(false); handleCameraAttach(); }}>
                                        <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all"><Camera className="w-5 h-5"/></div>
                                        <span className="text-[11px] text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">Camera</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => { setShowAttachmentMenu(false); handleGalleryAttach(); }}>
                                        <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all"><ImageIcon className="w-5 h-5"/></div>
                                        <span className="text-[11px] text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">Gallery</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => { setShowAttachmentMenu(false); }}>
                                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all"><UserCircle className="w-5 h-5"/></div>
                                        <span className="text-[11px] text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">Contact</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => { setShowAttachmentMenu(false); handlePollAttach(); }}>
                                        <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all"><BarChart2 className="w-5 h-5"/></div>
                                        <span className="text-[11px] text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">Poll</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={sendMessage} className="flex-1">
                            <input 
                                type="text" 
                                value={currentMessage} 
                                placeholder={(imagePreview || filePreview) ? t('village.add_caption', { defaultValue: "Add a caption..." }) : t('village.type_message', { defaultValue: "Message" })} 
                                className="w-full bg-white border border-gray-200 rounded-full md:rounded-lg px-4 py-2 md:py-3 outline-none focus:ring-1 focus:ring-[#008069] text-gray-700 text-sm" 
                                onChange={(event) => {
                                    setCurrentMessage(event.target.value);
                                    if (onTyping) onTyping();
                                }} 
                                onClick={() => { setShowInputEmoji(false); setShowAttachmentMenu(false); }}
                            />
                        </form>
                        {(currentMessage.trim() || imagePreview || filePreview) ? (
                            <button onClick={sendMessage} disabled={isUploading} className={`p-3 bg-[#008069] hover:bg-[#006a57] text-white rounded-full shadow-md transition active:scale-95 flex items-center justify-center ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                {isUploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                            </button>
                        ) : (
                            <button onClick={startRecording} className="p-3 bg-[#008069] hover:bg-[#006a57] text-white rounded-full shadow-md transition active:scale-95"><Mic className="w-5 h-5" /></button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MessageInput;
