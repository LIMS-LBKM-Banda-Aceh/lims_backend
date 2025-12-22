// controllers/masterController.js
const MasterModel = require('../models/masterModel');

exports.getAllPemeriksaan = async (req, res) => {
    try {
        const rows = await MasterModel.getAllPemeriksaan();
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error getting master pemeriksaan:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- TAMBAHAN BARU ---

exports.createPemeriksaan = async (req, res) => {
    try {
        const { kategori, nama_pemeriksaan, satuan, harga } = req.body;

        if (!nama_pemeriksaan || !harga) {
            return res.status(400).json({ success: false, message: 'Nama dan Harga wajib diisi' });
        }

        const result = await MasterModel.create({ kategori, nama_pemeriksaan, satuan, harga });

        res.status(201).json({
            success: true,
            message: 'Data pemeriksaan berhasil ditambah',
            data: result
        });
    } catch (err) {
        console.error('Error creating pemeriksaan:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updatePemeriksaan = async (req, res) => {
    try {
        const { id } = req.params;
        const { kategori, nama_pemeriksaan, satuan, harga } = req.body;

        const exists = await MasterModel.findById(id);
        if (!exists) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }

        const result = await MasterModel.update(id, { kategori, nama_pemeriksaan, satuan, harga });

        res.json({
            success: true,
            message: 'Data pemeriksaan berhasil diupdate',
            data: result
        });
    } catch (err) {
        console.error('Error updating pemeriksaan:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deletePemeriksaan = async (req, res) => {
    try {
        const { id } = req.params;
        const exists = await MasterModel.findById(id);
        if (!exists) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }

        await MasterModel.delete(id);

        res.json({ success: true, message: 'Data pemeriksaan berhasil dihapus' });
    } catch (err) {
        console.error('Error deleting pemeriksaan:', err);
        // Cek error foreign key (jika data sudah dipakai transaksi)
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'Data tidak bisa dihapus karena sudah digunakan dalam riwayat registrasi.'
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};