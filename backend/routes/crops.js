import express from "express";
import fetchUser from "../middlewares/fetchUser.js";
import { addCrop, getCrops, deleteCrop } from "../controllers/cropController.js";

const router = express.Router();

router.get("/fetchall", fetchUser, getCrops);
router.post("/add", fetchUser, addCrop);
router.delete("/delete/:id", fetchUser, deleteCrop);

export default router;