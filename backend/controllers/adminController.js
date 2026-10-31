import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.js";
import Scheme from "../models/Scheme.js";
import MandiRate from "../models/MandiRate.js";
import Report from "../models/Report.js";
import Post from "../models/Post.js";

// Login
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await AdminUser.findOne({ email });
        if (!admin) return res.status(400).json({ message: "Invalid credentials" });

        const validPass = await bcrypt.compare(password, admin.password);
        if (!validPass) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: admin._id, role: admin.role, name: admin.name }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "24h" });
        res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Setup Initial Admin (Run once or restrict)
export const setupAdmin = async (req, res) => {
    try {
        const count = await AdminUser.countDocuments();
        if (count > 0) return res.status(403).json({ message: "Admin already exists." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123", salt);

        const newAdmin = new AdminUser({
            email: "admin@agrispine.com",
            password: hashedPassword,
            name: "Super Admin",
            role: "superadmin"
        });

        await newAdmin.save();
        res.status(201).json({ message: "Default admin created" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Register new Admin dynamically
export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingAdmin = await AdminUser.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin with this email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new AdminUser({
            name,
            email,
            password: hashedPassword,
            role: "superadmin"
        });

        await newAdmin.save();
        res.status(201).json({ message: "Admin registered successfully!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Seed Dummy Data
export const seedData = async (req, res) => {
    try {
        await Scheme.deleteMany();
        await Scheme.insertMany([
            {
                name: "Rythu Bandhu",
                state: "Telangana",
                type: "Financial Support",
                description: "Financial assistance of ₹10,000 per acre per year for agricultural and horticultural crops.",
                benefit: "₹10,000 / Acre / Year",
                targetBeneficiary: "All eligible land-owning farmers",
                applicationDeadline: "Kharif: June 15, Rabi: Nov 15",
                applicationProcess: "Apply online or via Village Agriculture Officer"
            },
            {
                name: "PM-KISAN",
                state: "All India",
                type: "Income Support",
                description: "Direct income support of ₹6,000 per year in three equal installments.",
                benefit: "₹6,000 / Year",
                targetBeneficiary: "Small and marginal farmers",
                applicationDeadline: "Open year-round",
                applicationProcess: "Direct registration via pmkisan.gov.in"
            }
        ]);

        await MandiRate.deleteMany();
        await MandiRate.insertMany([
            { crop: "Cotton", market: "Warangal", state: "Telangana", modalPrice: 7200, minPrice: 6800, maxPrice: 7500, date: new Date() },
            { crop: "Paddy (Common)", market: "Nalgonda", state: "Telangana", modalPrice: 2200, minPrice: 2183, maxPrice: 2250, date: new Date() },
            { crop: "Chilli (Dry)", market: "Khammam", state: "Telangana", modalPrice: 18500, minPrice: 16000, maxPrice: 21000, date: new Date() }
        ]);

        res.json({ message: "Seed data injected successfully!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Schemes CRUD
export const getSchemes = async (req, res) => {
    try {
        const schemes = await Scheme.find().sort({ createdAt: -1 });
        res.json(schemes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createScheme = async (req, res) => {
    try {
        const newScheme = new Scheme(req.body);
        await newScheme.save();
        res.status(201).json(newScheme);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateScheme = async (req, res) => {
    try {
        const updated = await Scheme.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteScheme = async (req, res) => {
    try {
        await Scheme.findByIdAndDelete(req.params.id);
        res.json({ message: "Scheme deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Mandi Rates CRUD
export const getMandiRates = async (req, res) => {
    try {
        const rates = await MandiRate.find().sort({ date: -1 });
        res.json(rates);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createMandiRate = async (req, res) => {
    try {
        const newRate = new MandiRate(req.body);
        await newRate.save();
        res.status(201).json(newRate);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateMandiRate = async (req, res) => {
    try {
        const updated = await MandiRate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteMandiRate = async (req, res) => {
    try {
        await MandiRate.findByIdAndDelete(req.params.id);
        res.json({ message: "Rate deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* -------------------------------------------------------------------------- */
/* COMMUNITY MODERATION (Reported Posts)                                      */
/* -------------------------------------------------------------------------- */
export const getCommunityReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate({
                path: "post",
                populate: { path: "user", select: "name phone village district profileImage userType" }
            })
            .populate("postAuthor", "name phone village district profileImage userType")
            .populate("reporter", "name phone village district")
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (err) {
        console.error("Error fetching moderation reports:", err);
        res.status(500).json({ message: "Failed to fetch reports", error: err.message });
    }
};

export const updateReportStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["pending", "under_review", "dismissed", "resolved"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: "Report not found" });

        report.status = status;
        await report.save();

        res.json({ success: true, report });
    } catch (err) {
        console.error("Error updating report status:", err);
        res.status(500).json({ message: "Failed to update report status", error: err.message });
    }
};

export const takeModerationAction = async (req, res) => {
    try {
        const { action, reason } = req.body; // 'dismiss' | 'remove_post'
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: "Report not found" });

        const adminId = req.admin?.id;
        const adminName = req.admin?.name || "Admin";

        if (action === "remove_post") {
            // Remove the reported post permanently
            if (report.post) {
                await Post.findByIdAndDelete(report.post);
            }
            // Mark all reports for this post as resolved
            await Report.updateMany(
                { post: report.post },
                {
                    $set: {
                        status: "resolved",
                        adminAction: {
                            action: "post_removed",
                            adminId,
                            adminName,
                            reason: reason || "Violated community guidelines",
                            actionDate: new Date()
                        }
                    }
                }
            );
            return res.json({ success: true, message: "Post removed and report marked as resolved." });
        } else if (action === "dismiss") {
            // Dismiss this report
            report.status = "dismissed";
            report.adminAction = {
                action: "dismissed",
                adminId,
                adminName,
                reason: reason || "No violation found",
                actionDate: new Date()
            };
            await report.save();

            // If no other pending reports for post, update post.isReported
            const pendingForPost = await Report.countDocuments({ post: report.post, status: { $in: ["pending", "under_review"] } });
            if (pendingForPost === 0) {
                await Post.findByIdAndUpdate(report.post, { isReported: false });
            }

            return res.json({ success: true, message: "Report dismissed." });
        }

        res.status(400).json({ message: "Invalid moderation action." });
    } catch (err) {
        console.error("Error in moderation action:", err);
        res.status(500).json({ message: "Failed to process moderation action", error: err.message });
    }
};
