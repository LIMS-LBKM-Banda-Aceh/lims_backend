// controllers/publicController.js
const prisma = require('../config/prisma');

exports.trackRegistration = async (req, res) => {
    try {
        const { no_reg, nik } = req.body;

        if (!no_reg || !nik) {
            return res.status(400).json({
                success: false,
                message: 'No. Registrasi dan NIK wajib diisi'
            });
        }

        // Pakai Prisma ORM langsung - AMBIL SEMUA FIELD agar LHUPrintTemplate di sisi frontend punya data yang lengkap
        const registration = await prisma.registrations.findFirst({
            where: {
                no_reg: no_reg,
                nik: nik
            }
        });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan. Pastikan No. Registrasi dan NIK benar.'
            });
        }

        // Set default status jika null
        registration.status = registration.status || 'terdaftar';

        // Ambil details master pemeriksaan (Untuk chips display UI tracking)
        const details = await prisma.registration_details.findMany({
            where: { registration_id: registration.id },
            include: {
                master_pemeriksaan: {
                    select: { nama_pemeriksaan: true }
                }
            }
        });

        // Ambil data nilai dan parameter (Untuk tabel LHU Print Template)
        const tests = await prisma.registration_tests.findMany({
            where: { registration_id: registration.id }
        });

        // Ambil pengaturan sistem terkait izin download publik
        const settingDownload = await prisma.system_settings.findFirst({
            where: { setting_key: 'allow_public_download' }
        });

        // Default true jika belum pernah diatur admin
        const allowPublicDownload = settingDownload ? settingDownload.setting_value === 'true' : true;

        res.json({
            success: true,
            data: {
                ...registration,
                pemeriksaan: details.map(d => d.master_pemeriksaan?.nama_pemeriksaan).filter(Boolean),
                tests: tests
            },
            settings: {
                allow_public_download: allowPublicDownload
            }
        });

    } catch (err) {
        console.error('Error tracking:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};