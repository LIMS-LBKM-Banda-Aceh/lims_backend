const db = require('../config/dbConfig');

exports.trackRegistration = async (req, res) => {
    try {
        const { no_reg, nik } = req.body;

        if (!no_reg || !nik) {
            return res.status(400).json({
                success: false,
                message: 'No. Registrasi dan NIK wajib diisi'
            });
        }

        const sql = `
            SELECT 
                id, no_reg, nama_pasien, tgl_daftar, 
                COALESCE(status, 'terdaftar') AS status,   -- <-- default value
                link_hasil 
                FROM registrations 
                WHERE no_reg = ? AND nik = ?
        `;

        const dbResult = await db.query(sql, [no_reg, nik]);
        
        // 🔥 TRIK SENIOR: Normalisasi hasil query agar kebal dari perbedaan library mysql/mysql2
        const rows = Array.isArray(dbResult[0]) ? dbResult[0] : dbResult;

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan. Pastikan No. Registrasi dan NIK benar.'
            });
        }

        const registration = rows[0];

        const detailsSql = `
            SELECT mp.nama_pemeriksaan 
            FROM registration_details rd
            JOIN master_pemeriksaan mp ON rd.pemeriksaan_id = mp.id
            WHERE rd.registration_id = ?
        `;
        
        const detailsResult = await db.query(detailsSql, [registration.id]);
        // 🔥 Lakukan normalisasi yang sama untuk details
        const details = Array.isArray(detailsResult[0]) ? detailsResult[0] : detailsResult;

        res.json({
            success: true,
            data: {
                ...registration,
                nama_pasien: registration.nama_pasien,
                pemeriksaan: details.map(d => d.nama_pemeriksaan)
            }
        });

    } catch (err) {
        console.error('Error tracking:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};