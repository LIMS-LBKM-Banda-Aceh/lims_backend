const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');

// Pastikan folder public/results tersedia
const PUBLIC_RESULTS_DIR = path.join(__dirname, '..', 'public', 'results');
if (!fs.existsSync(PUBLIC_RESULTS_DIR)) {
    fs.mkdirSync(PUBLIC_RESULTS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, PUBLIC_RESULTS_DIR);
    },
    filename: function (req, file, cb) {
        // Format: custom_lhu_[REG_ID]_[TIMESTAMP].[EXT]
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'custom_lhu_' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});

const fileFilter = (req, file, cb) => {
    // Validasi ekstensi file
    const allowedFileTypes = /pdf|doc|docx|xls|xlsx/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Hanya file PDF, Word (DOC/DOCX), dan Excel (XLS/XLSX) yang diperbolehkan!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit 10MB
    fileFilter: fileFilter
});

module.exports = upload;