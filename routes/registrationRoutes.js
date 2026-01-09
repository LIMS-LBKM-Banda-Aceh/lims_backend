const express = require('express');
const router = express.Router();
// Perhatikan baris ini, nama variabelnya adalah 'controller'
const controller = require('../controllers/registrationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// KHUSUS LAB (Data Anonim)
router.get('/lab-queue', authenticate, authorize(['lab', 'admin']), controller.getLabQueue);

// Stats untuk dashboard
router.get('/stats', authenticate, authorize(['admin', 'manajemen', 'kasir', 'input', 'validator', 'lab']), controller.getRegistrationStats);

router.get('/stats/all-time', authenticate, authorize(['admin', 'manajemen', 'kasir', 'input', 'validator', 'lab', 'kasir']), controller.getAllTimeStats);

// Manajemen / Input / Admin (Full Data)
router.get('/', authenticate, authorize(['input', 'kasir', 'manajemen', 'admin', 'validator', 'lab']), controller.getAllRegistrations);
router.get('/:id', authenticate, authorize(['input', 'kasir', 'manajemen', 'admin', 'validator', 'lab']), controller.getRegistrationById);
router.post('/', authenticate, authorize(['input', 'admin']), controller.createRegistration);
router.put('/:id', authenticate, authorize(['input', 'admin']), controller.updateRegistration);
router.delete('/:id', authenticate, authorize(['admin']), controller.deleteRegistration);

// --- SAMPLER ACTIONS (UPDATED) ---

// Route lama (bisa dihapus jika sudah tidak dipakai, atau dibiarkan untuk backward compatibility)
router.put('/:id/receive', authenticate, authorize(['sampler', 'admin']), controller.receiveSample);

// Route BARU (Tahap 1: Mulai Sampling)
// Menggunakan 'controller', bukan 'registrationController'
router.put('/:id/start-sampling', authenticate, authorize(['sampler', 'admin']), controller.startSampling);

// Route BARU (Tahap 2: Kirim ke Lab)
// Menggunakan 'controller', bukan 'registrationController'
router.put('/:id/send-to-lab', authenticate, authorize(['sampler', 'admin']), controller.sendToLab);

// --- LAB ACTIONS ---
router.put('/:id/start-process', authenticate, authorize(['lab', 'admin']), controller.startProcessing);

// --- VALIDATOR ACTIONS ---
router.put('/:id/finalize', authenticate, authorize(['manajemen', 'admin']), controller.finalizeRegistration);

// Publish Results
router.put('/:id/publish', authenticate, authorize(['validator', 'admin']), controller.publishResults);

module.exports = router;