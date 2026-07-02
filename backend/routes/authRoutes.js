import express from "express";
import { register, login, getUser, updateProfile, getVillageMembers, getProfileAnalytics, searchUsers, blockUser, unblockUser, getBlockedUsers } from "../controllers/authController.js";
import fetchUser from "../middlewares/fetchUser.js";


const router = express.Router();

// Define Routes
router.post("/register", register);
router.post("/login", login);
router.post("/getuser", fetchUser, getUser);
router.put("/updateprofile", fetchUser, updateProfile);
router.get("/members/:village", fetchUser, getVillageMembers);
router.get("/profile-analytics", fetchUser, getProfileAnalytics);
router.get("/search-users", fetchUser, searchUsers);
router.post("/block/:id", fetchUser, blockUser);
router.post("/unblock/:id", fetchUser, unblockUser);
router.get("/blocked", fetchUser, getBlockedUsers);

export default router;