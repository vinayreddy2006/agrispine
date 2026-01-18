import express from "express";
import fetchUser from "../middlewares/fetchUser.js";
import { addCrop, getCrops, deleteCrop, getCropById, addExpense, deleteExpense, sellCrop, toggleListing, getMarketListings } from "../controllers/cropController.js";

const router = express.Router();

router.get("/fetchall", fetchUser, getCrops);
router.post("/add", fetchUser, addCrop);
router.delete("/delete/:id", fetchUser, deleteCrop);
router.get("/:id", fetchUser, getCropById);
router.put("/expense/:id", fetchUser, addExpense);
router.delete("/expense/:id/:expenseId", fetchUser, deleteExpense);
router.put("/sell/:id", fetchUser, sellCrop);
router.put("/market/toggle/:id", fetchUser, toggleListing);
router.get("/market/listings", getMarketListings);

export default router;