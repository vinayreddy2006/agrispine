import express from "express";
import { register, login, updateProfile } from "../controllers/authController.js";
import fetchUser from "../middlewares/fetchUser.js";
import { getUser } from "../controllers/authController.js";

const router = express.Router();

// Define Routes
router.post("/register", register);
router.post("/login", login);
router.post("/getuser", fetchUser, getUser);
router.put("/updateprofile", fetchUser, updateProfile);
export default router;