// controllers/masterController.js

const MasterModel = require('../models/masterModel');

exports.getAllInstalasi = async (req, res) => {
    try {
        const rows = await MasterModel.getAllInstalasi();
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error getting instalasi:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createInstalasi = async (req, res) => {
    try {
        const { kode_instalasi, nama_instalasi, kode_sampel } = req.body;

        if (!kode_instalasi || !nama_instalasi || !kode_sampel) {
            return res.status(400).json({ success: false, message: 'Semua field instalasi wajib diisi' });
        }

        const result = await MasterModel.createInstalasi({ kode_instalasi, nama_instalasi, kode_sampel });

        res.status(201).json({
            success: true,
            message: 'Instalasi berhasil ditambah',
            data: result
        });
    } catch (err) {
        console.error('Error creating instalasi:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- TAMBAHAN BARU ---
exports.updateInstalasi = async (req, res) => {
    try {
        const { id } = req.params;
        const { kode_instalasi, nama_instalasi, kode_sampel } = req.body;

        if (!kode_instalasi || !nama_instalasi || !kode_sampel) {
            return res.status(400).json({ success: false, message: 'Semua field instalasi wajib diisi' });
        }

        const result = await MasterModel.updateInstalasi(id, { kode_instalasi, nama_instalasi, kode_sampel });

        res.json({
            success: true,
            message: 'Instalasi berhasil diupdate',
            data: result
        });
    } catch (err) {
        console.error('Error updating instalasi:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteInstalasi = async (req, res) => {
    try {
        const { id } = req.params;
        await MasterModel.deleteInstalasi(id);
        res.json({ success: true, message: 'Instalasi berhasil dihapus' });
    } catch (err) {
        console.error('Error deleting instalasi:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'Data instalasi tidak bisa dihapus karena sudah digunakan pada master pemeriksaan.'
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// ---------------------

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
        const { instalasi_id, kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode } = req.body;

        if (!nama_pemeriksaan || !harga) {
            return res.status(400).json({ success: false, message: 'Nama dan Harga wajib diisi' });
        }

        const result = await MasterModel.create({
            instalasi_id, kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode
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
        const { instalasi_id, kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode } = req.body;

        const exists = await MasterModel.findById(id);
        if (!exists) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }

        const result = await MasterModel.update(id, {
            instalasi_id, kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode
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
        await MasterModel.delete(req.params.id);
        res.json({ success: true, message: 'Data berhasil dihapus' });
    } catch (err) {
        // Tampilkan pesan error spesifik jika gagal hapus karena constraint
        if (err.message.includes('tidak bisa dihapus')) {
            return res.status(400).json({ success: false, message: err.message });
        }
        console.error('Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createPemeriksaanWithParameters = async (req, res) => {
    try {
        const {
            instalasi_id, kategori, nama_pemeriksaan, satuan, harga,
            nilai_rujukan, metode, tipe, parameters
        } = req.body;

        if (!nama_pemeriksaan || !harga) {
            return res.status(400).json({
                success: false,
                message: 'Nama dan Harga wajib diisi'
            });
        }

        if (tipe === 'paket') {
            if (!parameters || parameters.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Pemeriksaan paket harus memiliki minimal satu parameter'
                });
            }

            for (const param of parameters) {
                if (!param.parameter_name?.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: 'Setiap parameter harus memiliki nama'
                    });
                }
            }
        }

        const result = await MasterModel.createWithParameters({
            instalasi_id, kategori, nama_pemeriksaan, satuan: satuan || null,
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

exports.updatePemeriksaanWithParameters = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            instalasi_id, kategori, nama_pemeriksaan, satuan, harga,
            nilai_rujukan, metode, tipe, parameters
        } = req.body;

        const exists = await MasterModel.findById(id);
        if (!exists) {
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan'
            });
        }

        if (tipe === 'paket' && (!parameters || parameters.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Pemeriksaan paket harus memiliki minimal satu parameter'
            });
        }

        const result = await MasterModel.updateWithParameters(id, {
            instalasi_id, kategori, nama_pemeriksaan, satuan, harga,
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
