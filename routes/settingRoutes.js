const express = require('express');
const router = express.Router();
const controller = require('../controllers/settingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Semua user yang login boleh membaca (GET) pengaturan
router.get('/', authenticate, controller.getSettings);

// HANYA Admin yang boleh mengubah (PUT) pengaturan
router.put('/', authenticate, authorize(['admin']), controller.updateSettings);

module.exports = router;