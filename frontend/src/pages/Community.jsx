import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
    Users, Send, Plus, ArrowLeft, User, MessageCircle,
    Clock, ChevronDown, ChevronUp, MessageSquare
} from "lucide-react";

const Community = () => {
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
                title: "Posted!",
                text: "Your question is live.",
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

        // Safety: Get ID whether it is stored as '_id' or 'id'
        const myId = String(currentUser._id || currentUser.id);

        if (activeTab === "my_questions") {
            return posts.filter(post => {
                // Safety: Handle if post.user is an Object (populated) or just a String ID
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
            <div className="bg-white shadow-sm sticky top-0 z-10 px-4 pt-3 pb-0 mb-6">
                <div className="max-w-3xl mx-auto">

                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Users className="text-purple-600 w-6 h-6" /> Farmers Forum
                            </h1>
                        </div>

                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-md transition active:scale-95"
                        >
                            {showForm ? "Cancel" : <><Plus className="w-4 h-4" /> Ask Question</>}
                        </button>
                    </div>

                    {/* Tabs Section */}
                    <div className="flex gap-6 text-sm font-medium border-b border-gray-200 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`pb-3 whitespace-nowrap transition relative ${activeTab === "all" ? "text-purple-700 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Global Feed
                            {activeTab === "all" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></div>}
                        </button>

                        <button
                            onClick={() => setActiveTab("my_questions")}
                            className={`pb-3 whitespace-nowrap transition relative ${activeTab === "my_questions" ? "text-purple-700 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            My Questions
                            {activeTab === "my_questions" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></div>}
                        </button>

                        <button
                            onClick={() => setActiveTab("my_replies")}
                            className={`pb-3 whitespace-nowrap transition relative ${activeTab === "my_replies" ? "text-purple-700 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            My Participation
                            {activeTab === "my_replies" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></div>}
                        </button>
                    </div>

                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4">

                {/* Ask Question Form */}
                {showForm && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100 mb-8 animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-bold text-gray-800 mb-1">Create a Discussion</h3>
                        <p className="text-sm text-gray-500 mb-4">Ask about crops, diseases, or machinery.</p>
                        <form onSubmit={handlePostSubmit} className="space-y-4">
                            <input
                                placeholder="Topic Title..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                                value={newPost.title}
                                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                required
                            />
                            <textarea
                                rows="4"
                                placeholder="Describe details..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                required
                            />
                            <div className="flex justify-end">
                                <button type="submit" className="bg-purple-600 text-white px-8 py-2.5 rounded-xl hover:bg-purple-700 font-bold shadow-md">
                                    Post Discussion
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Posts Feed */}
                {loading ? (
                    <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse"></div>)}</div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                        <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600">No posts found</h3>
                        <p className="text-gray-400">
                            {activeTab === "all" ? "Be the first to ask a question!" :
                                activeTab === "my_questions" ? "You haven't asked anything yet." :
                                    "You haven't replied to anyone yet."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredPosts.map((post) => {
                            // Check if current user is the owner of this post (for "YOU" badge)
                            const isOwner = currentUser && (
                                (post.user?._id && String(post.user._id) === String(currentUser._id || currentUser.id)) ||
                                (post.user && String(post.user) === String(currentUser._id || currentUser.id))
                            );

                            return (
                                <div key={post._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-200">

                                    {/* Post Header */}
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border border-gray-200">
                                                {post.user?.profileImage ? (
                                                    <img
                                                        src={post.user.profileImage}
                                                        alt={post.user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-purple-600 font-bold">
                                                        {post.user?.name ? post.user.name[0].toUpperCase() : <User className="w-5 h-5" />}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 leading-tight">
                                                    {post.user?.name || "Farmer"}
                                                    {isOwner && <span className="ml-2 bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full">YOU</span>}
                                                </h3>
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{formatDate(post.createdAt)}</span>
                                                    {post.user?.village && <span>• {post.user.village}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="text-lg font-bold text-gray-800 mb-2">{post.title}</h2>
                                        <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{post.content}</p>
                                    </div>

                                    {/* Actions Bar */}
                                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                                        <button
                                            onClick={() => toggleReplies(post._id)}
                                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-700 transition"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            {post.replies.length} Replies
                                            {expandedPosts[post._id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setExpandedPosts(prev => ({ ...prev, [post._id]: true }));
                                                setReplyingTo(post._id);
                                            }}
                                            className="text-sm font-bold text-purple-600 hover:text-purple-800"
                                        >
                                            Reply
                                        </button>
                                    </div>

                                    {/* Replies Section */}
                                    {expandedPosts[post._id] && (
                                        <div className="bg-gray-50 px-6 pb-6 pt-2 border-t border-gray-200 animate-in slide-in-from-top-2">
                                            <div className="space-y-4 mb-4">
                                                {post.replies.length === 0 ? (
                                                    <p className="text-center text-xs text-gray-400 italic py-2">No replies yet. Be the first!</p>
                                                ) : (
                                                    post.replies.map((reply, index) => (
                                                        <div key={index} className="flex gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                                                                {reply.name ? reply.name[0] : "U"}
                                                            </div>
                                                            <div className="bg-white p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm border border-gray-100 flex-1">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="font-bold text-sm text-gray-800">
                                                                        {reply.name}
                                                                        {currentUser && String(reply.user) === String(currentUser._id || currentUser.id) &&
                                                                            <span className="ml-2 text-purple-600 text-[10px]">(You)</span>
                                                                        }
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400">{formatDate(reply.createdAt)}</span>
                                                                </div>
                                                                <p className="text-sm text-gray-600">{reply.text}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <div className="flex gap-2 items-center">
                                                <input
                                                    placeholder="Write a helpful reply..."
                                                    className="flex-1 px-4 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-purple-500 shadow-sm"
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
                                                    className={`p-2 rounded-full transition ${replyText.trim() && replyingTo === post._id ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Community;