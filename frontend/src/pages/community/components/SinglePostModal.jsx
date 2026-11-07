import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import api from '../../../utils/api';
import PostCard from './PostCard';

const SinglePostModal = ({
    postId,
    isOpen,
    onClose,
    currentUser,
    onPostUpdated,
    onPostDeleted,
    onOpenLightbox
}) => {
    const { t } = useTranslation();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !postId) return;

        let isMounted = true;
        const fetchPost = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'auth-token': token } : {};
                const res = await api.get(`/community/post/${postId}`, { headers });
                if (isMounted) {
                    setPost(res.data);
                }
            } catch (err) {
                console.error('Failed to load single post:', err);
                if (isMounted) {
                    setError('This post may have been deleted or is unavailable.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPost();

        return () => {
            isMounted = false;
        };
    }, [isOpen, postId]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-slate-100 dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 max-h-[92vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t('common.back', 'Back to Community Feed')}</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center">
                            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {t('common.loading', 'Loading community post...')}
                            </p>
                        </div>
                    ) : error ? (
                        <div className="min-h-[30vh] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                            <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                                {t('ui.error_title', 'Post Unavailable')}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
                                {error}
                            </p>
                            <button
                                onClick={onClose}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                            >
                                {t('common.back', 'Return to Feed')}
                            </button>
                        </div>
                    ) : post ? (
                        <PostCard
                            post={post}
                            currentUser={currentUser}
                            onPostUpdated={(updated) => {
                                setPost(updated);
                                if (onPostUpdated) onPostUpdated(updated);
                            }}
                            onPostDeleted={(deletedId) => {
                                if (onPostDeleted) onPostDeleted(deletedId);
                                onClose();
                            }}
                            onOpenLightbox={onOpenLightbox}
                            isDetailView={true}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default SinglePostModal;
