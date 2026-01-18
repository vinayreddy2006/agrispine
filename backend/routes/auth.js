import express from "express";
import { register, login, getUser, updateProfile, getVillageMembers } from "../controllers/authController.js";
import fetchUser from "../middlewares/fetchUser.js";


const router = express.Router();

// Define Routes
router.post("/register", register);
router.post("/login", login);
router.post("/getuser", fetchUser, getUser);
router.put("/updateprofile", fetchUser, updateProfile);
router.get("/members/:village", fetchUser, getVillageMembers);
export default router;