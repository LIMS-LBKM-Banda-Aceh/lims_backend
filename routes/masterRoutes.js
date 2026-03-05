// routes/masterRoutes.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/masterController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/instalasi', authenticate, controller.getAllInstalasi);
router.post('/instalasi', authenticate, authorize(['admin', 'input', 'lab']), controller.createInstalasi);
router.put('/instalasi/:id', authenticate, authorize(['admin', 'input', 'lab']), controller.updateInstalasi);
router.delete('/instalasi/:id', authenticate, authorize(['admin', 'input', 'lab']), controller.deleteInstalasi);

router.post('/pemeriksaan/with-parameters', authenticate, authorize(['admin', 'input', 'lab']), controller.createPemeriksaanWithParameters);
router.put('/pemeriksaan/:id/with-parameters', authenticate, authorize(['admin', 'input', 'lab']), controller.updatePemeriksaanWithParameters);
router.get('/pemeriksaan/:id/detail', authenticate, authorize(['admin', 'lab']), controller.getPemeriksaanDetail);

router.get('/pemeriksaan', authenticate, controller.getAllPemeriksaan);
router.post('/pemeriksaan', authenticate, authorize(['admin', 'input', 'lab']), controller.createPemeriksaan);
router.put('/pemeriksaan/:id', authenticate, authorize(['admin', 'input', 'lab']), controller.updatePemeriksaan);
router.delete('/pemeriksaan/:id', authenticate, authorize(['admin', 'input', 'lab']), controller.deletePemeriksaan);

module.exports = router;