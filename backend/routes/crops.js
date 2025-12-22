import express from "express";
import fetchUser from "../middlewares/fetchUser.js";
import { addCrop, getCrops, deleteCrop, getCropById, addExpense } from "../controllers/cropController.js";

const router = express.Router();

router.get("/fetchall", fetchUser, getCrops);
router.post("/add", fetchUser, addCrop);
router.delete("/delete/:id", fetchUser, deleteCrop);
router.get("/:id", fetchUser, getCropById);
router.put("/expense/:id", fetchUser, addExpense);
export default router;