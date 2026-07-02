import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.js";
import Scheme from "../models/Scheme.js";
import MandiRate from "../models/MandiRate.js";

// Login
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await AdminUser.findOne({ email });
        if (!admin) return res.status(400).json({ message: "Invalid credentials" });

        const validPass = await bcrypt.compare(password, admin.password);
        if (!validPass) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "24h" });
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
        res.status(201).json({ message: "Admin account created successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Seed Data
export const seedData = async (req, res) => {
    try {
        // Seed Schemes
        await Scheme.deleteMany({});
        const defaultSchemes = [
            {
                name: "pm_kisan_name",
                department: "central_govt",
                amount: "pm_kisan_amount",
                description: "pm_kisan_desc",
                eligibility: "pm_kisan_elig",
                applicationPeriod: "pm_kisan_apply",
                expectedPayment: "pm_kisan_pay",
                website: "https://pmkisan.gov.in"
            },
            {
                name: "rythu_name",
                department: "telangana_govt",
                amount: "rythu_amount",
                description: "rythu_desc",
                eligibility: "rythu_elig",
                applicationPeriod: "rythu_apply",
                expectedPayment: "rythu_pay",
                website: "https://rythubandhu.telangana.gov.in/"
            },
            {
                name: "pmfby_name",
                department: "insurance",
                amount: "pmfby_amount",
                description: "pmfby_desc",
                eligibility: "pmfby_elig",
                applicationPeriod: "pmfby_apply",
                expectedPayment: "pmfby_pay",
                website: "https://pmfby.gov.in/"
            }
        ];
        await Scheme.insertMany(defaultSchemes);

        // Seed Mandi Rates
        await MandiRate.deleteMany({});
        const defaultRates = [
            { crop: "Cotton", market: "Warangal", price: 7200, trend: "falling", priceRange: "7000 - 7400", date: new Date() },
            { crop: "Paddy", market: "Khammam", price: 2183, trend: "rising", priceRange: "2100 - 2250", date: new Date() },
            { crop: "Maize", market: "Nizamabad", price: 1962, trend: "stable", priceRange: "1900 - 2000", date: new Date() },
            { crop: "Chilli", market: "Guntur", price: 18500, trend: "falling", priceRange: "17000 - 19000", date: new Date() },
            { crop: "Turmeric", market: "Nizamabad", price: 14500, trend: "rising", priceRange: "14000 - 15000", date: new Date() }
        ];
        await MandiRate.insertMany(defaultRates);

        res.json({ message: "Seed successful: Mandi Rates and Schemes initialized." });
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
