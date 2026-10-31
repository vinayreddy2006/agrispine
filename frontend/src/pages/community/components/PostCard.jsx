import React, { useState } from 'react';
import { 
    Heart, MessageSquare, Share2, MoreVertical, Trash2, Edit2, 
    Clock, MapPin, Send, CornerDownRight, Tag, HelpCircle, 
    Sparkles, ShieldCheck, Check, Flag, ChevronDown, ChevronUp, User 
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../utils/api';
import MediaCarousel from './MediaCarousel';
import ReportPostModal from './ReportPostModal';

// Helper: Relative time formatter
const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Recent';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHours = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSec < 60) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
        return 'Recent';
    }
};

const PostCard = ({
    post,
    currentUser,
    onPostUpdated,
    onPostDeleted,
    onOpenLightbox,
    onOpenSinglePost,
    isDetailView = false
}) => {
    const [isLiked, setIsLiked] = useState(
        currentUser ? (post.likes || []).some(id => String(id) === String(currentUser._id || currentUser.id)) : false
    );
    const [likesCount, setLikesCount] = useState(
        Array.isArray(post.likes) ? post.likes.length : (typeof post.likes === 'number' ? post.likes : 0)
    );
    const [likeLoading, setLikeLoading] = useState(false);

    // Comments & Replies state
    const [showComments, setShowComments] = useState(isDetailView);
    const [comments, setComments] = useState(Array.isArray(post.comments) ? post.comments : []);
    const [newCommentText, setNewCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // Nested reply state: { [commentId]: string }
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyTextMap, setReplyTextMap] = useState({});
    const [submittingReply, setSubmittingReply] = useState(false);

    // UI state
    const [showMenu, setShowMenu] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(isDetailView);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content || '');
    const [editTitle, setEditTitle] = useState(post.title || '');

    const currentUserId = currentUser?._id || currentUser?.id;
    const isAuthor = currentUserId && (
        (post.user?._id && String(post.user._id) === String(currentUserId)) ||
        (post.user && String(post.user) === String(currentUserId))
    );

    // Like / Unlike Post Handler
    const handleLikeToggle = async (e) => {
        e.stopPropagation();
        if (!currentUser) {
            Swal.fire('Please sign in', 'You need an account to like community posts.', 'info');
            return;
        }

        // Optimistic update
        const prevLiked = isLiked;
        const prevCount = likesCount;
        setIsLiked(!prevLiked);
        setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

        try {
            setLikeLoading(true);
            const token = localStorage.getItem('token');
            const res = await api.put(`/community/like/${post._id}`, {}, {
                headers: { 'auth-token': token }
            });
            if (res.data?.success) {
                setIsLiked(res.data.isLiked);
                setLikesCount(res.data.likesCount);
            }
        } catch (err) {
            // Revert on failure
            console.error('Like error:', err);
            setIsLiked(prevLiked);
            setLikesCount(prevCount);
        } finally {
            setLikeLoading(false);
        }
    };

    // Add Top-Level Comment Handler
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;

        try {
            setSubmittingComment(true);
            const token = localStorage.getItem('token');
            const res = await api.post(`/community/comment/${post._id}`, { text: newCommentText }, {
                headers: { 'auth-token': token }
            });

            setNewCommentText('');
            if (res.data && Array.isArray(res.data.comments)) {
                setComments(res.data.comments);
                if (onPostUpdated) onPostUpdated(res.data);
            }
        } catch (err) {
            console.error('Comment error:', err);
            Swal.fire('Error', 'Could not post comment.', 'error');
        } finally {
            setSubmittingComment(false);
        }
    };

    // Delete Comment Handler
    const handleDeleteComment = async (commentId) => {
        const confirm = await Swal.fire({
            title: 'Delete Comment?',
            text: 'Are you sure you want to remove this comment?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete'
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await api.delete(`/community/comment/${post._id}/${commentId}`, {
                headers: { 'auth-token': token }
            });

            if (res.data && Array.isArray(res.data.comments)) {
                setComments(res.data.comments);
                if (onPostUpdated) onPostUpdated(res.data);
            }
        } catch (err) {
            console.error('Delete comment error:', err);
            Swal.fire('Error', 'Could not delete comment.', 'error');
        }
    };

    // Add Nested Reply Handler
    const handleAddReply = async (commentId) => {
        const text = (replyTextMap[commentId] || '').trim();
        if (!text) return;

        try {
            setSubmittingReply(true);
            const token = localStorage.getItem('token');
            const res = await api.post(`/community/reply/${post._id}/${commentId}`, { text }, {
                headers: { 'auth-token': token }
            });

            setReplyTextMap(prev => ({ ...prev, [commentId]: '' }));
            setActiveReplyId(null);

            if (res.data && Array.isArray(res.data.comments)) {
                setComments(res.data.comments);
                if (onPostUpdated) onPostUpdated(res.data);
            }
        } catch (err) {
            console.error('Reply error:', err);
            Swal.fire('Error', 'Could not submit reply.', 'error');
        } finally {
            setSubmittingReply(false);
        }
    };

    // Delete Nested Reply Handler
    const handleDeleteReply = async (commentId, replyId) => {
        const confirm = await Swal.fire({
            title: 'Delete Reply?',
            text: 'Are you sure you want to remove this reply?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete'
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await api.delete(`/community/reply/${post._id}/${commentId}/${replyId}`, {
                headers: { 'auth-token': token }
            });

            if (res.data && Array.isArray(res.data.comments)) {
                setComments(res.data.comments);
                if (onPostUpdated) onPostUpdated(res.data);
            }
        } catch (err) {
            console.error('Delete reply error:', err);
            Swal.fire('Error', 'Could not delete reply.', 'error');
        }
    };

    // Like Comment Handler
    const handleLikeComment = async (commentId) => {
        if (!currentUser) return;
        try {
            const token = localStorage.getItem('token');
            const res = await api.put(`/community/like-comment/${post._id}/${commentId}`, {}, {
                headers: { 'auth-token': token }
            });
            if (res.data?.success) {
                setComments(prev => prev.map(c => {
                    if (c._id === commentId) {
                        return {
                            ...c,
                            isLiked: res.data.isLiked,
                            likesCount: res.data.likesCount
                        };
                    }
                    return c;
                }));
            }
        } catch (err) {
            console.error('Like comment error:', err);
        }
    };

    // Like Reply Handler
    const handleLikeReply = async (commentId, replyId) => {
        if (!currentUser) return;
        try {
            const token = localStorage.getItem('token');
            const res = await api.put(`/community/like-reply/${post._id}/${commentId}/${replyId}`, {}, {
                headers: { 'auth-token': token }
            });
            if (res.data?.success) {
                setComments(prev => prev.map(c => {
                    if (c._id === commentId) {
                        return {
                            ...c,
                            replies: (c.replies || []).map(r => {
                                if (r._id === replyId) {
                                    return {
                                        ...r,
                                        isLiked: res.data.isLiked,
                                        likesCount: res.data.likesCount
                                    };
                                }
                                return r;
                            })
                        };
                    }
                    return c;
                }));
            }
        } catch (err) {
            console.error('Like reply error:', err);
        }
    };

    // Delete Entire Post Handler
    const handleDeletePost = async () => {
        setShowMenu(false);
        const confirm = await Swal.fire({
            title: 'Delete this Post?',
            text: 'This will permanently remove the post and its discussions.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete permanently'
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            await api.delete(`/community/post/${post._id}`, {
                headers: { 'auth-token': token }
            });

            Swal.fire({
                title: 'Deleted!',
                text: 'Your post was removed.',
                icon: 'success',
                timer: 1200,
                showConfirmButton: false
            });

            if (onPostDeleted) onPostDeleted(post._id);
        } catch (err) {
            console.error('Delete post error:', err);
            Swal.fire('Error', 'Could not delete post.', 'error');
        }
    };

    // Save Edited Post Handler
    const handleSaveEdit = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.put(`/community/post/${post._id}`, {
                title: editTitle,
                content: editContent
            }, {
                headers: { 'auth-token': token }
            });

            setIsEditing(false);
            if (onPostUpdated) onPostUpdated(res.data);
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Post updated',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Update post error:', err);
            Swal.fire('Error', 'Could not update post.', 'error');
        }
    };

    // Share Post Link
    const handleShare = (e) => {
        e.stopPropagation();
        const url = `${window.location.origin}/community?post=${post._id}`;
        navigator.clipboard.writeText(url);
        Swal.fire({
            toast: true,
            position: 'bottom',
            icon: 'success',
            title: 'Link copied to clipboard!',
            showConfirmButton: false,
            timer: 2000
        });
    };

    // Calculate total replies count
    const totalDiscussions = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

    const hasMedia = Array.isArray(post.media) && post.media.length > 0;
    const authorName = post.user?.name || "Farmer";
    const authorLocation = [post.user?.village, post.user?.district].filter(Boolean).join(', ');
    const isLongText = (post.content || '').length > 280;

    // Handle full card click (LinkedIn style feed navigation)
    const handleCardClick = (e) => {
        if (isDetailView) return;
        // Don't trigger if user is highlighting text with mouse
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            return;
        }
        if (onOpenSinglePost) {
            onOpenSinglePost(post._id);
        }
    };

    // Keyboard accessibility for full card click
    const handleKeyDown = (e) => {
        if (isDetailView) return;
        if (e.key === 'Enter' || e.key === ' ') {
            if (e.target === e.currentTarget) {
                e.preventDefault();
                onOpenSinglePost && onOpenSinglePost(post._id);
            }
        }
    };

    return (
        <article 
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            tabIndex={!isDetailView ? 0 : undefined}
            role={!isDetailView ? "button" : "article"}
            aria-label={!isDetailView ? `View post by ${authorName}` : undefined}
            className={`bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition-all duration-200 overflow-hidden ${
                !isDetailView 
                    ? 'cursor-pointer hover:shadow-md hover:border-emerald-300/80 dark:hover:border-emerald-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40' 
                    : ''
            }`}
        >
            
            {/* Post Header (LinkedIn Style) */}
            <div className="p-5 sm:p-6 pb-3">
                <div className="flex items-start justify-between gap-3">
                    
                    {/* Author Info */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/20 bg-slate-100 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                            {post.user?.profileImage ? (
                                <img
                                    src={post.user.profileImage}
                                    alt={authorName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-base text-emerald-700 dark:text-emerald-400 font-bold">
                                    {authorName[0]?.toUpperCase() || 'F'}
                                </span>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                                    {authorName}
                                </h3>
                                {isAuthor && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        You
                                    </span>
                                )}
                                {post.user?.userType && (
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase">
                                        {post.user.userType}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {formatRelativeTime(post.createdAt)}
                                </span>
                                {authorLocation && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                            {authorLocation}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Category Pill & More Menu */}
                    <div className="flex items-center gap-2 relative">
                        {post.category && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hidden sm:inline-flex">
                                {post.category}
                            </span>
                        )}

                        {post.postType && post.postType !== 'general' && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 capitalize hidden sm:inline-flex">
                                {post.postType}
                            </span>
                        )}

                        {/* More Options Dropdown */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(prev => !prev);
                                }}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                title="More options"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>

                            {showMenu && (
                                <div 
                                    className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {isAuthor ? (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenu(false);
                                                    setIsEditing(true);
                                                }}
                                                className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                            >
                                                <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                                Edit Post
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeletePost();
                                                }}
                                                className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                Delete Post
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(false);
                                                if (!currentUser) {
                                                    Swal.fire('Login Required', 'Please log in to report a post for administrator review.', 'info');
                                                    return;
                                                }
                                                setReportModalOpen(true);
                                            }}
                                            className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                        >
                                            <Flag className="w-3.5 h-3.5 text-amber-500" />
                                            Report Post
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Badges */}
                <div className="flex sm:hidden items-center gap-1.5 mt-2">
                    {post.category && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {post.category}
                        </span>
                    )}
                    {post.postType && post.postType !== 'general' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 capitalize">
                            {post.postType}
                        </span>
                    )}
                </div>
            </div>

            {/* Post Content Body */}
            <div className="px-5 sm:px-6 pb-2">
                {isEditing ? (
                    <div className="space-y-3 mb-3" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Title..."
                            className="w-full px-3 py-2 border rounded-xl font-bold text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                        <textarea
                            rows={3}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Title */}
                        {post.title && (
                            <h2 
                                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition leading-snug"
                            >
                                {post.title}
                            </h2>
                        )}

                        {/* Content */}
                        {post.content && (
                            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                                {isExpanded || !isLongText ? (
                                    post.content
                                ) : (
                                    <>
                                        {post.content.slice(0, 260)}...
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsExpanded(true);
                                            }}
                                            className="ml-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                                        >
                                            Read more
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Media Carousel (Instagram Style) */}
            {hasMedia && (
                <div className="px-5 sm:px-6">
                    <MediaCarousel
                        media={post.media}
                        onMediaClick={(idx) => {
                            if (!isDetailView && onOpenSinglePost) {
                                onOpenSinglePost(post._id);
                            } else if (onOpenLightbox) {
                                onOpenLightbox(post.media, idx);
                            }
                        }}
                        onOpenLightbox={(idx) => onOpenLightbox && onOpenLightbox(post.media, idx)}
                        altTitle={post.title || authorName}
                    />
                </div>
            )}

            {/* Engagement Stats Bar */}
            <div className="px-5 sm:px-6 py-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5">
                    {likesCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-[10px]">
                                ❤️
                            </span>
                            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isDetailView && onOpenSinglePost) {
                                onOpenSinglePost(post._id);
                            } else {
                                setShowComments(prev => !prev);
                            }
                        }}
                        className="hover:text-slate-800 dark:hover:text-slate-200 transition"
                    >
                        {totalDiscussions} {totalDiscussions === 1 ? 'discussion' : 'discussions'}
                    </button>
                </div>
            </div>

            {/* Action Buttons Bar (LinkedIn Inspired) */}
            <div 
                onClick={(e) => e.stopPropagation()}
                className="px-3 sm:px-6 py-1.5 flex items-center justify-around bg-slate-50/50 dark:bg-slate-800/40"
            >
                {/* Like Button */}
                <button
                    onClick={handleLikeToggle}
                    disabled={likeLoading}
                    className={`flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition flex-1 hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                        isLiked 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-slate-600 dark:text-slate-300'
                    }`}
                >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isLiked ? 'fill-current scale-110 text-emerald-600' : ''}`} />
                    <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>

                {/* Comment Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isDetailView && onOpenSinglePost) {
                            onOpenSinglePost(post._id);
                        } else {
                            setShowComments(prev => !prev);
                        }
                    }}
                    className="flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition flex-1"
                >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                    <span>Discuss</span>
                </button>

                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition flex-1"
                >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                    <span>Share</span>
                </button>
            </div>

            {/* Comments & Discussions Thread */}
            {showComments && (
                <div 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-50/70 dark:bg-slate-900/40 p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/80 animate-in slide-in-from-top-1 duration-200"
                >
                    
                    {/* Add Comment Input */}
                    <form onSubmit={handleAddComment} className="flex gap-2.5 mb-5 items-start">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                placeholder="Add your agricultural advice or reply..."
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                                type="submit"
                                disabled={submittingComment || !newCommentText.trim()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>Post</span>
                            </button>
                        </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-4">
                        {comments.length === 0 ? (
                            <p className="text-center text-xs text-slate-400 italic py-3">
                                No discussions yet. Share your experience or advice first!
                            </p>
                        ) : (
                            comments.map((comment) => {
                                const isCommentAuthor = currentUserId && (
                                    (comment.user?._id && String(comment.user._id) === String(currentUserId)) ||
                                    (comment.user && String(comment.user) === String(currentUserId))
                                );
                                const cLikesCount = Array.isArray(comment.likes) ? comment.likes.length : (comment.likesCount || 0);
                                const isCLiked = comment.isLiked || (currentUser && Array.isArray(comment.likes) && comment.likes.some(id => String(id) === String(currentUserId)));
                                const commentReplies = Array.isArray(comment.replies) ? comment.replies : [];

                                return (
                                    <div key={comment._id} className="space-y-2">
                                        
                                        {/* Comment Bubble */}
                                        <div className="flex items-start gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden">
                                                {comment.profileImage ? (
                                                    <img src={comment.profileImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    (comment.name || "U")[0]?.toUpperCase()
                                                )}
                                            </div>

                                            <div className="flex-1 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                                                            {comment.name || "Farmer"}
                                                        </span>
                                                        {isCommentAuthor && (
                                                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                                                                You
                                                            </span>
                                                        )}
                                                        {comment.village && (
                                                            <span className="text-[10px] text-slate-400">
                                                                • {comment.village}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <span className="text-[10px] text-slate-400">
                                                        {formatRelativeTime(comment.createdAt)}
                                                    </span>
                                                </div>

                                                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                                    {comment.text}
                                                </p>

                                                {/* Comment Actions (Like & Reply) */}
                                                <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-slate-500">
                                                    <button
                                                        onClick={() => handleLikeComment(comment._id)}
                                                        className={`flex items-center gap-1 hover:text-emerald-600 transition ${isCLiked ? 'text-emerald-600' : ''}`}
                                                    >
                                                        <Heart className={`w-3.5 h-3.5 ${isCLiked ? 'fill-current' : ''}`} />
                                                        <span>{cLikesCount > 0 ? cLikesCount : 'Like'}</span>
                                                    </button>

                                                    <button
                                                        onClick={() => setActiveReplyId(prev => (prev === comment._id ? null : comment._id))}
                                                        className="hover:text-emerald-600 transition flex items-center gap-1"
                                                    >
                                                        <CornerDownRight className="w-3.5 h-3.5" />
                                                        <span>Reply</span>
                                                    </button>

                                                    {(isCommentAuthor || isAuthor) && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment._id)}
                                                            className="text-red-500 hover:text-red-700 transition ml-auto"
                                                            title="Delete comment"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nested Replies Thread */}
                                        {commentReplies.length > 0 && (
                                            <div className="pl-10 space-y-2 border-l-2 border-emerald-500/30 ml-4">
                                                {commentReplies.map((reply) => {
                                                    const isReplyAuthor = currentUserId && (
                                                        (reply.user?._id && String(reply.user._id) === String(currentUserId)) ||
                                                        (reply.user && String(reply.user) === String(currentUserId))
                                                    );
                                                    const rLikes = reply.likesCount || (Array.isArray(reply.likes) ? reply.likes.length : 0);
                                                    const isRLiked = reply.isLiked || (currentUser && Array.isArray(reply.likes) && reply.likes.some(id => String(id) === String(currentUserId)));

                                                    return (
                                                        <div key={reply._id} className="flex items-start gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                                                {(reply.name || "U")[0]?.toUpperCase()}
                                                            </div>

                                                            <div className="flex-1 bg-white dark:bg-slate-800/90 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                                                                            {reply.name || "Farmer"}
                                                                        </span>
                                                                        {isReplyAuthor && (
                                                                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                                                                                You
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[9px] text-slate-400">
                                                                        {formatRelativeTime(reply.createdAt)}
                                                                    </span>
                                                                </div>

                                                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                                                                    {reply.text}
                                                                </p>

                                                                <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-500">
                                                                    <button
                                                                        onClick={() => handleLikeReply(comment._id, reply._id)}
                                                                        className={`flex items-center gap-1 hover:text-emerald-600 transition ${isRLiked ? 'text-emerald-600' : ''}`}
                                                                    >
                                                                        <Heart className={`w-3 h-3 ${isRLiked ? 'fill-current' : ''}`} />
                                                                        <span>{rLikes > 0 ? rLikes : 'Like'}</span>
                                                                    </button>

                                                                    {(isReplyAuthor || isAuthor) && (
                                                                        <button
                                                                            onClick={() => handleDeleteReply(comment._id, reply._id)}
                                                                            className="text-red-500 hover:text-red-700 transition ml-auto"
                                                                            title="Delete reply"
                                                                        >
                                                                            <Trash2 className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Reply Input Box (when Reply button is active) */}
                                        {activeReplyId === comment._id && (
                                            <div className="pl-10 mt-2 flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder={`Reply to ${comment.name || 'farmer'}...`}
                                                    value={replyTextMap[comment._id] || ''}
                                                    onChange={(e) => setReplyTextMap(prev => ({ ...prev, [comment._id]: e.target.value }))}
                                                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleAddReply(comment._id)}
                                                    disabled={submittingReply || !(replyTextMap[comment._id] || '').trim()}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition"
                                                >
                                                    Reply
                                                </button>
                                                <button
                                                    onClick={() => setActiveReplyId(null)}
                                                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>
            )}

            {/* Report Post Modal */}
            <ReportPostModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                postId={post._id}
                postTitle={post.title}
            />

        </article>
    );
};

export default PostCard;
