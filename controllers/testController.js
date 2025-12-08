// controllers/testController.js

const TestModel = require('../models/testModel');
const RegistrationModel = require('../models/registrationModel');

exports.createTest = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { parameter_name, nilai, satuan, range_normal } = req.body;

        // Cek registration
        const registration = await RegistrationModel.findById(registrationId);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Cek apakah status sudah diterima di lab
        if (registration.status === 'terdaftar') {
            return res.status(400).json({
                success: false,
                message: 'Sample must be received by lab first'
            });
        }

        const test = await TestModel.createTest(registrationId, {
            parameter_name,
            nilai,
            satuan,
            range_normal
        });

        // Update status registration jika ada nilai
        if (nilai) {
            await RegistrationModel.setStatus(registrationId, 'proses');
        }

        res.status(201).json({
            success: true,
            message: 'Test created successfully',
            data: test
        });
    } catch (err) {
        console.error('Error creating test:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getTestsForRegistration = async (req, res) => {
    try {
        const { registrationId } = req.params;

        // Cek registration
        const registration = await RegistrationModel.findById(registrationId);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        const tests = await TestModel.getTestsByRegistrationId(registrationId);

        res.json({
            success: true,
            data: tests,
            count: tests.length
        });
    } catch (err) {
        console.error('Error getting tests:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.updateTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const data = req.body;

        // Cek test
        const test = await TestModel.findById(testId);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Update status jika nilai diisi
        if (data.nilai) {
            data.status = 'completed';
        }

        const updatedTest = await TestModel.updateTest(testId, data);

        // Cek apakah semua test sudah completed untuk registration ini
        const allTests = await TestModel.getTestsByRegistrationId(test.registration_id);
        const allCompleted = allTests.every(t => t.status === 'completed');

        if (allCompleted) {
            await RegistrationModel.setStatus(test.registration_id, 'proses');
        }

        res.json({
            success: true,
            message: 'Test updated successfully',
            data: updatedTest
        });
    } catch (err) {
        console.error('Error updating test:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.validateTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { validation_status, validation_note } = req.body;
        const user = req.user;

        // Validasi input
        if (!['approved', 'rejected'].includes(validation_status)) {
            return res.status(400).json({
                success: false,
                message: 'validation_status must be "approved" or "rejected"'
            });
        }

        // Cek test
        const test = await TestModel.findById(testId);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        const validatedTest = await TestModel.validateTest(testId, {
            validated_by: user.id,
            validation_status,
            validation_note
        });

        // Cek apakah semua test sudah divalidasi untuk registration ini
        const validationStats = await TestModel.areAllTestsValidated(test.registration_id);

        if (validationStats.approved === validationStats.total) {
            // Semua test approved
            await RegistrationModel.setStatus(test.registration_id, 'tervalidasi');
        } else if (validationStats.rejected > 0) {
            // Ada yang rejected
            await RegistrationModel.setStatus(test.registration_id, 'proses');
        }

        res.json({
            success: true,
            message: 'Test validation updated',
            data: validatedTest
        });
    } catch (err) {
        console.error('Error validating test:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.deleteTest = async (req, res) => {
    try {
        const { testId } = req.params;

        // Cek test
        const test = await TestModel.findById(testId);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        const db = require('../config/dbConfig');
        await db.execute('DELETE FROM registration_tests WHERE id = ?', [testId]);

        res.json({
            success: true,
            message: 'Test deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting test:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};