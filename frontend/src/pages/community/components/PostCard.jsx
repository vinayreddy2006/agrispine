import React from 'react';
import { User, Clock, MessageCircle, ChevronUp, ChevronDown, Send } from 'lucide-react';
import Card from '../../../components/ui/Card';

const PostCard = ({
    post,
    currentUser,
    expandedPosts,
    toggleReplies,
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
    handleReplySubmit,
    formatDate,
    t
}) => {
    const isOwner = currentUser && (
        (post.user?._id && String(post.user._id) === String(currentUser._id || currentUser.id)) ||
        (post.user && String(post.user) === String(currentUser._id || currentUser.id))
    );

    return (
        <Card className="mb-6 hover:shadow-md transition duration-200 bg-surface dark:bg-gray-800 border-border dark:border-gray-700">
            {/* Post Header */}
            <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border border-border dark:border-gray-600">
                        {post.user?.profileImage ? (
                            <img
                                src={post.user.profileImage}
                                alt={post.user.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold">
                                {post.user?.name ? post.user.name[0].toUpperCase() : <User className="w-5 h-5" />}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary dark:text-white leading-tight">
                            {post.user?.name || "Farmer"}
                            {isOwner && <span className="ml-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded-full">YOU</span>}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-text-muted dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(post.createdAt)}</span>
                            {post.user?.village && <span>• {post.user.village}</span>}
                        </div>
                    </div>
                </div>

                <h2 className="text-lg font-bold text-text-primary dark:text-white mb-2">{post.title}</h2>
                <p className="text-text-secondary dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line">{post.content}</p>
            </div>

            {/* Actions Bar */}
            <div className="bg-background dark:bg-gray-900/50 px-6 py-3 border-t border-border dark:border-gray-700 flex items-center justify-between">
                <button
                    onClick={() => toggleReplies(post._id)}
                    className="flex items-center gap-2 text-sm font-medium text-text-secondary dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-400 transition"
                >
                    <MessageCircle className="w-4 h-4" />
                    {post.replies.length} {t('community.replies', { defaultValue: "Replies" })}
                    {expandedPosts[post._id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <button
                    onClick={() => {
                        setExpandedPosts(prev => ({ ...prev, [post._id]: true }));
                        setReplyingTo(post._id);
                    }}
                    className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                >
                    {t('community.reply')}
                </button>
            </div>

            {/* Replies Section */}
            {expandedPosts[post._id] && (
                <div className="bg-background dark:bg-gray-900/50 px-6 pb-6 pt-2 border-t border-border dark:border-gray-700 animate-in slide-in-from-top-2">
                    <div className="space-y-4 mb-4">
                        {post.replies.length === 0 ? (
                            <p className="text-center text-xs text-text-muted dark:text-gray-500 italic py-2">{t('community.no_replies_yet', { defaultValue: "No replies yet. Be the first!" })}</p>
                        ) : (
                            post.replies.map((reply, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-surface dark:bg-gray-800 border border-border dark:border-gray-600 flex items-center justify-center text-xs font-bold text-text-muted dark:text-gray-400 flex-shrink-0">
                                        {reply.name ? reply.name[0] : "U"}
                                    </div>
                                    <div className="bg-surface dark:bg-gray-800 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm border border-border dark:border-gray-700 flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-sm text-text-primary dark:text-gray-200">
                                                {reply.name}
                                                {currentUser && String(reply.user) === String(currentUser._id || currentUser.id) &&
                                                    <span className="ml-2 text-purple-600 dark:text-purple-400 text-[10px]">(You)</span>
                                                }
                                            </span>
                                            <span className="text-[10px] text-text-muted dark:text-gray-500">{formatDate(reply.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-text-secondary dark:text-gray-300">{reply.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex gap-2 items-center">
                        <input
                            placeholder={t('community.write_reply', { defaultValue: "Write a helpful reply..." })}
                            className="flex-1 px-4 py-2 rounded-full border border-border dark:border-gray-600 bg-surface dark:bg-gray-800 text-text-primary dark:text-white text-sm focus:outline-none focus:border-purple-500 shadow-sm"
                            value={replyingTo === post._id ? replyText : ""}
                            onChange={(e) => {
                                setReplyingTo(post._id);
                                setReplyText(e.target.value);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(post._id)}
                        />
                        <button
                            onClick={() => handleReplySubmit(post._id)}
                            disabled={!replyText.trim() || replyingTo !== post._id}
                            className={`p-2 rounded-full transition ${replyText.trim() && replyingTo === post._id ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md' : 'bg-surface border border-border dark:bg-gray-800 text-text-muted dark:text-gray-500 cursor-not-allowed'}`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default PostCard;
