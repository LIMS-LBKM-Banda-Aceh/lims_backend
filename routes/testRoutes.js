const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Get tests for registration - Lab bisa melihat untuk input hasil
router.get('/registrations/:registrationId/tests', authenticate, authorize(['lab', 'admin', 'validator', 'manajemen']), testController.getTestsForRegistration);

// Update test result - Lab bisa update nilai
router.put('/tests/:testId', authenticate, authorize(['lab', 'admin']), testController.updateTest);

// Update test result (alias untuk frontend)
router.put('/tests/:testId/result', authenticate, authorize(['lab', 'admin']), testController.updateTestResult);

// Validate test - Validator dan admin
router.put('/tests/:testId/validate', authenticate, authorize(['validator', 'admin']), testController.validateTest);

// Create test (jarang digunakan, biasanya auto create dari registration)
router.post('/registrations/:registrationId/tests', authenticate, authorize(['lab', 'admin']), testController.createTest);

// Delete test
router.delete('/tests/:testId', authenticate, authorize(['lab', 'admin']), testController.deleteTest);

module.exports = router;