import User from "../models/User.js";
import CropCycle from "../models/CropCycle.js";
import Post from "../models/Post.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* -------------------------------------------------------------------------- */
/* REGISTER USER                               */
/* -------------------------------------------------------------------------- */
export const register = async (req, res) => {
  try {
    const { name, phone, password, userType, role, village, district } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this phone number." });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Support both 'user' role and legacy userType (farmer, provider, buyer)
    const assignedUserType = userType || role || 'user';
    const assignedRole = role || (assignedUserType === 'farmer' || assignedUserType === 'provider' || assignedUserType === 'buyer' ? 'user' : assignedUserType);

    // 3. Create User (registration location remains untouched per requirements)
    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
      userType: assignedUserType,
      role: assignedRole,
      village,
      district,
      isLocationConfirmed: false
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        phone: savedUser.phone,
        userType: savedUser.userType,
        role: savedUser.role || 'user'
      }
    });

  } catch (error) {
    console.error("❌ Register Error:", error);
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
        role: user.role || 'user',
        village: user.village || "",
        mandal: user.mandal || "",
        district: user.district || "",
        state: user.state || "",
        isLocationConfirmed: !!user.isLocationConfirmed,
        locationCoordinates: user.locationCoordinates,
        placeId: user.placeId || "",
        formattedAddress: user.formattedAddress || ""
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
/* CONFIRM LOCATION (PUT /api/auth/confirm-location)                           */
/* -------------------------------------------------------------------------- */
export const confirmLocation = async (req, res) => {
  try {
    const { village, mandal, district, state, coordinates, placeId, formattedAddress } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          village: village || "",
          mandal: mandal || "",
          district: district || "",
          state: state || "",
          isLocationConfirmed: true,
          locationCoordinates: coordinates || undefined,
          placeId: placeId || "",
          formattedAddress: formattedAddress || ""
        }
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Location confirmed successfully",
      user
    });
  } catch (error) {
    console.error("Error confirming location:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* UPDATE USER PROFILE                                                        */
/* -------------------------------------------------------------------------- */
export const updateProfile = async (req, res) => {
  try {
    const { 
      name, village, mandal, district, state, bio, profileImage,
      farmingStartYear, landPlots,
      mainCrops, farmingStyle, preferredLanguage,
      locationCoordinates, placeId, formattedAddress, isLocationConfirmed
    } = req.body;
    
    const newDetails = {};
    if (name) newDetails.name = name;
    if (village !== undefined) newDetails.village = village;
    if (mandal !== undefined) newDetails.mandal = mandal;
    if (district !== undefined) newDetails.district = district;
    if (state !== undefined) newDetails.state = state;
    if (bio !== undefined) newDetails.bio = bio;
    if (profileImage !== undefined) newDetails.profileImage = profileImage;
    if (farmingStartYear !== undefined) newDetails.farmingStartYear = farmingStartYear;
    if (landPlots !== undefined) newDetails.landPlots = landPlots;
    if (mainCrops !== undefined) newDetails.mainCrops = mainCrops;
    if (farmingStyle !== undefined) newDetails.farmingStyle = farmingStyle;
    if (preferredLanguage !== undefined) newDetails.preferredLanguage = preferredLanguage;
    if (locationCoordinates !== undefined) newDetails.locationCoordinates = locationCoordinates;
    if (placeId !== undefined) newDetails.placeId = placeId;
    if (formattedAddress !== undefined) newDetails.formattedAddress = formattedAddress;
    if (isLocationConfirmed !== undefined) newDetails.isLocationConfirmed = isLocationConfirmed;

    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { $set: newDetails }, 
      { new: true }
    ).select("-password");

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

/* GET PROFILE ANALYTICS */
export const getProfileAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const crops = await CropCycle.find({ user: userId });
    
    const activeCrops = crops.filter(c => c.status === 'active').length;
    const completedCrops = crops.filter(c => c.status === 'harvested' || c.status === 'sold').length;
    
    const expensesRecorded = crops.reduce((total, crop) => total + crop.expenses.length, 0);
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
