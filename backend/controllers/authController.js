import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* -------------------------------------------------------------------------- */
/* REGISTER USER                               */
/* -------------------------------------------------------------------------- */
export const register = async (req, res) => {
  try {
    const { name, phone, password, userType, village, district } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this phone number." });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create User
    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
      userType,
      village,
      district,
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        phone: savedUser.phone,
        userType: savedUser.userType
      }
    });

  } catch (error) {
    console.error("❌ Register Error:", error); // Log for developer
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* LOGIN USER                                 */
/* -------------------------------------------------------------------------- */
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 2. Validate Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // 3. Generate Token
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        userType: user.userType,
        village: user.village
      },
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* GET USER DETAILS (POST /api/auth/getuser) - Login Required                 */
/* -------------------------------------------------------------------------- */
export const getUser = async (req, res) => {
  try {
    const userId = req.user.id;
    // Select everything EXCEPT the password
    const user = await User.findById(userId).select("-password").populate('blockedUsers', 'name profileImage village userType');
    res.send(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


/* -------------------------------------------------------------------------- */
/* UPDATE USER PROFILE                                                        */
/* -------------------------------------------------------------------------- */
export const updateProfile = async (req, res) => {
  try {
    const { 
      name, village, district, bio, profileImage,
      farmingStartYear, landPlots,
      mainCrops, farmingStyle, preferredLanguage
    } = req.body;
    
    const newDetails = {};
    if (name) newDetails.name = name;
    if (village) newDetails.village = village;
    if (district) newDetails.district = district;
    if (bio) newDetails.bio = bio;
    if (profileImage) newDetails.profileImage = profileImage;
    if (farmingStartYear !== undefined) newDetails.farmingStartYear = farmingStartYear;
    if (landPlots !== undefined) newDetails.landPlots = landPlots;
    if (mainCrops) newDetails.mainCrops = mainCrops;
    if (farmingStyle) newDetails.farmingStyle = farmingStyle;
    if (preferredLanguage) newDetails.preferredLanguage = preferredLanguage;

    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { $set: newDetails }, 
      { new: true }
    ).select("-password"); // Don't send back password

    res.json({ success: true, user });

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* GET VILLAGE MEMBERS */
export const getVillageMembers = async (req, res) => {
  try {
    const { village } = req.params;
    
    // Find users in this village, select specific fields (exclude password)
    const members = await User.find({ village })
      .select("name phone userType profileImage bio village");

    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* SEARCH USERS GLOBALLY */
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    
    const users = await User.find({
      name: { $regex: q, $options: "i" }
    }).select("name profileImage village");

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

import CropCycle from "../models/CropCycle.js";
import Post from "../models/Post.js";

/* GET PROFILE ANALYTICS */
export const getProfileAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get Crop Stats
    const crops = await CropCycle.find({ user: userId });
    
    const activeCrops = crops.filter(c => c.status === 'active').length;
    const completedCrops = crops.filter(c => c.status === 'harvested' || c.status === 'sold').length;
    
    // 2. Get Expenses Recorded
    const expensesRecorded = crops.reduce((total, crop) => total + crop.expenses.length, 0);

    // 3. Get Forum Posts
    const forumPosts = await Post.countDocuments({ user: userId });

    res.json({
      activeCrops,
      completedCrops,
      expensesRecorded,
      forumPosts
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* BLOCK USER SYSTEM                                                          */
/* -------------------------------------------------------------------------- */
export const blockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: targetId } = req.params;
    
    if (userId === targetId) return res.status(400).json({ message: "Cannot block yourself." });

    const user = await User.findById(userId);
    if (!user.blockedUsers.includes(targetId)) {
      user.blockedUsers.push(targetId);
      await user.save();
    }
    res.json({ success: true, blockedUsers: user.blockedUsers });
  } catch (err) {
    console.error("Error blocking user:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: targetId } = req.params;
    
    const user = await User.findById(userId);
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetId);
    await user.save();
    
    res.json({ success: true, blockedUsers: user.blockedUsers });
  } catch (err) {
    console.error("Error unblocking user:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('blockedUsers', 'name profileImage village userType');
    res.json(user.blockedUsers);
  } catch (err) {
    console.error("Error fetching blocked users:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
