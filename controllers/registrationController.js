// controllers/registrationController.js

const RegistrationModel = require('../models/registrationModel');
const TestModel = require('../models/testModel');
const PDFDocument = require('pdfkit');
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

        // Tambahkan petugas input dari user yang login
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

        const validationStats = await TestModel.areAllTestsValidated(id);
        if (validationStats.rejected > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some test results are rejected. Please fix them first.'
            });
        }

        // Generate PDF
        const filename = `result_${registration.no_sampel_lab}_${Date.now()}.pdf`;
        const filepath = path.join(PUBLIC_RESULTS_DIR, filename);

        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).font('Helvetica-Bold')
            .text('HASIL PEMERIKSAAN LABORATORIUM', { align: 'center' });
        doc.moveDown();

        // Info Pasien
        doc.fontSize(12).font('Helvetica')
            .text(`No. Registrasi: ${registration.no_reg || '-'}`);
        doc.text(`No. Sampel Lab: ${registration.no_sampel_lab || '-'}`);
        doc.text(`Nama Pasien: ${registration.nama_pasien || '-'}`);
        doc.text(`Tanggal Lahir: ${registration.tgl_lahir ? new Date(registration.tgl_lahir).toLocaleDateString('id-ID') : '-'}`);
        doc.text(`Jenis Kelamin: ${registration.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}`);
        doc.text(`Tanggal Terima: ${registration.tgl_terima ? new Date(registration.tgl_terima).toLocaleDateString('id-ID') : '-'}`);
        doc.moveDown();

        // Tabel Hasil
        doc.fontSize(14).font('Helvetica-Bold')
            .text('HASIL PEMERIKSAAN:', { underline: true });
        doc.moveDown(0.5);

        let y = doc.y;
        const tableTop = y;

        // Header tabel
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Parameter', 50, y);
        doc.text('Hasil', 200, y);
        doc.text('Satuan', 300, y);
        doc.text('Nilai Normal', 350, y);
        doc.text('Status', 450, y);

        y += 20;
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;

        // Isi tabel
        doc.fontSize(10).font('Helvetica');
        for (const test of tests) {
            doc.text(test.parameter_name || '-', 50, y);
            doc.text(test.nilai || '-', 200, y);
            doc.text(test.satuan || '-', 300, y);
            doc.text(test.range_normal || '-', 350, y);

            // Warna status berdasarkan validation
            if (test.validation_status === 'approved') {
                doc.fillColor('green').text('✓ Disetujui', 450, y);
                doc.fillColor('black');
            } else if (test.validation_status === 'rejected') {
                doc.fillColor('red').text('✗ Ditolak', 450, y);
                doc.fillColor('black');
            } else {
                doc.text('Menunggu', 450, y);
            }

            y += 20;
        }

        // Footer
        y += 20;
        doc.fontSize(10)
            .text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 50, y);

        doc.end();

        stream.on('finish', async () => {
            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            const link = `${baseUrl}/public/results/${filename}`;

            await RegistrationModel.setLinkResult(id, link);
            await RegistrationModel.setStatus(id, 'selesai');

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
        const sql = `
            SELECT 
                status,
                COUNT(*) as count
            FROM registrations
            GROUP BY status
        `;

        const db = require('../config/dbConfig');
        const stats = await db.query(sql);

        res.json({
            success: true,
            data: stats
        });
    } catch (err) {
        console.error('Error getting stats:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};