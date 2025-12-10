// models/registrationModel.js

const db = require('../config/dbConfig');
const moment = require('moment');

const RegistrationModel = {
    async generateNoReg() {
        const datePart = moment().format('YYYYMMDD');
        const countQuery = await db.query(
            'SELECT COUNT(*) as cnt FROM registrations WHERE DATE(created_at) = CURDATE()'
        );
        const cnt = countQuery[0] ? countQuery[0].cnt + 1 : 1;
        return `REG-${datePart}-${String(cnt).padStart(3, '0')}`;
    },

    async generateNoSampelLab() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `S${timestamp.toString().slice(-8)}${String(random).padStart(3, '0')}`;
    },

    async getAll() {
        const rows = await db.query(
            'SELECT * FROM registrations ORDER BY created_at DESC'
        );
        return rows;
    },

    async create(data) {
        const no_reg = await this.generateNoReg();
        const no_sampel_lab = await this.generateNoSampelLab();

        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            const m = moment(dateStr);
            return m.isValid() ? m.format('YYYY-MM-DD HH:mm:ss') : null;
        };

        const sql = `
            INSERT INTO registrations (
                no_urut, nama_pasien, tgl_lahir, umur, jenis_kelamin,
                nik, alamat, no_kontak, asal_sampel, no_sampel_asal,
                coding, tgl_terima, tgl_pengambilan, ket_pengerjaan,
                ket_pengiriman, no_sampel_lab, form_pe, petugas_input,
                kode_ins, jenis_pemeriksaan, no_reg, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            data.no_urut || null,
            data.nama_pasien,
            formatDate(data.tgl_lahir),
            data.umur || null,
            data.jenis_kelamin || 'L',
            data.nik || null,
            data.alamat || null,
            data.no_kontak || null,
            data.asal_sampel || null,
            data.no_sampel_asal || null,
            data.coding || null,
            formatDate(data.tgl_terima),
            formatDate(data.tgl_pengambilan),
            data.ket_pengerjaan || null,
            data.ket_pengiriman || null,
            no_sampel_lab,
            data.form_pe || null,
            data.petugas_input || null,
            data.kode_ins || null,
            data.jenis_pemeriksaan || null,
            no_reg,
            'terdaftar'
        ];

        const result = await db.execute(sql, params);

        return {
            id: result.insertId,
            no_reg: no_reg,
            no_sampel_lab: no_sampel_lab
        };
    },

    async findById(id) {
        const rows = await db.query(
            'SELECT * FROM registrations WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    async update(id, data) {
        const fields = Object.keys(data)
            .filter(key => key !== 'id')
            .map(key => `${key} = ?`)
            .join(', ');

        const values = Object.keys(data)
            .filter(key => key !== 'id')
            .map(key => data[key]);

        values.push(id);

        const sql = `UPDATE registrations SET ${fields} WHERE id = ?`;
        await db.execute(sql, values);

        return this.findById(id);
    },

    async delete(id) {
        const result = await db.execute(
            'DELETE FROM registrations WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    },

    async setStatus(id, status) {
        await db.execute(
            'UPDATE registrations SET status = ? WHERE id = ?',
            [status, id]
        );
        return this.findById(id);
    },

    async setLinkResult(id, link) {
        await db.execute(
            'UPDATE registrations SET link_hash = ?, updated_at = NOW() WHERE id = ?',
            [link, id]
        );
        return this.findById(id);
    },

    async search(query) {
        const sql = `
            SELECT * FROM registrations 
            WHERE nama_pasien LIKE ? 
            OR no_sampel_lab LIKE ? 
            OR no_reg LIKE ?
            OR nik LIKE ?
            ORDER BY created_at DESC
        `;
        const searchTerm = `%${query}%`;
        return await db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm]);
    }
};

module.exports = RegistrationModel;