// routes/registrationRoutes.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/registrationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Get all registrations (with search)
router.get('/', authenticate, authorize(['lab', 'admin', 'input', 'validator']), controller.getAllRegistrations);

// Get registration by ID
router.get('/:id', authenticate, authorize(['lab', 'admin', 'input', 'validator']), controller.getRegistrationById);

// Create new registration
router.post('/', authenticate, authorize(['input', 'lab', 'admin']), controller.createRegistration);

// Update registration
router.put('/:id', authenticate, authorize(['input', 'lab', 'admin']), controller.updateRegistration);

// Lab receives sample
router.put('/:id/receive', authenticate, authorize(['lab']), controller.receiveSample);

// Publish results
router.post('/:id/publish', authenticate, authorize(['validator', 'admin']), controller.publishResults);

// Get statistics
router.get('/stats/summary', authenticate, authorize(['admin']), controller.getRegistrationStats);

// Delete registration
router.delete('/:id', authenticate, authorize(['admin']), controller.deleteRegistration);

module.exports = router;