import Post from "../models/Post.js";
import User from "../models/User.js";

/* -------------------------------------------------------------------------- */
/* CREATE A NEW POST                                    */
/* -------------------------------------------------------------------------- */
export const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;

    const newPost = new Post({
      user: req.user.id,
      title,
      content
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);

  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Server Error");
  }
};

/* -------------------------------------------------------------------------- */
/* GET ALL POSTS                                        */
/* -------------------------------------------------------------------------- */
export const getAllPosts = async (req, res) => {
  try {
    // Get posts, sort by newest first, and get the Author's Name
    const posts = await Post.find()
      .populate("user", "name village") 
      .sort({ createdAt: -1 });

    res.json(posts);

  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send("Server Error");
  }
};

/* -------------------------------------------------------------------------- */
/* REPLY TO A POST                                      */
/* -------------------------------------------------------------------------- */
export const addReply = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;

    // We need the user's name for the comment
    const user = await User.findById(req.user.id);

    const reply = {
      user: req.user.id,
      name: user.name,
      text
    };

    // Find post and push the new reply
    const post = await Post.findById(postId);
    post.replies.push(reply);
    
    await post.save();
    
    res.json(post); // Return the updated post

  } catch (error) {
    console.error("Error replying:", error);
    res.status(500).send("Server Error");
  }
};