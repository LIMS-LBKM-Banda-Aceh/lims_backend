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
        const user = req.user; // Diambil dari token oleh authMiddleware

        // 1. Ambil data asli dari database sebelum diupdate
        const existingData = await RegistrationModel.findById(id);

        if (!existingData) {
            return res.status(404).json({
                success: false,
                message: 'Data registrasi tidak ditemukan'
            });
        }

        // 2. LOGIKA PROTEKSI EDIT:
        // Jika role adalah 'input' tapi status saat ini sudah bukan 'terdaftar', TOLAK UPDATE.
        if (user.role === 'input' && existingData.status !== 'terdaftar') {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak. Petugas input hanya dapat mengubah data dengan status Terdaftar.'
            });
        }

        // 3. Jika lolos validasi, lakukan update
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
        const user = req.user; // Data dari authMiddleware

        // 1. Ambil data registrasi terlebih dahulu untuk cek status
        const registration = await RegistrationModel.findById(id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Data registrasi tidak ditemukan'
            });
        }

        // 2. LOGIKA PROTEKSI:
        // Jika user adalah 'input' tapi status BUKAN 'terdaftar', maka TOLAK.
        if (user.role === 'input' && registration.status !== 'terdaftar') {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak. Petugas input hanya boleh menghapus data yang belum diproses (Status: Terdaftar).'
            });
        }

        // 3. Eksekusi hapus (Admin lolos semua, Input lolos jika status 'terdaftar')
        const deleted = await RegistrationModel.delete(id);

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
        SUM(CASE WHEN status = 'terdaftar' THEN 1 ELSE 0 END) as waiting_queue,
        SUM(CASE WHEN status = 'proses_sampling' THEN 1 ELSE 0 END) as in_sampling,
        SUM(CASE WHEN status = 'diterima_lab' THEN 1 ELSE 0 END) as diterima_lab,
        SUM(CASE WHEN status = 'proses_lab' THEN 1 ELSE 0 END) as in_testing,
        SUM(CASE WHEN status = 'selesai_uji' THEN 1 ELSE 0 END) as waiting_validation,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as completed
      FROM registrations
    `;

        const result = await db.query(sql);
        const data = result[0];

        res.json({
            success: true,
            data: result.length > 0 ? {
                ...data,
                // PERBAIKAN: Jangan gabungkan, kirim terpisah
                waiting_queue: Number(data.waiting_queue || 0),
                in_sampling: Number(data.in_sampling || 0),
                diterima_lab: Number(data.diterima_lab || 0),
                in_testing: Number(data.in_testing || 0),
                waiting_validation: Number(data.waiting_validation || 0),
                completed: Number(data.completed || 0)
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