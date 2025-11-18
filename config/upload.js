// config/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure PDF uploads directory exists
const pdfUploadsDir = path.join(__dirname, '..', 'uploads', 'pdfs');
if (!fs.existsSync(pdfUploadsDir)) {
    fs.mkdirSync(pdfUploadsDir, { recursive: true });
}

// Multer configuration for profile image uploads
const profileStorage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});

const profileUpload = multer({ 
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        
        cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'));
    }
});

// Configure PDF storage
const pdfStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads', 'pdfs'))
    },
    filename: function (req, file, cb) {
        cb(null, 'pdf-' + Date.now() + path.extname(file.originalname))
    }
});

// Configure file filter for PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

// Create multer instance for PDF uploads
const pdfUpload = multer({
    storage: pdfStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

module.exports = {
    profileUpload,
    pdfUpload
};