// routes/masterRoutes.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/masterController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public/Auth User (untuk dropdown form registrasi)
router.get('/pemeriksaan', authenticate, controller.getAllPemeriksaan);

// Admin Only (Manage Data)
router.post('/pemeriksaan', authenticate, authorize(['admin']), controller.createPemeriksaan);
router.put('/pemeriksaan/:id', authenticate, authorize(['admin']), controller.updatePemeriksaan);
router.delete('/pemeriksaan/:id', authenticate, authorize(['admin']), controller.deletePemeriksaan);

module.exports = router;