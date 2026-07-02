import React from 'react';
import { Star, Smile, ChevronDown, Reply, Info, CheckSquare, Trash2, Plus, Ban, Check, CheckCheck, FileText, Download, BarChart2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import Swal from 'sweetalert2';
import HighlightText from './HighlightText';

const MessageBubble = ({
    msg,
    isMe,
    isStarred,
    profileImg,
    isSelected,
    selectionMode,
    isDeleted,
    isNearBottom,
    toggleSelection,
    getUserColor,
    getFileUrl,
    getTickStatus,
    setViewImage,
    t,
    searchQuery,
    currentUser,
    removeReaction,
    setShowReactionPicker,
    setActiveMessageMenu,
    activeMessageMenu,
    showReactionPicker,
    setReplyingTo,
    setShowMessageInfo,
    loadMembers,
    setShowGroupInfo,
    starMessage,
    startSelection,
    handleDeleteSingle,
    isConsecutive,
    handleVotePoll,
    setShowPollInfo
}) => {
    return (
        <div className={`flex w-full mb-1 gap-1.5 transition-colors ${isConsecutive ? "mt-[2px]" : "mt-2"} ${isSelected ? "bg-blue-100/50 dark:bg-blue-900/30 -mx-4 px-4 py-1" : ""} ${selectionMode ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : ""} ${isMe ? "justify-end" : "justify-start"}`} onClick={() => selectionMode && toggleSelection(msg._id)}>
            {selectionMode && <div className="self-center mr-1"><div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition ${isSelected ? "bg-[#008069] border-[#008069]" : "border-gray-400 bg-surface"}`}>{isSelected && <Check className="w-3 h-3 text-white" />}</div></div>}
            
            {!isMe && (
                <div className={`w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-[10px] shrink-0 mt-1 overflow-hidden shadow-sm ${isConsecutive ? "invisible" : ""}`}>
                    {profileImg ? <img src={profileImg} className="w-full h-full object-cover" alt="profile" /> : (msg.senderName ? msg.senderName[0].toUpperCase() : "U")}
                </div>
            )}
            
            <div className={`flex items-start gap-1 max-w-[85%] md:max-w-[70%] group relative ${isMe ? "flex-row-reverse" : "flex-row"}`} onClick={() => selectionMode && toggleSelection(msg._id)}>
                <div className={`rounded-2xl shadow-sm relative w-fit break-all flex flex-col transition-colors
                    ${isMe ? "bg-primary-light dark:bg-primary-dark text-text-primary dark:text-white rounded-tr-sm" : "bg-surface text-text-primary rounded-tl-sm"}
                    ${!msg.text && msg.image ? "p-1" : "px-3 pt-2 pb-2"}`}
                >
                    {!isMe && !isConsecutive && <p className={`text-[10px] font-bold leading-tight mb-0.5 px-1 cursor-pointer hover:underline ${getUserColor(msg.senderName)}`}>~ {msg.senderName}</p>}

                    {isDeleted ? (
                        <div className="flex flex-col px-2 pb-1">
                            <div className="flex items-center gap-1.5 text-text-muted italic text-sm py-1 pr-2">
                                <Ban className="w-3.5 h-3.5" />
                                <span>{isMe ? t('village.you_deleted', { defaultValue: "You deleted this message" }) : t('village.msg_deleted', { defaultValue: "This message was deleted" })}</span>
                            </div>
                            <div className="flex items-center justify-end gap-0.5 ml-auto opacity-60 h-3 mb-[1px]">
                                <span className="text-[9px] whitespace-nowrap">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {msg.image && (
                                <div className="relative rounded-lg overflow-hidden cursor-pointer mb-1" onClick={() => setViewImage(msg)}>
                                    <img
                                        src={getFileUrl(msg.image)}
                                        alt="attachment"
                                        className="w-full h-auto max-w-[280px] max-h-[300px] object-cover"
                                    />
                                    {!msg.text && (
                                        <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-1 pt-6 flex justify-end items-end gap-1">
                                            {isStarred && <Star className="w-3 h-3 text-white fill-white" />}
                                            <span className="text-[10px] text-white/90 font-medium">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && <span className="text-white/90">{getTickStatus(msg)}</span>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {msg.file && msg.fileType?.startsWith('video/') && (
                                <div className="relative rounded-lg overflow-hidden mb-1 w-[250px] md:w-[300px]">
                                    <video controls className="w-full h-auto bg-black max-h-[300px]">
                                        <source src={getFileUrl(msg.file)} type={msg.fileType} />
                                    </video>
                                    {!msg.text && (
                                        <div className="flex justify-end items-center gap-1 mt-1 mr-1">
                                            {isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                            <span className="text-[9px] text-text-muted">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && getTickStatus(msg)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {msg.file && !msg.fileType?.startsWith('video/') && (
                                <div className="flex flex-col gap-1 mb-1 p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10 w-[240px] md:w-[280px]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 shrink-0 bg-[#f15c6d] rounded flex items-center justify-center text-white shadow-sm">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-text-primary truncate">{msg.fileName || "Document"}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">{msg.fileType ? msg.fileType.split('/')[1] : "FILE"}</span>
                                                <span className="text-text-muted text-[10px]">•</span>
                                                <span className="text-[10px] text-text-muted">{msg.fileSize ? (msg.fileSize / 1024 / 1024).toFixed(2) : "Unknown"} MB</span>
                                            </div>
                                        </div>
                                    </div>
                                    <a href={getFileUrl(msg.file)} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center justify-center gap-2 w-full py-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-md text-xs font-semibold text-text-primary transition-colors">
                                        <Download className="w-4 h-4" /> Download
                                    </a>
                                </div>
                            )}

                            {msg.poll && (
                                <div className="flex flex-col w-[280px] md:w-[320px] bg-white dark:bg-gray-800 rounded-lg p-3 pb-2 shadow-sm border border-gray-100 dark:border-gray-700 mb-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-[13px] text-text-muted">Poll</p>
                                    </div>
                                    <h3 className="font-bold text-[15px] text-text-primary leading-tight mb-1">{msg.poll.question}</h3>
                                    <p className="text-[12px] text-text-muted mb-3">Select {msg.poll.multipleChoice ? "one or more" : "one"}</p>

                                    <div className="flex flex-col gap-2 mb-3">
                                        {msg.poll.options?.map((opt, i) => {
                                            const totalVotes = msg.poll.options.reduce((sum, o) => sum + o.votes.length, 0);
                                            const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
                                            const hasVoted = opt.votes.includes(currentUser.id || currentUser._id);
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    className="flex flex-col cursor-pointer group"
                                                    onClick={() => handleVotePoll(msg.poll._id, i)}
                                                >
                                                     <div className="flex items-center justify-between">
                                                         <div className="flex items-center gap-2 text-sm text-text-primary mb-1">
                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${hasVoted ? 'bg-[#008069] border-[#008069]' : 'border-gray-400 group-hover:border-[#008069]'}`}>
                                                                {hasVoted && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                            </div>
                                                            <span className="font-medium">{opt.text}</span>
                                                         </div>
                                                     </div>
                                                     <div className="flex items-center gap-2 pl-6">
                                                         <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                             <div className="h-full bg-[#008069] transition-all" style={{width: `${percentage}%`}}></div>
                                                         </div>
                                                         <div className="w-6 text-right">
                                                            {opt.votes.length > 0 && <span className="text-[11px] font-bold text-text-muted">{opt.votes.length}</span>}
                                                         </div>
                                                     </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex items-center justify-between">
                                         <span className="text-[11px] font-bold text-text-muted">{msg.poll.options.reduce((sum, o) => sum + o.votes.length, 0)} votes</span>
                                         <button onClick={(e) => { e.stopPropagation(); setShowPollInfo(msg); }} className="text-[#008069] font-bold text-[12px] hover:underline">View votes</button>
                                    </div>
                                </div>
                            )}

                            {msg.audio && (
                                <div className="mb-1 w-[200px] md:w-[250px] relative">
                                    <audio controls src={getFileUrl(msg.audio)} className="w-full h-8" />
                                    {!msg.text && (
                                        <div className="flex justify-end items-center gap-1 mt-1 mr-1">
                                            {isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                            <span className="text-[9px] text-text-muted">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && getTickStatus(msg)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {msg.replyText && (
                                <div className="bg-black/5 dark:bg-white/5 border-l-4 border-green-600 p-1 mb-1 rounded text-[10px] text-text-secondary truncate opacity-80 mx-1">
                                    {msg.replyText}
                                </div>
                            )}

                            {msg.text && (
                                <div className="flex flex-wrap gap-x-2 items-end align-bottom px-1">
                                    <p className="text-sm leading-snug whitespace-pre-wrap break-words">
                                        <HighlightText text={msg.text} highlight={searchQuery} />
                                    </p>
                                    <div className="flex items-center gap-0.5 ml-auto opacity-60 h-3 mb-[1px]">
                                        {isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                        <span className="text-[9px] whitespace-nowrap">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && getTickStatus(msg)}
                                    </div>
                                </div>
                            )}

                            {msg.reactions && msg.reactions.length > 0 && (
                                <div className="absolute -bottom-2 right-0 bg-surface shadow-sm rounded-full px-1.5 py-0.5 flex gap-0.5 border border-border text-[10px] z-10">
                                    {msg.reactions.map((r, i) => {
                                        const isMyReaction = r.user === (currentUser.id || currentUser._id);
                                        return (
                                            <span key={i} className={`cursor-pointer hover:scale-125 transition ${isMyReaction ? "bg-blue-100 dark:bg-blue-900/50 rounded px-0.5" : ""}`} onClick={(e) => { e.stopPropagation(); if (isMyReaction) { Swal.fire({ title: 'Remove reaction?', icon: 'question', showCancelButton: true, confirmButtonText: 'Remove', confirmButtonColor: '#d33', heightAuto: false, width: '300px' }).then((res) => { if (res.isConfirmed) removeReaction(msg._id); }); } }}>{r.emoji}</span>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!selectionMode && !isDeleted && (
                    <div className={`absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col gap-1 ${isMe ? '-left-8 right-auto' : '-right-8'}`}>
                        <button className="p-1 rounded-full bg-surface shadow-sm hover:bg-background text-text-muted hover:text-text-primary transition-colors" onClick={(e) => { e.stopPropagation(); setShowReactionPicker(msg._id); setActiveMessageMenu(null); }}><Smile className="w-4 h-4" /></button>
                        <button className="p-1 rounded-full bg-surface shadow-sm hover:bg-background text-text-muted hover:text-text-primary transition-colors" onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg._id ? null : msg._id); setShowReactionPicker(null); }}><ChevronDown className="w-4 h-4" /></button>
                    </div>
                )}

                {showReactionPicker === msg._id && (
                    <div className={`absolute z-50 shadow-2xl ${isNearBottom ? 'bottom-8' : 'top-8'} ${isMe ? 'right-10' : 'left-10'} animate-in fade-in zoom-in-95 w-[320px] max-w-[85vw]`}>
                        <EmojiPicker onEmojiClick={(e) => reactToMessage(msg._id, e.emoji)} width="100%" searchDisabled />
                    </div>
                )}

                {activeMessageMenu === msg._id && (
                    <div className={`absolute z-50 w-56 bg-surface text-text-primary rounded-xl shadow-2xl py-2 border border-border 
                        ${isNearBottom ? 'bottom-8 origin-bottom' : 'top-8 origin-top'} 
                        ${isMe ? 'right-0 md:right-full md:mr-2' : 'left-0 md:left-full md:ml-2'} 
                        animate-in fade-in zoom-in-95 duration-100`}
                    >
                        {!isDeleted ? (
                            <>
                                <button onClick={() => { setReplyingTo(msg); setActiveMessageMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-background text-sm flex items-center gap-3 transition-colors">
                                    <Reply className="w-4 h-4 text-text-muted" /> {t('community.reply', { defaultValue: "Reply" })}
                                </button>

                                <button
                                    onClick={() => {
                                        setShowMessageInfo(msg);
                                        loadMembers();
                                        setShowGroupInfo(false);
                                        setActiveMessageMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-background text-sm flex items-center gap-3 transition-colors"
                                >
                                    <Info className="w-4 h-4 text-text-muted" /> {t('village.info', { defaultValue: "Info" })}
                                </button>

                                <button onClick={() => starMessage(msg._id)} className="w-full text-left px-4 py-2.5 hover:bg-background text-sm flex items-center gap-3 transition-colors">
                                    <Star className={`w-4 h-4 ${isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-text-muted'}`} /> {isStarred ? t('village.unstar', { defaultValue: 'Unstar' }) : t('village.star', { defaultValue: 'Star' })}
                                </button>

                                <button onClick={() => startSelection(msg._id)} className="w-full text-left px-4 py-2.5 hover:bg-background text-sm flex items-center gap-3 transition-colors">
                                    <CheckSquare className="w-4 h-4 text-text-muted" /> {t('village.select_msg', { defaultValue: "Select Message" })}
                                </button>

                                <div className="h-px bg-border my-1"></div>

                                <button onClick={() => handleDeleteSingle(msg)} className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 flex items-center gap-3 transition-colors">
                                    <Trash2 className="w-4 h-4" /> {t('common.delete', { defaultValue: "Delete" })}
                                </button>

                                <div className="flex justify-between px-4 py-2 border-t border-border bg-background gap-1 relative mt-1">
                                    {['👍', '❤️', '😂', '🙏', '😮'].map(emoji => (
                                        <span key={emoji} onClick={() => reactToMessage(msg._id, emoji)} className="cursor-pointer hover:scale-125 transition-transform text-lg">{emoji}</span>
                                    ))}
                                    <button onClick={(e) => { e.stopPropagation(); setShowReactionPicker(msg._id); }} className="bg-surface hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-1.5 transition-colors border border-border shadow-sm">
                                        <Plus className="w-3.5 h-3.5 text-text-secondary" />
                                    </button>
                                    {showReactionPicker === msg._id && (
                                        <div className="absolute top-12 -left-2 z-50 shadow-2xl animate-in slide-in-from-top-2 w-[320px] max-w-[80vw]">
                                            <EmojiPicker onEmojiClick={(e) => reactToMessage(msg._id, e.emoji)} width="100%" searchDisabled />
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <button onClick={() => handleDeleteSingle(msg)} className="w-full text-left px-4 py-2.5 hover:bg-background text-sm text-text-primary flex items-center gap-3 transition-colors">
                                <Trash2 className="w-4 h-4 text-text-muted" /> {t('village.delete_me', { defaultValue: "Delete for me" })}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
