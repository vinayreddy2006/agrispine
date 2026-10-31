import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Users, Plus, Search, Filter, Sparkles, HelpCircle,
    Image as ImageIcon, Video, BookOpen, MessageSquare,
    TrendingUp, RefreshCw, AlertTriangle, ShieldCheck,
    CheckCircle, CloudSun, DollarSign, Stethoscope,
    Calendar, ArrowRight, ArrowLeft, User as UserIcon, X, Tag, ChevronDown
} from 'lucide-react';
import api from '../../utils/api';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import NoSearchResults from '../../components/ui/NoSearchResults';
import { PostSkeleton } from '../../components/ui/LoadingSkeleton';
import PostCard from './components/PostCard';
import CreatePostModal from './components/CreatePostModal';
import MediaLightbox from './components/MediaLightbox';

const CATEGORIES = [
    'All',
    'Crop Management',
    'Pest & Disease',
    'Irrigation',
    'Fertilizers',
    'Weather',
    'Equipment',
    'Market Prices',
    'Others'
 ];

const Community = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Data State
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // Filter & Search State
    // activeTab: 'all' | 'my_posts' | 'my_discussions'
    const [activeTab, setActiveTab] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedType, setSelectedType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'popular'
    const [showTips, setShowTips] = useState(true);

    // Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createModalType, setCreateModalType] = useState('general');

    // Single Post Deep Link / Inline View State
    const urlPostId = searchParams.get('post');
    const [selectedPostId, setSelectedPostId] = useState(urlPostId || null);
    const [singlePost, setSinglePost] = useState(null);
    const [singlePostLoading, setSinglePostLoading] = useState(false);
    const [singlePostError, setSinglePostError] = useState(null);

    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxMedia, setLightboxMedia] = useState([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Load User and Initial Posts
    const fetchPosts = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setErrorMessage(null);

        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'auth-token': token } : {};

            const res = await api.get('/community/fetchall', { headers });
            if (Array.isArray(res.data)) {
                setPosts(res.data);
            } else {
                setPosts([]);
            }
        } catch (err) {
            console.error('Failed to load posts:', err);
            setErrorMessage(err.response?.data?.message || 'Could not load community feed. Please check your network connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        // Load logged in user
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {
                console.error('Error parsing user from localStorage:', e);
            }
        }

        fetchPosts();
    }, [fetchPosts]);

    // Sync URL param if changed
    useEffect(() => {
        if (urlPostId) {
            setSelectedPostId(urlPostId);
        } else {
            setSelectedPostId(null);
        }
    }, [urlPostId]);

    // Fetch single post details when selectedPostId changes
    useEffect(() => {
        if (!selectedPostId) {
            setSinglePost(null);
            setSinglePostError(null);
            return;
        }

        const existing = posts.find(p => p._id === selectedPostId);
        if (existing) {
            setSinglePost(existing);
        }

        let isMounted = true;
        const fetchSinglePost = async () => {
            if (!existing) setSinglePostLoading(true);
            setSinglePostError(null);
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'auth-token': token } : {};
                const res = await api.get(`/community/post/${selectedPostId}`, { headers });
                if (isMounted && res.data) {
                    setSinglePost(res.data);
                }
            } catch (err) {
                console.error('Failed to load single post:', err);
                if (isMounted && !existing) {
                    setSinglePostError(err.response?.data?.message || 'This post could not be found or may have been removed.');
                }
            } finally {
                if (isMounted) setSinglePostLoading(false);
            }
        };

        fetchSinglePost();

        return () => {
            isMounted = false;
        };
    }, [selectedPostId, posts]);

    // Handle open single post and update URL query
    const handleOpenSinglePost = (postId) => {
        setSelectedPostId(postId);
        setSearchParams({ post: postId });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle back to feed
    const handleCloseSinglePost = () => {
        setSelectedPostId(null);
        setSinglePost(null);
        setSinglePostError(null);
        searchParams.delete('post');
        setSearchParams(searchParams);
    };

    // Open Lightbox
    const handleOpenLightbox = (media, index = 0) => {
        setLightboxMedia(media);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    // Post Updated in list
    const handlePostUpdated = (updatedPost) => {
        setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    };

    // Post Deleted from list
    const handlePostDeleted = (deletedId) => {
        setPosts(prev => prev.filter(p => p._id !== deletedId));
    };

    // Post Created callback
    const handlePostCreated = (newPost) => {
        setPosts(prev => [newPost, ...prev]);
        setActiveTab('all');
    };

    // Safe filtered posts calculation
    const myId = currentUser?._id ? String(currentUser._id) : (currentUser?.id ? String(currentUser.id) : null);

    const filteredPosts = useMemo(() => {
        if (!Array.isArray(posts)) return [];

        let list = [...posts];

        // 1. Tab Filtering (Scenario A & B: Renamed sections & safe filtering)
        if (activeTab === 'my_posts') {
            if (!myId) return [];
            list = list.filter(post => {
                const authorId = post.user?._id ? String(post.user._id) : (post.user ? String(post.user) : null);
                return authorId === myId;
            });
        } else if (activeTab === 'my_discussions') {
            if (!myId) return [];
            list = list.filter(post => {
                const hasComment = (post.comments || []).some(c => {
                    const cAuthor = c.user?._id ? String(c.user._id) : String(c.user);
                    const hasReply = (c.replies || []).some(r => {
                        const rAuthor = r.user?._id ? String(r.user._id) : String(r.user);
                        return rAuthor === myId;
                    });
                    return cAuthor === myId || hasReply;
                });
                const hasLegacyReply = (post.replies || []).some(r => {
                    const rAuthor = r.user?._id ? String(r.user._id) : String(r.user);
                    return rAuthor === myId;
                });
                return hasComment || hasLegacyReply;
            });
        }

        // 2. Category Filter
        if (selectedCategory && selectedCategory !== 'All') {
            list = list.filter(post => post.category === selectedCategory);
        }

        // 3. Post Type Filter
        if (selectedType && selectedType !== 'all') {
            list = list.filter(post => post.postType === selectedType);
        }

        // 4. Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(post => 
                (post.title || '').toLowerCase().includes(q) ||
                (post.content || '').toLowerCase().includes(q) ||
                (post.user?.name || '').toLowerCase().includes(q) ||
                (post.category || '').toLowerCase().includes(q)
            );
        }

        // 5. Sort
        if (sortBy === 'popular') {
            list.sort((a, b) => {
                const aEng = (a.likesCount || (a.likes?.length || 0)) + (a.comments?.length || 0);
                const bEng = (b.likesCount || (b.likes?.length || 0)) + (b.comments?.length || 0);
                return bEng - aEng;
            });
        } else {
            // Newest first (default)
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return list;
    }, [posts, activeTab, selectedCategory, selectedType, searchQuery, sortBy, myId]);

    // User statistics
    const myPostsCount = useMemo(() => {
        if (!myId || !Array.isArray(posts)) return 0;
        return posts.filter(p => {
            const authorId = p.user?._id ? String(p.user._id) : (p.user ? String(p.user) : null);
            return authorId === myId;
        }).length;
    }, [posts, myId]);

    const myDiscussionsCount = useMemo(() => {
        if (!myId || !Array.isArray(posts)) return 0;
        return posts.filter(p => {
            const hasComment = (p.comments || []).some(c => {
                const cAuthor = c.user?._id ? String(c.user._id) : String(c.user);
                const hasReply = (c.replies || []).some(r => {
                    const rAuthor = r.user?._id ? String(r.user._id) : String(r.user);
                    return rAuthor === myId;
                });
                return cAuthor === myId || hasReply;
            });
            return hasComment;
        }).length;
    }, [posts, myId]);

    return (
        <div className="w-full bg-slate-50/50 dark:bg-slate-950 min-h-screen pb-32">
            
            {/* Top Navigation Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <PageHeader
                    title="Farmers Forum"
                    subtitle="Connect, share crop experiences, ask questions & learn with progressive farmers"
                />
            </div>

            {/* Main Community Grid (LinkedIn Inspired 3-Column Layout) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* ============================================================== */}
                    {/* LEFT SIDEBAR (Desktop): Farmer Profile & Navigation Filters     */}
                    {/* ============================================================== */}
                    <aside className="lg:col-span-4 xl:col-span-3 space-y-5">
                        
                        {/* Profile Summary Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm text-center overflow-hidden relative">
                            {/* Decorative Cover Gradient */}
                            <div className="h-16 -mx-5 -mt-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700"></div>

                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xl flex items-center justify-center mx-auto -mt-9 shadow-md overflow-hidden">
                                {currentUser?.profileImage ? (
                                    <img src={currentUser.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    currentUser?.name ? currentUser.name[0].toUpperCase() : <UserIcon className="w-7 h-7" />
                                )}
                            </div>

                            <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">
                                {currentUser?.name || 'Welcome, Farmer'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                {currentUser?.userType || 'Farmer'} {currentUser?.village ? `• ${currentUser.village}` : ''}
                            </p>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/70 text-left">
                                <button
                                    onClick={() => setActiveTab('my_posts')}
                                    className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                                >
                                    <span className="text-xs text-slate-400 block font-medium">My Posts</span>
                                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                        {myPostsCount}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('my_discussions')}
                                    className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                                >
                                    <span className="text-xs text-slate-400 block font-medium">Activity</span>
                                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                                        {myDiscussionsCount}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Community Navigation Pills */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-3 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`w-full px-4 py-3 rounded-2xl text-left text-xs sm:text-sm font-bold flex items-center justify-between transition ${
                                    activeTab === 'all'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <Sparkles className="w-4 h-4 text-emerald-600" />
                                    Community Feed
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                                    {posts.length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('my_posts')}
                                className={`w-full px-4 py-3 rounded-2xl text-left text-xs sm:text-sm font-bold flex items-center justify-between transition ${
                                    activeTab === 'my_posts'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <BookOpen className="w-4 h-4 text-emerald-600" />
                                    My Posts
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                                    {myPostsCount}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('my_discussions')}
                                className={`w-full px-4 py-3 rounded-2xl text-left text-xs sm:text-sm font-bold flex items-center justify-between transition ${
                                    activeTab === 'my_discussions'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                                    My Discussions
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                                    {myDiscussionsCount}
                                </span>
                            </button>
                        </div>

                        {/* Quick Topic Filters */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hidden lg:block">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                Browse by Topic
                            </h4>
                            <div className="space-y-1">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`w-full px-3 py-1.5 rounded-xl text-left text-xs font-medium transition flex items-center justify-between ${
                                            selectedCategory === cat
                                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <span>{cat}</span>
                                        {cat !== 'All' && (
                                            <span className="text-[10px] text-slate-400">
                                                {posts.filter(p => p.category === cat).length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </aside>

                    {/* ============================================================== */}
                    {/* CENTER FEED: Create Post, Search, Filters, Tips, and Feed      */}
                    {/* ============================================================== */}
                    <main className="lg:col-span-8 xl:col-span-9 space-y-5">
                        
                        {selectedPostId ? (
                            /* ====================================================== */
                            /* INLINE SINGLE POST VIEW (LinkedIn Inspired)            */
                            /* ====================================================== */
                            <div className="space-y-4">
                                {/* Back Navigation Bar */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl px-5 py-3.5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
                                    <button
                                        onClick={handleCloseSinglePost}
                                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                                    >
                                        <ArrowLeft className="w-4 h-4 text-emerald-600" />
                                        <span>Back to Community Feed</span>
                                    </button>
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                                        Post Discussion
                                    </span>
                                </div>

                                {singlePostLoading && !singlePost ? (
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 animate-pulse space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                        <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                                    </div>
                                ) : singlePostError ? (
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-sm text-center">
                                        <EmptyState
                                            icon={AlertTriangle}
                                            title="Post Not Found"
                                            description={singlePostError}
                                            actionText="Back to Community Feed"
                                            onAction={handleCloseSinglePost}
                                        />
                                    </div>
                                ) : singlePost ? (
                                    <PostCard
                                        key={singlePost._id}
                                        post={singlePost}
                                        currentUser={currentUser}
                                        onPostUpdated={(updated) => {
                                            setSinglePost(updated);
                                            handlePostUpdated(updated);
                                        }}
                                        onPostDeleted={(deletedId) => {
                                            handlePostDeleted(deletedId);
                                            handleCloseSinglePost();
                                        }}
                                        onOpenLightbox={handleOpenLightbox}
                                        onOpenSinglePost={() => {}}
                                        isDetailView={true}
                                    />
                                ) : null}
                            </div>
                        ) : (
                            /* ====================================================== */
                            /* FULL COMMUNITY FEED                                    */
                            /* ====================================================== */
                            <>
                                {/* 1. Create Post Box (LinkedIn Inspired) */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center flex-shrink-0">
                                            {currentUser?.name ? currentUser.name[0].toUpperCase() : 'F'}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setCreateModalType('general');
                                                setCreateModalOpen(true);
                                            }}
                                            className="flex-1 text-left px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium transition"
                                        >
                                            What would you like to share with the community?
                                        </button>
                                    </div>

                                    {/* Quick Action Chips */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                                        <button
                                            onClick={() => {
                                                setCreateModalType('general');
                                                setCreateModalOpen(true);
                                            }}
                                            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                                        >
                                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                                            <span>Photo</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setCreateModalType('general');
                                                setCreateModalOpen(true);
                                            }}
                                            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                                        >
                                            <Video className="w-4 h-4 text-blue-600" />
                                            <span>Video</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setCreateModalType('question');
                                                setCreateModalOpen(true);
                                            }}
                                            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                                        >
                                            <HelpCircle className="w-4 h-4 text-amber-500" />
                                            <span>Ask Question</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setCreateModalType('experience');
                                                setCreateModalOpen(true);
                                            }}
                                            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                                        >
                                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                                            <span>Experience</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Search & Filter Bar */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 relative">
                                            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0" />
                                            <input
                                                type="text"
                                                placeholder="Search discussions, crop issues, authors..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full !pl-11 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Sort Selector */}
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="newest">Latest</option>
                                            <option value="popular">Most Popular</option>
                                        </select>

                                        {/* Refresh */}
                                        <button
                                            onClick={() => fetchPosts(true)}
                                            disabled={refreshing}
                                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                            title="Refresh Feed"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
                                        </button>
                                    </div>

                                    {/* Category Filter Pills (Horizontal Scrollable) */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 text-xs">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`px-3 py-1.5 rounded-full whitespace-nowrap font-bold transition ${
                                                    selectedCategory === cat
                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Farming Community Tips (Compact & Collapsible Banner) */}
                                <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 rounded-3xl p-3.5 sm:p-4 border border-emerald-200/70 dark:border-emerald-800/60 shadow-xs">
                                    <div 
                                        className="flex items-center justify-between cursor-pointer select-none" 
                                        onClick={() => setShowTips(prev => !prev)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { 
                                            if (e.key === 'Enter' || e.key === ' ') { 
                                                e.preventDefault(); 
                                                setShowTips(prev => !prev); 
                                            } 
                                        }}
                                        aria-expanded={showTips}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                                                <ShieldCheck className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    Farming Community Tips
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                                        Posting Advice
                                                    </span>
                                                </h4>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                                                    Quick guidelines to get verified answers and share agricultural insights
                                                </p>
                                            </div>
                                        </div>

                                        <button 
                                            type="button"
                                            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-emerald-100/60 dark:hover:bg-slate-800 transition"
                                            aria-label="Toggle community tips"
                                        >
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showTips ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>

                                    {showTips && (
                                        <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/50 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs animate-in fade-in duration-200">
                                            <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-2xs">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-slate-700 dark:text-slate-300 leading-snug">
                                                    <strong className="text-slate-900 dark:text-white block font-semibold">Clear Photos:</strong>
                                                    Upload upper & lower leaf views for pest diagnosis.
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-2xs">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-slate-700 dark:text-slate-300 leading-snug">
                                                    <strong className="text-slate-900 dark:text-white block font-semibold">Specific Details:</strong>
                                                    Mention crop variety, sowing date, and district.
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-2xs">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-slate-700 dark:text-slate-300 leading-snug">
                                                    <strong className="text-slate-900 dark:text-white block font-semibold">Mutual Support:</strong>
                                                    Like verified solutions and share seasonal tips.
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Error Alert Box with Retry (GUARANTEES NO BLANK SCREEN) */}
                                {errorMessage && (
                                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-3xl p-4 flex items-center justify-between gap-4 text-red-700 dark:text-red-300 text-sm animate-in fade-in">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
                                            <div>
                                                <p className="font-bold">Failed to load feed</p>
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{errorMessage}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => fetchPosts()}
                                            className="px-3.5 py-1.5 bg-red-100 dark:bg-red-900/60 hover:bg-red-200 text-red-800 dark:text-red-200 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-xs"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}

                                {/* 3. Post Feed List */}
                                {loading ? (
                                    <PostSkeleton count={3} />
                                ) : errorMessage ? (
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                                        <ErrorState
                                            title="Failed to Load Community Feed"
                                            message={errorMessage}
                                            onRetry={() => fetchPosts()}
                                        />
                                    </div>
                                ) : filteredPosts.length === 0 ? (
                                    searchQuery ? (
                                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                                            <NoSearchResults
                                                query={searchQuery}
                                                onClear={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                                                suggestions={[
                                                    "Search by farming topic like Cotton, Pest, Urea, or Rain",
                                                    "Set the category filter back to 'All' categories",
                                                    "Clear your query to see recent questions from fellow farmers"
                                                ]}
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-sm text-center">
                                            <EmptyState
                                                icon={activeTab === 'my_posts' ? BookOpen : MessageSquare}
                                                title={
                                                    activeTab === 'my_posts'
                                                        ? "You haven't published any posts yet"
                                                        : activeTab === 'my_discussions'
                                                        ? "No discussion activity yet"
                                                        : "No community posts in this category yet"
                                                }
                                                description={
                                                    activeTab === 'my_posts'
                                                        ? "Share your farming advice, pest remedies, or questions to help the community."
                                                        : activeTab === 'my_discussions'
                                                        ? "Join any ongoing agricultural discussion or reply to questions in the community feed!"
                                                        : "Be the first in your farming circle to start a discussion or ask an agronomy question."
                                                }
                                                tip="Posts with clear photos of crops or pest damage receive responses from agronomists and local farmers 3x faster."
                                                actionText={activeTab === 'my_posts' ? "Create First Post" : "Ask a Question"}
                                                onAction={() => {
                                                    setCreateModalType('general');
                                                    setCreateModalOpen(true);
                                                }}
                                            />
                                        </div>
                                    )
                                ) : (
                                    <div className="space-y-5">
                                        {filteredPosts.map(post => (
                                            <PostCard
                                                key={post._id}
                                                post={post}
                                                currentUser={currentUser}
                                                onPostUpdated={handlePostUpdated}
                                                onPostDeleted={handlePostDeleted}
                                                onOpenLightbox={handleOpenLightbox}
                                                onOpenSinglePost={handleOpenSinglePost}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                    </main>

                </div>
            </div>

            {/* ============================================================== */}
            {/* MODALS & OVERLAYS                                              */}
            {/* ============================================================== */}

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onPostCreated={handlePostCreated}
                currentUser={currentUser}
                initialType={createModalType}
            />

            {/* Fullscreen Media Lightbox (Instagram Style) */}
            <MediaLightbox
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                media={lightboxMedia}
                initialIndex={lightboxIndex}
            />

        </div>
    );
};

export default Community;
