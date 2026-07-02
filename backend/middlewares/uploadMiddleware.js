import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files to 'uploads/' folder
    },
    filename: (req, file, cb) => {
        // Create unique filename: image-timestamp.ext
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter (Allow images, audio, video, and documents)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/", "audio/", "video/", 
        "application/pdf", 
        "application/msword", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain"
    ];
    
    if (allowedMimeTypes.some(type => file.mimetype.startsWith(type) || file.mimetype === type)) {
        cb(null, true);
    } else {
        cb(new Error("File type not supported!"), false);
    }
};

export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // Limit 20MB
});