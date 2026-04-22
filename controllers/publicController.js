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

        // Pakai Prisma ORM langsung
        const registration = await prisma.registrations.findFirst({
            where: {
                no_reg: no_reg,
                nik: nik
            },
            select: {
                id: true,
                no_reg: true,
                nama_pasien: true,
                tgl_daftar: true,
                status: true,
                link_hasil: true
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

        // Ambil details menggunakan Prisma
        const details = await prisma.registration_details.findMany({
            where: { registration_id: registration.id },
            include: {
                master_pemeriksaan: {
                    select: { nama_pemeriksaan: true }
                }
            }
        });

        res.json({
            success: true,
            data: {
                ...registration,
                pemeriksaan: details.map(d => d.master_pemeriksaan?.nama_pemeriksaan).filter(Boolean)
            }
        });

    } catch (err) {
        console.error('Error tracking:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};