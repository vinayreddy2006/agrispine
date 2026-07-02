import express from "express";
import jwt from "jsonwebtoken";
import {
    adminLogin,
    setupAdmin,
    registerAdmin,
    seedData,
    getSchemes,
    createScheme,
    updateScheme,
    deleteScheme,
    getMandiRates,
    createMandiRate,
    updateMandiRate,
    deleteMandiRate
} from "../controllers/adminController.js";

const router = express.Router();

// Middleware to verify admin token
const adminAuth = (req, res, next) => {
    const token = req.header("admin-token");
    if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        if (verified.role !== "superadmin") {
            return res.status(403).json({ message: "Forbidden. Admin access required." });
        }
        req.admin = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

// Admin Auth Routes
router.post("/login", adminLogin);
router.post("/setup", setupAdmin);
router.post("/register", registerAdmin);
router.post("/seed", adminAuth, seedData);

// ---------------- SCHEMES CRUD ---------------- //
router.get("/schemes", getSchemes);
router.post("/schemes", adminAuth, createScheme);
router.put("/schemes/:id", adminAuth, updateScheme);
router.delete("/schemes/:id", adminAuth, deleteScheme);

// ---------------- MANDI RATES CRUD ---------------- //
router.get("/mandi-rates", getMandiRates);
router.post("/mandi-rates", adminAuth, createMandiRate);
router.put("/mandi-rates/:id", adminAuth, updateMandiRate);
router.delete("/mandi-rates/:id", adminAuth, deleteMandiRate);

export default router;
