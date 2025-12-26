// models/masterModel.js

const db = require('../config/dbConfig');

const MasterModel = {
    async getAllPemeriksaan() {
        const rows = await db.query(
            'SELECT * FROM master_pemeriksaan ORDER BY kategori, nama_pemeriksaan'
        );
        return rows;
    },

    async getPemeriksaanByIds(ids) {
        if (!ids || ids.length === 0) return [];
        const placeholders = ids.map(() => '?').join(',');
        const sql = `SELECT * FROM master_pemeriksaan WHERE id IN (${placeholders})`;
        return await db.query(sql, ids);
    },

    async findById(id) {
        const rows = await db.query('SELECT * FROM master_pemeriksaan WHERE id = ?', [id]);
        return rows[0];
    },

    async create(data) {
        const sql = `
            INSERT INTO master_pemeriksaan (kategori, nama_pemeriksaan, satuan, harga)
            VALUES (?, ?, ?, ?)
        `;
        const result = await db.execute(sql, [
            data.kategori,
            data.nama_pemeriksaan,
            data.satuan,
            data.harga
        ]);
        return { id: result.insertId, ...data };
    },

    async update(id, data) {
        const sql = `
            UPDATE master_pemeriksaan 
            SET kategori = ?, nama_pemeriksaan = ?, satuan = ?, harga = ?
            WHERE id = ?
        `;
        await db.execute(sql, [
            data.kategori,
            data.nama_pemeriksaan,
            data.satuan,
            data.harga,
            id
        ]);
        return { id, ...data };
    },

    async delete(id) {
        // Hati-hati: Idealnya cek dulu apakah sudah dipakai di transaksi registration_details
        // Namun untuk simpel, kita delete saja (pastikan constraint DB aman/cascade)
        const result = await db.execute('DELETE FROM master_pemeriksaan WHERE id = ?', [id]);
        return result;
    }
};

module.exports = MasterModel;