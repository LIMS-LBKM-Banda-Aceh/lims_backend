const express = require('express');
const router = express.Router();
const controller = require('../controllers/masterController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Routes baru untuk paket
router.post('/pemeriksaan/with-parameters',
    authenticate,
    authorize(['admin', 'input']),
    controller.createPemeriksaanWithParameters
);

router.put('/pemeriksaan/:id/with-parameters',
    authenticate,
    authorize(['admin', 'input']),
    controller.updatePemeriksaanWithParameters
);

router.get('/pemeriksaan/:id/detail',
    authenticate,
    authorize(['admin', 'lab']),
    controller.getPemeriksaanDetail
);

// Routes existing tetap dipertahankan untuk backward compatibility
router.get('/pemeriksaan', authenticate, controller.getAllPemeriksaan);
router.post('/pemeriksaan', authenticate, authorize(['admin', 'input']), controller.createPemeriksaan);
router.put('/pemeriksaan/:id', authenticate, authorize(['admin', 'input']), controller.updatePemeriksaan);
router.delete('/pemeriksaan/:id', authenticate, authorize(['admin', 'input']), controller.deletePemeriksaan);

module.exports = router;