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
    const user = await User.findById(userId).select("-password");
    res.send(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};


/* -------------------------------------------------------------------------- */
/* UPDATE USER PROFILE                                                        */
/* -------------------------------------------------------------------------- */
export const updateProfile = async (req, res) => {
  try {
    const { name, village, district, bio } = req.body;
    
    // Create a new object with only the fields that were sent
    const newDetails = {};
    if (name) newDetails.name = name;
    if (village) newDetails.village = village;
    if (district) newDetails.district = district;
    if (bio) newDetails.bio = bio;

    // Find user by ID and update
    let user = await User.findByIdAndUpdate(
      req.user.id, 
      { $set: newDetails }, 
      { new: true } // Returns the updated user
    );

    res.json({ success: true, user });

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Server Error");
  }
};