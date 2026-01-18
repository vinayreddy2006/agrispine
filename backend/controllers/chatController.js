import Message from "../models/Message.js";

/* 3. CLEAR CHAT (Delete all EXCEPT Starred) */
export const clearChat = async (req, res) => {
  try {
    const { village } = req.params;
    
    // Delete messages in this village that are NOT starred by anyone
    // (In a real app, 'Clear Chat' is usually local to the user, but for this group logic we'll delete un-starred global messages to save space)
    await Message.deleteMany({ 
      village: village,
      starredBy: { $size: 0 } // Only delete if NO ONE has starred it
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

/* 4. TOGGLE STAR MESSAGE */
export const starMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).send("Not Found");

    const userId = req.user.id;
    
    // Toggle Logic
    if (msg.starredBy.includes(userId)) {
      msg.starredBy = msg.starredBy.filter(id => id.toString() !== userId);
    } else {
      msg.starredBy.push(userId);
    }

    await msg.save();
    res.json(msg);
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

/* 5. ADD REACTION */
export const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const msg = await Message.findById(req.params.id);
    
    // Remove existing reaction by this user
    msg.reactions = msg.reactions.filter(r => r.user.toString() !== req.user.id);
    
    // Add new reaction
    msg.reactions.push({ user: req.user.id, emoji });
    
    await msg.save();
    res.json(msg);
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

/* 6. REMOVE REACTION */
export const removeReaction = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).send("Not Found");

    // Filter out the reaction by the current user
    msg.reactions = msg.reactions.filter(r => r.user.toString() !== req.user.id);
    
    await msg.save();
    res.json(msg);
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

/* 7. DELETE MULTIPLE MESSAGES */
export const deleteMultipleMessages = async (req, res) => {
  try {
    const { messageIds } = req.body; // Array of IDs
    
    // Delete messages where ID is in the array AND sender is the current user (Security)
    await Message.deleteMany({
      _id: { $in: messageIds },
      senderId: req.user.id
    });

    res.json({ success: true, ids: messageIds });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};


/* 1. GET MESSAGES (Updated to hide "Deleted for Me") */
export const getVillageMessages = async (req, res) => {
  try {
    const { village } = req.params;
    // Filter: Village matches AND User ID is NOT in 'deletedBy' array
    const messages = await Message.find({ 
        village,
        deletedBy: { $ne: req.user.id } 
    }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

/* 2. DELETE MESSAGE FOR EVERYONE (Soft Delete) */
export const deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).send("Not Found");

    // Only sender can delete
    if (msg.senderId.toString() !== req.user.id) {
      return res.status(401).send("Not Authorized");
    }

    // Update to deleted state
    msg.isDeleted = true;
    msg.text = "This message was deleted"; // 👈 FIX: Don't leave empty, or Mongoose crashes
    msg.reactions = []; 
    msg.replyText = ""; 
    
    await msg.save(); // This will now succeed

    res.json({ success: true, message: msg });

  } catch (error) {
    console.error("Delete Error:", error.message); // 👈 Log error to see details in terminal
    res.status(500).send("Server Error");
  }
};

/* 👇 NEW: DELETE FOR ME (Single or Multiple) */
export const deleteForMe = async (req, res) => {
  try {
    const { messageIds } = req.body; // Expects array [id1, id2]
    
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { deletedBy: req.user.id } } // Add user to hidden list
    );

    res.json({ success: true, ids: messageIds, mode: 'me' });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

/* ... other functions (clearChat, star, react, etc) ... */
// Make sure to keep your existing functions!

/* 8. UPLOAD IMAGE CONTROLLER */
export const uploadMessageImage = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Construct the URL to access the file
        // Ensure your backend serves the 'uploads' folder statically (see index.js step below)
        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        res.json({ imageUrl });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).send("Server Error during upload");
    }
};