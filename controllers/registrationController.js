// controllers/registrationController.js

const RegistrationModel = require('../models/registrationModel');
const TestModel = require('../models/testModel');
const prisma = require('../config/prisma');
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config();

const PUBLIC_RESULTS_DIR = path.join(__dirname, '..', 'public', 'results');
if (!fs.existsSync(PUBLIC_RESULTS_DIR)) {
    fs.mkdirSync(PUBLIC_RESULTS_DIR, { recursive: true });
}

exports.getAllRegistrations = async (req, res) => {
    try {
        const { search } = req.query;
        const user = req.user;

        if (user.role === 'lab') {
            return res.json({
                success: true,
                data: [],
                count: 0,
                message: 'Akses daftar global dibatasi untuk Lab (Gunakan antrian lab)'
            });
        }

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

exports.checkPatientByNik = async (req, res) => {
    try {
        const { nik } = req.params;

        // Validasi dasar
        if (!nik || nik.length < 16) {
            return res.status(400).json({
                success: false,
                message: 'NIK tidak valid'
            });
        }

        const patient = await RegistrationModel.findLastPatientByNik(nik);

        if (patient) {
            return res.json({
                success: true,
                found: true,
                data: patient,
                message: 'Data pasien lama ditemukan'
            });
        } else {
            return res.json({
                success: true,
                found: false,
                message: 'Data tidak ditemukan (Pasien Baru)'
            });
        }

    } catch (err) {
        console.error('Error checking NIK:', err);
        res.status(500).json({
            success: false,
            message: 'Server error saat pengecekan NIK'
        });
    }
};

exports.checkSampleNo = async (req, res) => {
    try {
        const { no_sampel } = req.params;
        const { excludeId } = req.query;
        if (!no_sampel) {
            return res.status(400).json({ success: false, message: "Nomor sampel kosong" });
        }
        const cleanNo = no_sampel.trim().toUpperCase();
        const available = await RegistrationModel.checkSampleAvailability(cleanNo, excludeId);
        res.json({
            success: true,
            available: available,
            message: available ? "Tersedia" : "Sudah digunakan"
        });
    } catch (err) {
        console.error("Check sample error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getFinanceDashboard = async (req, res) => {
    try {
        const { period, startDate, endDate } = req.query;
        const data = await RegistrationModel.getFinanceStats(period, startDate, endDate);

        res.json({
            success: true,
            data: data
        });
    } catch (err) {
        console.error('Error getting finance stats:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createRegistration = async (req, res) => {
    try {
        const data = req.body;
        const user = req.user;

        if (!data.petugas_input) {
            data.petugas_input = user.fullname;
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

exports.getLastInvoice = async (req, res) => {
    try {
        const lastInvoice = await RegistrationModel.getLastInvoice();
        res.json({ success: true, data: lastInvoice });
    } catch (err) {
        console.error('Error getting last invoice:', err);
        res.status(500).json({ success: false, message: 'Server error' });
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
        let data = req.body; // Ubah const jadi let agar payload bisa dimanipulasi
        const user = req.user;

        // 1. Ambil data asli dari database sebelum diupdate
        const existingData = await RegistrationModel.findById(id);

        if (!existingData) {
            return res.status(404).json({
                success: false,
                message: 'Data registrasi tidak ditemukan'
            });
        }

        // 2. LOGIKA PROTEKSI ALUR (BEST PRACTICE)
        if (existingData.status !== 'terdaftar') {
            // Blokir total untuk role input
            if (user.role === 'input') {
                return res.status(403).json({
                    success: false,
                    message: 'Akses ditolak. Data sudah diproses/masuk antrian, tidak dapat diedit oleh petugas pendaftaran.'
                });
            }

            // Untuk Admin/Role lain: MEREKA BOLEH EDIT TYPO NAMA/ALAMAT, 
            // TAPI DILARANG KERAS MENGUBAH ITEM PEMERIKSAAN.
            // Kita hapus properti items dari payload agar model tidak mereset data test lab.
            if (data.items || data.pemeriksaan_ids) {
                delete data.items;
                delete data.pemeriksaan_ids;
                delete data.total_biaya; // Biaya dikunci agar tidak berubah di tengah jalan
                delete data.status_pembayaran;
            }
        }

        // 3. Lakukan update
        const registration = await RegistrationModel.update(id, data);

        res.json({
            success: true,
            message: existingData.status !== 'terdaftar'
                ? 'Identitas berhasil diupdate. (Item pemeriksaan dikunci karena status sudah berjalan)'
                : 'Registration updated successfully',
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

exports.getNextSampleSeq = async (req, res) => {
    try {
        const result = await RegistrationModel.getNextSampleSeq();
        res.json({
            success: true,
            next_seq: result.next_seq,
            last_sample_string: result.last_sample_string
        });
    } catch (err) {
        console.error("Gagal mendapatkan nomor urut:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getLabQueue = async (req, res) => {
    try {
        const user = req.user;
        const rows = await RegistrationModel.getLabQueue(user.role, user.instalasi_id);
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
        const sql = `
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'terdaftar' THEN 1 ELSE 0 END) as waiting_queue,
            SUM(CASE WHEN status = 'proses_sampling' THEN 1 ELSE 0 END) as in_sampling,
            SUM(CASE WHEN status = 'diterima_lab' THEN 1 ELSE 0 END) as diterima_lab,
            SUM(CASE WHEN status = 'proses_lab' THEN 1 ELSE 0 END) as in_testing,
            SUM(CASE WHEN status = 'menunggu_verifikasi' THEN 1 ELSE 0 END) as waiting_verification,
            SUM(CASE WHEN status = 'selesai_uji' THEN 1 ELSE 0 END) as waiting_validation,
            SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as completed
          FROM registrations
        `;

        const result = await prisma.$queryRawUnsafe(sql);
        const data = result[0];

        res.json({
            success: true,
            data: result.length > 0 ? {
                total: Number(data.total || 0),
                waiting_queue: Number(data.waiting_queue || 0),
                in_sampling: Number(data.in_sampling || 0),
                diterima_lab: Number(data.diterima_lab || 0),
                in_testing: Number(data.in_testing || 0),
                waiting_verification: Number(data.waiting_verification || 0),
                waiting_validation: Number(data.waiting_validation || 0),
                completed: Number(data.completed || 0)
            } : {}
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.verifyRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const registration = await RegistrationModel.findById(id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }

        // REFACTORING: Izinkan Lab memverifikasi (sesuai case role merangkap)
        if (!['lab', 'admin'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Akses ditolak untuk melakukan verifikasi' });
        }
        // Teks fullname otomatis masuk ke field `verifikator` untuk tampil di LHU
        await RegistrationModel.setVerified(id, user.fullname);

        res.json({
            success: true,
            message: 'Data berhasil diverifikasi dan diteruskan ke Dokter / Validator',
            data: { verifikator: user.fullname }
        });
    } catch (err) {
        console.error('Error verifying registration:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }

};

exports.finalizeRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const registration = await RegistrationModel.findById(id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }

        if (registration.status !== 'selesai_uji' && user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Data belum diverifikasi oleh Analis / Verifikator.'
            });
        }
        if (!['validator', 'admin'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Hanya validator atau admin yang dapat melakukan ACC final' });
        }

        const validatorName = user.fullname;
        await RegistrationModel.setStatusAndValidator(id, 'selesai', validatorName);
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

        const result = await prisma.$queryRawUnsafe(sql);
        const data = result[0];

        res.json({
            success: true,
            data: result.length > 0 ? {
                // Sekali lagi, parsing ke Number agar JSON aman
                total: Number(data.total || 0),
                terdaftar: Number(data.terdaftar || 0),
                diterima_lab: Number(data.diterima_lab || 0),
                proses_lab: Number(data.proses_lab || 0),
                selesai_uji: Number(data.selesai_uji || 0),
                selesai: Number(data.selesai || 0)
            } : {
                total: 0, terdaftar: 0, diterima_lab: 0, proses_lab: 0, selesai_uji: 0, selesai: 0
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

exports.getNextRm = async (req, res) => {
    try {
        const data = await RegistrationModel.getNextRekamMedik();
        res.json({ success: true, data });
    } catch (err) {
        console.error("Gagal mendapatkan RM:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.checkPatientByRm = async (req, res) => {
    try {
        const { rm } = req.params;
        if (!rm) {
            return res.status(400).json({ success: false, message: 'RM tidak valid' });
        }

        const patient = await RegistrationModel.findLastPatientByRm(rm);

        if (patient) {
            return res.json({
                success: true, found: true, data: patient, message: 'Data pasien lama ditemukan berdasarkan RM'
            });
        } else {
            return res.json({
                success: true, found: false, message: 'RM belum terdaftar (Pasien Baru)'
            });
        }
    } catch (err) {
        console.error('Error checking RM:', err);
        res.status(500).json({ success: false, message: 'Server error saat pengecekan RM' });
    }
};

exports.updateSpesimen = async (req, res) => {
    try {
        const { id } = req.params;
        const { jenis_spesimen } = req.body;
        
        await RegistrationModel.update(id, { jenis_spesimen });
        
        res.json({
            success: true,
            message: 'Jenis spesimen berhasil disimpan'
        });
    } catch (err) {
        console.error('Error updating spesimen:', err);
        res.status(500).json({ success: false, message: 'Server error gagal menyimpan spesimen' });
    }
};

exports.uploadCustomLHU = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File dokumen LHU tidak ditemukan' });
        }

        // 1. Cek apakah ada file custom LHU lama. Jika ada, hapus dari server agar storage tidak penuh
        const existingData = await RegistrationModel.findById(id);
        if (existingData && existingData.link_hasil && existingData.link_hasil.includes('custom_lhu_')) {
            const oldFilename = existingData.link_hasil.split('/').pop();
            const oldFilePath = path.join(PUBLIC_RESULTS_DIR, oldFilename);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const link = `${baseUrl}/public/results/${req.file.filename}`;

        // Menggunakan fungsi yang sudah ada di model untuk update link
        await RegistrationModel.setLinkResult(id, link);

        res.json({
            success: true,
            message: 'Dokumen LHU Custom berhasil diunggah',
            data: { link_hasil: link }
        });
    } catch (err) {
        console.error('Upload Custom LHU Error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat unggah dokumen' });
    }
};



exports.deleteCustomLHU = async (req, res) => {
    try {
        const { id } = req.params;
        const existingData = await RegistrationModel.findById(id);

        if (!existingData || !existingData.link_hasil) {
            return res.status(404).json({ success: false, message: 'Dokumen LHU tidak ditemukan' });
        }

        // Pastikan hanya bisa menghapus custom LHU (bukan yang auto-generate)
        if (existingData.link_hasil.includes('custom_lhu_')) {
            const filename = existingData.link_hasil.split('/').pop();
            const filePath = path.join(PUBLIC_RESULTS_DIR, filename);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Set link hasil kembali menjadi null (kembali ke state awal/auto-generate)
        await RegistrationModel.setLinkResult(id, null);

        res.json({
            success: true,
            message: 'Custom LHU berhasil dihapus. Sistem kembali menggunakan LHU otomatis.'
        });
    } catch (err) {
        console.error('Delete Custom LHU Error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menghapus dokumen' });
    }
};