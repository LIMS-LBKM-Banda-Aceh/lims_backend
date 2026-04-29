// routes/registrationRoutes.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/registrationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// KHUSUS LAB (Data Anonim)
router.get('/lab-queue', authenticate, authorize(['lab', 'admin']), controller.getLabQueue);

// Stats untuk dashboard
router.get('/stats', authenticate, authorize(['admin', 'input', 'sampler', 'kasir', 'lab', 'validator', 'manajemen']), controller.getRegistrationStats);

router.get('/stats/all-time', authenticate, authorize(['admin', 'input', 'sampler', 'kasir', 'lab', 'validator', 'manajemen']), controller.getAllTimeStats);

router.get('/next-sample-seq', authenticate, controller.getNextSampleSeq);

router.get('/check-sample-no/:no_sampel', authenticate, controller.checkSampleNo);

router.get('/finance/dashboard', authenticate, authorize(['admin', 'kasir', 'manajemen']), controller.getFinanceDashboard);

// Manajemen / Input / Admin (Full Data)
router.get('/', authenticate, authorize(['admin', 'input', 'sampler', 'kasir', 'lab', 'validator', 'manajemen']), controller.getAllRegistrations);
router.get('/check-nik/:nik', authenticate, authorize(['input', 'admin', 'manajemen']), controller.checkPatientByNik);

router.get('/last-invoice', authenticate, authorize(['admin', 'kasir']), controller.getLastInvoice);

router.get('/:id', authenticate, authorize(['admin', 'input', 'sampler', 'kasir', 'lab', 'validator', 'manajemen']), controller.getRegistrationById);
router.post('/', authenticate, authorize(['input', 'admin']), controller.createRegistration);
router.put('/:id', authenticate, authorize(['input', 'admin', 'kasir','manajemen']), controller.updateRegistration);
router.delete('/:id', authenticate, authorize(['admin', 'input']), controller.deleteRegistration);

router.put('/:id/receive', authenticate, authorize(['sampler', 'admin']), controller.receiveSample);

router.put('/:id/start-sampling', authenticate, authorize(['sampler', 'admin']), controller.startSampling);

router.put('/:id/send-to-lab', authenticate, authorize(['sampler', 'admin']), controller.sendToLab);

// --- LAB ACTIONS ---
router.put('/:id/start-process', authenticate, authorize(['lab', 'admin']), controller.startProcessing);

// --- VALIDATOR ACTIONS ---
router.put('/:id/finalize', authenticate, authorize(['validator', 'admin']), controller.finalizeRegistration);

// Publish Results
router.put('/:id/publish', authenticate, authorize(['manajemen', 'admin']), controller.publishResults);

// Upload Custom LHU (Hasil Lab Uji)
router.post('/:id/upload-lhu', authenticate, authorize(['manajemen', 'admin']), upload.single('file'), controller.uploadCustomLHU);

// Hapus Custom LHU
router.delete('/:id/custom-lhu', authenticate, authorize(['manajemen', 'admin']), controller.deleteCustomLHU);

module.exports = router;