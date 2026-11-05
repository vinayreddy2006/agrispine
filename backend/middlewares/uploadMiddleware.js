import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Helper to determine file extension from mimetype or originalname
const getFileExtension = (file) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (ext) return ext;

    const mimeMap = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "audio/mpeg": ".mp3",
        "audio/mp3": ".mp3",
        "audio/m4a": ".m4a",
        "audio/wav": ".wav",
        "video/mp4": ".mp4",
        "application/pdf": ".pdf",
        "text/plain": ".txt",
    };
    return mimeMap[file.mimetype] || ".bin";
};

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files to 'uploads/' folder
    },
    filename: (req, file, cb) => {
        // Create unique filename: fieldname-timestamp-random.ext
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = getFileExtension(file);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});

// File Filter (Allow images, audio, video, and documents)
const fileFilter = (req, file, cb) => {
    const allowedMimePrefixes = ["image/", "audio/", "video/"];
    const allowedExactMimes = [
        "application/pdf", 
        "application/msword", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain"
    ];

    const isAllowedMime = 
        allowedMimePrefixes.some(prefix => file.mimetype && file.mimetype.startsWith(prefix)) ||
        allowedExactMimes.includes(file.mimetype);

    // Support uploads where mobile client passes application/octet-stream but filename indicates an allowed extension
    const ext = path.extname(file.originalname || "").toLowerCase();
    const commonAllowedExts = [
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp",
        ".mp3", ".wav", ".m4a", ".aac", ".ogg",
        ".mp4", ".mov", ".avi", ".mkv",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"
    ];
    const isAllowedExt = commonAllowedExts.includes(ext);

    if (isAllowedMime || (file.mimetype === "application/octet-stream" && isAllowedExt)) {
        cb(null, true);
    } else {
        cb(new Error(`File type '${file.mimetype}' is not supported!`), false);
    }
};

export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // Limit 20MB
});
