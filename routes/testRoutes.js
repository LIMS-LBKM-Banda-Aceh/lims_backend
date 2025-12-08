// routes/testRoutes.js

const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Create test for registration
router.post('/registrations/:registrationId/tests', authenticate, authorize(['lab']), testController.createTest);

// Get tests for registration
router.get('/registrations/:registrationId/tests', authenticate, authorize(['lab', 'manajemen', 'input', 'validator']), testController.getTestsForRegistration);

// Update test
router.put('/tests/:testId', authenticate, authorize(['lab']), testController.updateTest);

// Validate test
router.put('/tests/:testId/validate', authenticate, authorize(['validator', 'manajemen']), testController.validateTest);

// Delete test
router.delete('/tests/:testId', authenticate, authorize(['lab', 'manajemen']), testController.deleteTest);

module.exports = router;