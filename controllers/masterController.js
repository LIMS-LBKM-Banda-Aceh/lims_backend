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

exports.createPemeriksaan = async (req, res) => {
    try {
        // Ambil field baru: nilai_rujukan, metode
        const { kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode } = req.body;

        if (!nama_pemeriksaan || !harga) {
            return res.status(400).json({ success: false, message: 'Nama dan Harga wajib diisi' });
        }

        const result = await MasterModel.create({
            kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode
        });

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
        const { kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode } = req.body;

        const exists = await MasterModel.findById(id);
        if (!exists) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }

        const result = await MasterModel.update(id, {
            kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode
        });

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
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'Data tidak bisa dihapus karena sudah digunakan dalam riwayat registrasi.'
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Endpoint baru untuk create dengan parameter
exports.createPemeriksaanWithParameters = async (req, res) => {
    try {
        const {
            kategori, nama_pemeriksaan, satuan, harga,
            nilai_rujukan, metode, tipe, parameters
        } = req.body;

        if (!nama_pemeriksaan || !harga) {
            return res.status(400).json({
                success: false,
                message: 'Nama dan Harga wajib diisi'
            });
        }

        // Validasi untuk paket - HANYA CEK PARAMETER
        if (tipe === 'paket') {
            if (!parameters || parameters.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Pemeriksaan paket harus memiliki minimal satu parameter'
                });
            }

            // Validasi setiap parameter
            for (const param of parameters) {
                if (!param.parameter_name || !param.parameter_name.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: 'Setiap parameter harus memiliki nama'
                    });
                }
            }
        }

        const result = await MasterModel.createWithParameters({
            kategori, nama_pemeriksaan, satuan: satuan || null,
            harga, nilai_rujukan: nilai_rujukan || null,
            metode: metode || null, tipe: tipe || 'tunggal',
            parameters: parameters || []
        });

        res.status(201).json({
            success: true,
            message: 'Data pemeriksaan berhasil ditambah',
            data: result
        });
    } catch (err) {
        console.error('Error creating pemeriksaan with parameters:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Endpoint untuk update dengan parameter
exports.updatePemeriksaanWithParameters = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            kategori, nama_pemeriksaan, satuan, harga,
            nilai_rujukan, metode, tipe, parameters
        } = req.body;

        const exists = await MasterModel.findById(id);
        if (!exists) {
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan'
            });
        }

        // Validasi untuk paket
        if (tipe === 'paket' && (!parameters || parameters.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Pemeriksaan paket harus memiliki minimal satu parameter'
            });
        }

        const result = await MasterModel.updateWithParameters(id, {
            kategori, nama_pemeriksaan, satuan, harga,
            nilai_rujukan, metode, tipe: tipe || 'tunggal',
            parameters
        });

        res.json({
            success: true,
            message: 'Data pemeriksaan berhasil diupdate',
            data: result
        });
    } catch (err) {
        console.error('Error updating pemeriksaan with parameters:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Endpoint untuk get dengan detail parameter
exports.getPemeriksaanDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await MasterModel.getPemeriksaanWithParameters(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan'
            });
        }

        res.json({ success: true, data });
    } catch (err) {
        console.error('Error getting pemeriksaan detail:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};