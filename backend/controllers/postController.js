import Post from "../models/Post.js";
import User from "../models/User.js";
import Report from "../models/Report.js";

// Helper: Normalize post for backward compatibility
const normalizePost = (postDoc, currentUserId) => {
  const post = postDoc.toObject ? postDoc.toObject() : { ...postDoc };

  // Normalize likes
  if (!Array.isArray(post.likes)) {
    post.likes = [];
  }
  post.likesCount = post.likes.length;
  post.isLiked = currentUserId ? post.likes.some(id => String(id) === String(currentUserId)) : false;

  // Normalize media
  if (!Array.isArray(post.media)) {
    post.media = [];
  }

  // Normalize comments & legacy replies
  if (!Array.isArray(post.comments)) {
    post.comments = [];
  }

  // If comments is empty but legacy replies exist, migrate them on the fly
  if (post.comments.length === 0 && Array.isArray(post.replies) && post.replies.length > 0) {
    post.comments = post.replies.map(r => ({
      _id: r._id,
      user: r.user,
      name: r.name || "Community Member",
      profileImage: "",
      village: "",
      district: "",
      text: r.text || "",
      likes: [],
      likesCount: 0,
      isLiked: false,
      replies: [],
      createdAt: r.createdAt || post.createdAt
    }));
  }

  // Format comments with reply counts and like checks
  post.comments = post.comments.map(c => {
    const cLikes = Array.isArray(c.likes) ? c.likes : [];
    const cReplies = Array.isArray(c.replies) ? c.replies : [];
    return {
      ...c,
      likes: cLikes,
      likesCount: cLikes.length,
      isLiked: currentUserId ? cLikes.some(id => String(id) === String(currentUserId)) : false,
      replies: cReplies.map(rep => {
        const repLikes = Array.isArray(rep.likes) ? rep.likes : [];
        return {
          ...rep,
          likes: repLikes,
          likesCount: repLikes.length,
          isLiked: currentUserId ? repLikes.some(id => String(id) === String(currentUserId)) : false
        };
      })
    };
  });

  // Calculate total discussion count (comments + nested replies)
  const totalReplies = post.comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
  post.totalCommentsCount = totalReplies;

  return post;
};

/* -------------------------------------------------------------------------- */
/* UPLOAD MEDIA (Images / Videos)                                              */
/* -------------------------------------------------------------------------- */
export const uploadMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const host = req.get("host");
    const protocol = req.protocol;

    const files = req.files.map(file => {
      const isVideo = file.mimetype.startsWith("video/");
      return {
        url: `${protocol}://${host}/uploads/${file.filename}`,
        type: isVideo ? "video" : "image",
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      };
    });

    res.json({ success: true, files });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "File upload failed", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* CREATE A NEW POST                                                          */
/* -------------------------------------------------------------------------- */
export const createPost = async (req, res) => {
  try {
    const { title, content, postType, category, customTopic, customCategory, media, tags } = req.body;

    const trimmedContent = (content || "").trim();
    const trimmedTitle = (title || "").trim();
    const mediaArray = Array.isArray(media) ? media : [];

    // Validation: Require either text content, title, or media
    if (!trimmedContent && !trimmedTitle && mediaArray.length === 0) {
      return res.status(400).json({ message: "Post must have content, a title, or media." });
    }

    let resolvedCategory = (category || "General Agriculture").trim();
    if (resolvedCategory === "Others" || resolvedCategory === "Other") {
      const custom = (customTopic || customCategory || "").trim();
      if (!custom) {
        return res.status(400).json({ message: "Please specify your custom topic when selecting 'Others'." });
      }
      resolvedCategory = custom;
    }

    const newPost = new Post({
      user: req.user.id,
      title: trimmedTitle || (trimmedContent.slice(0, 60) + (trimmedContent.length > 60 ? '...' : '')),
      content: trimmedContent,
      postType: postType || "general",
      category: resolvedCategory,
      customCategory: (customTopic || customCategory || "").trim(),
      media: mediaArray,
      tags: Array.isArray(tags) ? tags : [],
      likes: [],
      comments: []
    });

    const savedPost = await newPost.save();
    const populated = await Post.findById(savedPost._id)
      .populate("user", "name village district profileImage userType");

    res.status(201).json(normalizePost(populated, req.user.id));
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* GET ALL POSTS (With Filtering, Search, and Populated Authors)              */
/* -------------------------------------------------------------------------- */
export const getAllPosts = async (req, res) => {
  try {
    const { search, category, postType, sort, author } = req.query;
    const currentUserId = req.user?.id;

    const filter = {};

    // Filter by author if requested
    if (author) {
      filter.user = author;
    }

    // Filter by category
    if (category && category !== "All") {
      filter.category = category;
    }

    // Filter by post type
    if (postType && postType !== "all") {
      filter.postType = postType;
    }

    // Search query across title, content, and category
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { category: searchRegex }
      ];
    }

    let query = Post.find(filter)
      .populate("user", "name village district profileImage userType")
      .populate("comments.user", "name village district profileImage userType");

    if (sort === "popular") {
      // Sort by likes array size if possible or by createdAt
      query = query.sort({ createdAt: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const rawPosts = await query.exec();

    // Map and normalize each post
    let normalized = rawPosts.map(p => normalizePost(p, currentUserId));

    if (sort === "popular") {
      normalized.sort((a, b) => (b.likesCount + b.totalCommentsCount) - (a.likesCount + a.totalCommentsCount));
    }

    res.json(normalized);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* GET SINGLE POST                                                            */
/* -------------------------------------------------------------------------- */
export const getSinglePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "name village district profileImage userType")
      .populate("comments.user", "name village district profileImage userType")
      .populate("comments.replies.user", "name village district profileImage userType");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(normalizePost(post, req.user?.id));
  } catch (error) {
    console.error("Error fetching single post:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* UPDATE A POST                                                              */
/* -------------------------------------------------------------------------- */
export const updatePost = async (req, res) => {
  try {
    const { title, content, category, postType } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized. You can only edit your own posts." });
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (category !== undefined) post.category = category;
    if (postType !== undefined) post.postType = postType;

    const updated = await post.save();
    const populated = await Post.findById(updated._id)
      .populate("user", "name village district profileImage userType");

    res.json(normalizePost(populated, req.user.id));
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE A POST                                                              */
/* -------------------------------------------------------------------------- */
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized. You can only delete your own posts." });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* TOGGLE LIKE ON POST                                                        */
/* -------------------------------------------------------------------------- */
export const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Ensure likes is an array
    if (!Array.isArray(post.likes)) {
      post.likes = [];
    }

    const userIdStr = String(req.user.id);
    const existingIndex = post.likes.findIndex(id => String(id) === userIdStr);

    let isLiked = false;
    if (existingIndex > -1) {
      // Unlike
      post.likes.splice(existingIndex, 1);
      isLiked = false;
    } else {
      // Like
      post.likes.push(req.user.id);
      isLiked = true;
    }

    await post.save();
    res.json({
      success: true,
      likesCount: post.likes.length,
      isLiked
    });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* ADD COMMENT TO POST                                                        */
/* -------------------------------------------------------------------------- */
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text cannot be empty" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const author = await User.findById(req.user.id);

    const newComment = {
      user: req.user.id,
      name: author ? author.name : "Community Member",
      profileImage: author?.profileImage || "",
      village: author?.village || "",
      district: author?.district || "",
      text: text.trim(),
      likes: [],
      replies: [],
      createdAt: new Date()
    };

    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }

    post.comments.push(newComment);
    await post.save();

    const populated = await Post.findById(post._id)
      .populate("user", "name village district profileImage userType")
      .populate("comments.user", "name village district profileImage userType");

    res.json(normalizePost(populated, req.user.id));
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE COMMENT                                                             */
/* -------------------------------------------------------------------------- */
export const deleteComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Authorized if comment author or post author
    const isCommentAuthor = String(comment.user) === String(req.user.id);
    const isPostAuthor = String(post.user) === String(req.user.id);
    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: "Unauthorized to delete this comment" });
    }

    post.comments.pull({ _id: commentId });
    await post.save();

    const populated = await Post.findById(postId)
      .populate("user", "name village district profileImage userType")
      .populate("comments.user", "name village district profileImage userType");

    res.json(normalizePost(populated, req.user.id));
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* ADD NESTED REPLY TO COMMENT                                                */
/* -------------------------------------------------------------------------- */
export const addReplyToComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Reply text cannot be empty" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }

    const author = await User.findById(req.user.id);

    const newReply = {
      user: req.user.id,
      name: author ? author.name : "Community Member",
      profileImage: author?.profileImage || "",
      village: author?.village || "",
      district: author?.district || "",
      text: text.trim(),
      likes: [],
      createdAt: new Date()
    };

    if (!Array.isArray(comment.replies)) {
      comment.replies = [];
    }

    comment.replies.push(newReply);
    await post.save();

    const populated = await Post.findById(postId)
      .populate("user", "name village district profileImage userType")
      .populate("comments.user", "name village district profileImage userType");

    res.json(normalizePost(populated, req.user.id));
  } catch (error) {
    console.error("Error replying to comment:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE NESTED REPLY                                                        */
/* -------------------------------------------------------------------------- */
export const deleteReplyFromComment = async (req, res) => {
  try {
    const { id: postId, commentId, replyId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    const isReplyAuthor = String(reply.user) === String(req.user.id);
    const isCommentAuthor = String(comment.user) === String(req.user.id);
    const isPostAuthor = String(post.user) === String(req.user.id);

    if (!isReplyAuthor && !isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: "Unauthorized to delete this reply" });
    }

    comment.replies.pull({ _id: replyId });
    await post.save();

    const populated = await Post.findById(postId)
      .populate("user", "name village district profileImage userType")
      .populate("comments.user", "name village district profileImage userType");

    res.json(normalizePost(populated, req.user.id));
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* TOGGLE LIKE ON COMMENT                                                     */
/* -------------------------------------------------------------------------- */
export const toggleLikeComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (!Array.isArray(comment.likes)) comment.likes = [];

    const userIdStr = String(req.user.id);
    const idx = comment.likes.findIndex(id => String(id) === userIdStr);

    let isLiked = false;
    if (idx > -1) {
      comment.likes.splice(idx, 1);
      isLiked = false;
    } else {
      comment.likes.push(req.user.id);
      isLiked = true;
    }

    await post.save();
    res.json({ success: true, likesCount: comment.likes.length, isLiked });
  } catch (error) {
    console.error("Error liking comment:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* TOGGLE LIKE ON REPLY                                                       */
/* -------------------------------------------------------------------------- */
export const toggleLikeReply = async (req, res) => {
  try {
    const { id: postId, commentId, replyId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    if (!Array.isArray(reply.likes)) reply.likes = [];

    const userIdStr = String(req.user.id);
    const idx = reply.likes.findIndex(id => String(id) === userIdStr);

    let isLiked = false;
    if (idx > -1) {
      reply.likes.splice(idx, 1);
      isLiked = false;
    } else {
      reply.likes.push(req.user.id);
      isLiked = true;
    }

    await post.save();
    res.json({ success: true, likesCount: reply.likes.length, isLiked });
  } catch (error) {
    console.error("Error liking reply:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* REPORT A POST (POST /community/report/:id)                                 */
/* -------------------------------------------------------------------------- */
export const reportPost = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const postId = req.params.id;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Please select a reason for reporting." });
    }

    if (reason === "Other" && (!description || !description.trim())) {
      return res.status(400).json({ message: "Please provide an explanation for reporting." });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found or has been removed." });
    }

    // Check for duplicate report by this user
    const existing = await Report.findOne({ post: postId, reporter: req.user.id });
    if (existing) {
      return res.status(400).json({ message: "You have already reported this post. Our moderation team is reviewing it." });
    }

    const report = new Report({
      post: postId,
      postAuthor: post.user,
      reporter: req.user.id,
      reason: reason.trim(),
      description: (description || "").trim(),
      status: "pending"
    });

    await report.save();

    post.reportCount = (post.reportCount || 0) + 1;
    post.isReported = true;
    await post.save();

    res.status(201).json({
      success: true,
      message: "Report submitted successfully. Thank you for keeping our agricultural community safe."
    });
  } catch (error) {
    console.error("Error reporting post:", error);
    res.status(500).json({ message: "Failed to submit report", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* LEGACY REPLY HANDLER (Keeps older frontend calls functioning)              */
/* -------------------------------------------------------------------------- */
export const addReply = async (req, res) => {
  return addComment(req, res);
};
