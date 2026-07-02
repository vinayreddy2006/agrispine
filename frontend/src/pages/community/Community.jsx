import { useEffect, useState } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
    Users, Send, Plus, ArrowLeft, User, MessageCircle,
    Clock, ChevronDown, ChevronUp, MessageSquare
} from "lucide-react";
import { useTranslation } from "react-i18next"; // 1. Import Hook
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import NewPostForm from "./components/NewPostForm";
import PostCard from "./components/PostCard";

const Community = () => {
    const { t } = useTranslation(); // 2. Initialize Hook
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Tab State ('all', 'my_questions', 'my_replies')
    const [activeTab, setActiveTab] = useState("all");

    const [expandedPosts, setExpandedPosts] = useState({});
    const [newPost, setNewPost] = useState({ title: "", content: "" });
    const [replyText, setReplyText] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);

    // --- Helpers ---
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString([], {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const toggleReplies = (postId) => {
        setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    // --- API Calls ---
    useEffect(() => {
        const initialize = async () => {
            const token = localStorage.getItem("token");
            const userStr = localStorage.getItem("user");

            if (userStr) {
                setCurrentUser(JSON.parse(userStr));
            }

            try {
                const { data } = await api.get("/community/fetchall", {
                    headers: { "auth-token": token }
                });
                setPosts(data);
            } catch (err) {
                console.error("Failed to fetch posts");
            } finally {
                setLoading(false);
            }
        };
        initialize();
    }, []);

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await api.post("/community/add", newPost, {
                headers: { "auth-token": token }
            });

            Swal.fire({
                title: t('community.posted_title', { defaultValue: "Posted!" }),
                text: t('community.posted_msg', { defaultValue: "Your question is live." }),
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });

            setNewPost({ title: "", content: "" });
            setShowForm(false);

            // Refresh posts
            const { data } = await api.get("/community/fetchall", { headers: { "auth-token": token } });
            setPosts(data);

        } catch (err) {
            Swal.fire("Error", "Could not post. Try again.", "error");
        }
    };

    const handleReplySubmit = async (postId) => {
        if (!replyText.trim()) return;
        try {
            const token = localStorage.getItem("token");
            await api.post(`/community/reply/${postId}`, { text: replyText }, {
                headers: { "auth-token": token }
            });

            setReplyText("");
            setReplyingTo(null);
            setExpandedPosts(prev => ({ ...prev, [postId]: true }));

            // Refresh posts
            const { data } = await api.get("/community/fetchall", { headers: { "auth-token": token } });
            setPosts(data);

        } catch (err) {
            console.error(err);
        }
    };

    // --- UPDATED: Safe Filtering Logic ---
    const getFilteredPosts = () => {
        if (!currentUser) return posts;

        const myId = String(currentUser._id || currentUser.id);

        if (activeTab === "my_questions") {
            return posts.filter(post => {
                const postAuthorId = post.user?._id ? String(post.user._id) : String(post.user);
                return postAuthorId === myId;
            });
        }
        else if (activeTab === "my_replies") {
            return posts.filter(post =>
                post.replies.some(reply => String(reply.user) === myId)
            );
        }
        return posts; // Default: 'all'
    };

    const filteredPosts = getFilteredPosts();

    return (
        <div className="w-full">

            {/* Header */}
            <PageHeader 
                title={t('community.title')}
                icon={Users}
                rightActions={
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        variant="primary"
                        className="bg-purple-600 hover:bg-purple-700"
                        icon={showForm ? undefined : Plus}
                    >
                        {showForm ? t('common.cancel') : t('community.ask')}
                    </Button>
                }
            >
                <div className="max-w-3xl mx-auto px-4 md:px-0 mt-2">
                    {/* Tabs Section */}
                    <div className="flex gap-6 text-sm font-medium overflow-x-auto hide-scrollbar">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`pb-3 whitespace-nowrap transition relative min-h-[44px] flex items-center ${activeTab === "all" ? "text-purple-700 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            {/* Translated Tab */}
                            {t('community.global')}
                            {activeTab === "all" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></div>}
                        </button>

                        <button
                            onClick={() => setActiveTab("my_questions")}
                            className={`pb-3 whitespace-nowrap transition relative min-h-[44px] flex items-center ${activeTab === "my_questions" ? "text-purple-700 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            {/* Translated Tab */}
                            {t('community.my_q')}
                            {activeTab === "my_questions" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></div>}
                        </button>

                        <button
                            onClick={() => setActiveTab("my_replies")}
                            className={`pb-3 whitespace-nowrap transition relative min-h-[44px] flex items-center ${activeTab === "my_replies" ? "text-purple-700 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            {/* Translated Tab */}
                            {t('community.my_a')}
                            {activeTab === "my_replies" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></div>}
                        </button>
                    </div>
                </div>
            </PageHeader>

            <div className="max-w-3xl mx-auto px-4 mt-6">

                {/* Ask Question Form */}
                {showForm && (
                    <NewPostForm
                        newPost={newPost}
                        setNewPost={setNewPost}
                        handlePostSubmit={handlePostSubmit}
                        t={t}
                    />
                )}

                {/* Posts Feed */}
                {loading ? (
                    <LoadingState message="Loading community posts..." />
                ) : filteredPosts.length === 0 ? (
                    <EmptyState 
                        title={t('community.no_posts')}
                        description={activeTab === "all" ? t('community.empty_all', { defaultValue: "Be the first to ask a question!" }) :
                            activeTab === "my_questions" ? t('community.empty_q', { defaultValue: "You haven't asked anything yet." }) :
                                t('community.empty_a', { defaultValue: "You haven't replied to anyone yet." })}
                        icon={MessageSquare}
                    />
                ) : (
                    <div className="space-y-6">
                        {filteredPosts.map((post) => {
                            const isOwner = currentUser && (
                                (post.user?._id && String(post.user._id) === String(currentUser._id || currentUser.id)) ||
                                (post.user && String(post.user) === String(currentUser._id || currentUser.id))
                            );

                            return (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    currentUser={currentUser}
                                    expandedPosts={expandedPosts}
                                    toggleReplies={toggleReplies}
                                    replyingTo={replyingTo}
                                    setReplyingTo={setReplyingTo}
                                    replyText={replyText}
                                    setReplyText={setReplyText}
                                    handleReplySubmit={handleReplySubmit}
                                    formatDate={formatDate}
                                    t={t}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Community;
