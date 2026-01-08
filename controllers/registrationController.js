// controllers/registrationController.js

const RegistrationModel = require('../models/registrationModel');
const TestModel = require('../models/testModel');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const PUBLIC_RESULTS_DIR = path.join(__dirname, '..', 'public', 'results');
if (!fs.existsSync(PUBLIC_RESULTS_DIR)) {
    fs.mkdirSync(PUBLIC_RESULTS_DIR, { recursive: true });
}

exports.getAllRegistrations = async (req, res) => {
    try {
        const { search } = req.query;
        let rows;
        if (search) {
            rows = await RegistrationModel.search(search);
        } else {
            rows = await RegistrationModel.getAll();
        }
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (err) {
        console.error('Error getting registrations:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getRegistrationById = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await RegistrationModel.findById(id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        res.json({
            success: true,
            data: registration
        });
    } catch (err) {
        console.error('Error getting registration:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.createRegistration = async (req, res) => {
    try {
        const data = req.body;
        const user = req.user;

        if (!data.petugas_input) {
            data.petugas_input = user.username;
        }

        const result = await RegistrationModel.create(data);

        res.status(201).json({
            success: true,
            message: 'Data berhasil disimpan',
            data: result
        });
    } catch (err) {
        console.error('Error creating registration:', err);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + err.message
        });
    }
};

exports.startSampling = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await RegistrationModel.findById(id);

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }

        // Update ke proses_sampling
        await RegistrationModel.setStatus(id, 'proses_sampling');

        res.json({
            success: true,
            message: 'Status: Sedang dalam pengambilan sampel'
        });
    } catch (err) {
        console.error('Error starting sampling:', err);
        res.status(500).json({ success: false, message: 'Gagal update status' });
    }
};

exports.sendToLab = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await RegistrationModel.findById(id);

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }

        // Pastikan urutannya benar
        if (registration.status !== 'proses_sampling') {
            // Opsional: Bolehkan skip jika kebijakan membolehkan, tapi idealnya urut.
            // Disini kita biarkan update saja.
        }

        // Update ke diterima_lab
        await RegistrationModel.setStatus(id, 'diterima_lab');

        res.json({
            success: true,
            message: 'Sampel berhasil dikirim dan diterima oleh Lab'
        });
    } catch (err) {
        console.error('Error sending to lab:', err);
        res.status(500).json({ success: false, message: 'Gagal update status' });
    }
};

exports.receiveSample = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek apakah registration ada
        const registration = await RegistrationModel.findById(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Update status menjadi 'diterima_lab'
        await RegistrationModel.setStatus(id, 'diterima_lab');

        res.json({
            success: true,
            message: 'Sampel diterima di lab'
        });
    } catch (err) {
        console.error('Error receiving sample:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.updateRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const registration = await RegistrationModel.update(id, data);

        res.json({
            success: true,
            message: 'Registration updated successfully',
            data: registration
        });
    } catch (err) {
        console.error('Error updating registration:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.deleteRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await RegistrationModel.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        res.json({
            success: true,
            message: 'Registration deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting registration:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getLabQueue = async (req, res) => {
    try {
        const rows = await RegistrationModel.getLabQueue();
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error getting lab queue:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.publishResults = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek apakah registration ada
        const registration = await RegistrationModel.findById(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Cek apakah semua test sudah selesai dan divalidasi
        const tests = await TestModel.getTestsByRegistrationId(id);
        if (tests.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No test results available'
            });
        }

        // Cek status validation
        const allTestsCompleted = tests.every(t => t.status === 'completed');
        if (!allTestsCompleted) {
            return res.status(400).json({
                success: false,
                message: 'Some test results are not completed yet'
            });
        }

        const validationStats = await TestModel.areAllTestsValidated(id);
        if (validationStats.rejected > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some test results are rejected. Please fix them first.'
            });
        }

        if (validationStats.approved < validationStats.total) {
            return res.status(400).json({
                success: false,
                message: 'Not all tests have been validated'
            });
        }

        // Generate PDF
        const filename = `result_${registration.no_sampel_lab}_${Date.now()}.pdf`;
        const filepath = path.join(PUBLIC_RESULTS_DIR, filename);


        stream.on('finish', async () => {
            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            const link = `${baseUrl}/public/results/${filename}`;

            // Gunakan setLinkResult yang sudah ada
            await RegistrationModel.setLinkResult(id, link);

            res.json({
                success: true,
                message: 'PDF hasil berhasil digenerate',
                data: {
                    link: link,
                    filename: filename
                }
            });
        });

        stream.on('error', (err) => {
            console.error('PDF generation error:', err);
            res.status(500).json({
                success: false,
                message: 'PDF generation failed'
            });
        });

    } catch (err) {
        console.error('Error publishing results:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};


exports.getRegistrationStats = async (req, res) => {
    try {
        const db = require('../config/dbConfig');

        // PERBAIKI QUERY INI - Sesuaikan dengan field yang ada di database
        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'terdaftar' THEN 1 ELSE 0 END) as terdaftar,
                SUM(CASE WHEN status = 'diterima_lab' THEN 1 ELSE 0 END) as diterima_lab,
                SUM(CASE WHEN status = 'proses_lab' THEN 1 ELSE 0 END) as proses_lab,
                SUM(CASE WHEN status = 'selesai_uji' THEN 1 ELSE 0 END) as selesai_uji,
                SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai
            FROM registrations
            WHERE DATE(created_at) = CURDATE()
        `;

        console.log('Executing stats query:', sql); // Log untuk debug

        const result = await db.query(sql);

        console.log('Stats result:', result); // Log untuk debug

        res.json({
            success: true,
            data: result.length > 0 ? result[0] : {
                total: 0,
                terdaftar: 0,
                diterima_lab: 0,
                proses_lab: 0,
                selesai_uji: 0,
                selesai: 0
            }
        });
    } catch (err) {
        console.error('Error getting stats:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message // Tambahkan detail error
        });
    }
};

exports.startProcessing = async (req, res) => {
    try {
        const { id } = req.params;
        await RegistrationModel.setStatus(id, 'proses_lab');
        res.json({
            success: true,
            message: 'Sampel mulai diproses oleh lab'
        });
    } catch (err) {
        console.error('Error starting processing:', err);
        res.status(500).json({ success: false, message: 'Gagal memproses sampel' });
    }
};

// fungsi getRegistrationStats untuk dashboard yang lebih detail
exports.getRegistrationStats = async (req, res) => {
    try {
        const db = require('../config/dbConfig');
        const sql = `
            SELECT 
                COUNT(*) as total,
                -- Waiting Sampler gabungan Terdaftar + Proses Sampling (agar dashboard ringkas)
                -- Atau dipisah jika ingin detail
                SUM(CASE WHEN status = 'terdaftar' THEN 1 ELSE 0 END) as waiting_queue,
                SUM(CASE WHEN status = 'proses_sampling' THEN 1 ELSE 0 END) as in_sampling,
                SUM(CASE WHEN status = 'diterima_lab' THEN 1 ELSE 0 END) as waiting_process,
                SUM(CASE WHEN status = 'proses_lab' THEN 1 ELSE 0 END) as in_testing,
                SUM(CASE WHEN status = 'selesai_uji' THEN 1 ELSE 0 END) as waiting_validation,
                SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as completed
            FROM registrations
        `;

        const result = await db.query(sql);
        const data = result[0];

        // Kita gabungkan untuk kemudahan mapping di frontend lama, 
        // atau kirim raw data biar frontend yang atur.
        res.json({
            success: true,
            data: result.length > 0 ? {
                ...data,
                // Helper field: terdaftar dihitung dari queue + sedang sampling
                terdaftar: Number(data.waiting_queue) + Number(data.in_sampling)
            } : {}
        });
    } catch (err) {
        console.error('Error getting stats:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.finalizeRegistration = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek keberadaan data
        const registration = await RegistrationModel.findById(id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }

        // Update status langsung ke selesai
        await RegistrationModel.setStatus(id, 'selesai');

        res.json({
            success: true,
            message: 'Registrasi telah diselesaikan dan siap cetak LHU'
        });
    } catch (err) {
        console.error('Error finalizing registration:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllTimeStats = async (req, res) => {
    try {
        const db = require('../config/dbConfig');

        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'terdaftar' THEN 1 ELSE 0 END) as terdaftar,
                SUM(CASE WHEN status = 'diterima_lab' THEN 1 ELSE 0 END) as diterima_lab,
                SUM(CASE WHEN status = 'proses_lab' THEN 1 ELSE 0 END) as proses_lab,
                SUM(CASE WHEN status = 'selesai_uji' THEN 1 ELSE 0 END) as selesai_uji,
                SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai
            FROM registrations
        `;

        const result = await db.query(sql);

        res.json({
            success: true,
            data: result.length > 0 ? result[0] : {
                total: 0,
                terdaftar: 0,
                diterima_lab: 0,
                proses_lab: 0,
                selesai_uji: 0,
                selesai: 0
            }
        });
    } catch (err) {
        console.error('Error getting all time stats:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};