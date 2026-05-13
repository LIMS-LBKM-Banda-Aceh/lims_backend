// routes/settingRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/settingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// FIX: Buat rute GET menjadi publik agar LHUPrintTemplate bisa mengambil kop surat dari halaman tracking
router.get('/', controller.getSettings);

// HANYA Admin yang boleh mengubah (PUT) pengaturan (Tetap wajib login)
router.put('/', authenticate, authorize(['admin']), controller.updateSettings);

module.exports = router;