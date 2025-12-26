// models/registrationModel.js

const db = require('../config/dbConfig');
const moment = require('moment');
const MasterModel = require('./masterModel');

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
        const { pemeriksaan_ids } = data;
        const no_reg = await this.generateNoReg();
        const no_sampel_lab = await this.generateNoSampelLab();

        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            const m = moment(dateStr);
            return m.isValid() ? m.format('YYYY-MM-DD HH:mm:ss') : null;
        };

        let total_biaya = 0;
        let selectedItems = [];

        if (pemeriksaan_ids && pemeriksaan_ids.length > 0) {
            selectedItems = await MasterModel.getPemeriksaanByIds(pemeriksaan_ids);
            total_biaya = selectedItems.reduce((sum, item) => sum + Number(item.harga), 0);
        }

        return await db.transaction(async (connection) => {
            // A. Insert Registration Header
            const sqlReg = `
                INSERT INTO registrations (
                    nama_pasien, tgl_lahir, umur, jenis_kelamin,
                    nik, alamat, no_kontak, asal_sampel, no_sampel_asal,
                    coding, tgl_terima, waktu_sampling, tgl_pengambilan, ket_pengerjaan, 
                    ket_pengiriman, no_sampel_lab, form_pe, petugas_input,
                    kode_ins, jenis_pemeriksaan, total_biaya, no_reg, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const jenis_pemeriksaan_str = selectedItems.map(i => i.nama_pemeriksaan).join(', ');

            const paramsReg = [
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
                data.waktu_sampling || null,
                formatDate(data.tgl_pengambilan),
                data.ket_pengerjaan || null,
                data.ket_pengiriman || null,
                no_sampel_lab,
                data.form_pe || null,
                data.petugas_input || null,
                data.kode_ins || null,
                jenis_pemeriksaan_str,
                total_biaya,
                no_reg,
                'terdaftar'
            ];

            const [resultReg] = await connection.execute(sqlReg, paramsReg);
            const registrationId = resultReg.insertId;

            // B. Insert Registration Details
            if (selectedItems.length > 0) {
                const sqlDetail = `INSERT INTO registration_details (registration_id, pemeriksaan_id, harga_saat_ini) VALUES (?, ?, ?)`;
                const sqlTestInit = `INSERT INTO registration_tests (registration_id, parameter_name, satuan, status) VALUES (?, ?, ?, 'pending')`;

                for (const item of selectedItems) {
                    await connection.execute(sqlDetail, [registrationId, item.id, item.harga]);
                    // Optional: Inisialisasi slot test
                    await connection.execute(sqlTestInit, [registrationId, item.nama_pemeriksaan, item.satuan]);
                }
            }

            return {
                id: registrationId,
                no_reg: no_reg,
                no_sampel_lab: no_sampel_lab,
                total_biaya: total_biaya
            };
        });
    },

    async findById(id) {
        // Ambil data registrasi
        const rows = await db.query('SELECT * FROM registrations WHERE id = ?', [id]);
        if (rows.length === 0) return null;

        const registration = rows[0];

        // Ambil details (item pemeriksaan)
        const details = await db.query(`
            SELECT rd.*, mp.nama_pemeriksaan 
            FROM registration_details rd
            JOIN master_pemeriksaan mp ON rd.pemeriksaan_id = mp.id
            WHERE rd.registration_id = ?
        `, [id]);

        registration.details = details;
        return registration;
    },

    // --- FUNGSI UPDATE YANG HILANG ---
    async update(id, data) {
        // 1. Pisahkan pemeriksaan_ids
        const { pemeriksaan_ids, ...fieldData } = data;

        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            const m = moment(dateStr);
            return m.isValid() ? m.format('YYYY-MM-DD HH:mm:ss') : null;
        };

        // 2. Definisi kolom yang BENAR-BENAR ADA di tabel registrations (Sesuai Screenshot)
        const ALLOWED_FIELDS = [
            'nama_pasien', 'tgl_lahir', 'umur', 'jenis_kelamin',
            'nik', 'alamat', 'no_kontak', 'asal_sampel', 'no_sampel_asal',
            'coding', 'tgl_terima', 'waktu_sampling', 'tgl_pengambilan', 'ket_pengerjaan',
            'ket_pengiriman', 'no_sampel_lab', 'form_pe', 'petugas_input',
            'kode_ins', 'jenis_pemeriksaan', 'total_biaya', 'status', 'link_hasil'
            // NOTE: 'updated_at' dihapus karena tidak ada di tabel
        ];

        return await db.transaction(async (connection) => {
            // A. Logic Update Pemeriksaan (Jika ada perubahan item)
            if (pemeriksaan_ids && Array.isArray(pemeriksaan_ids)) {
                const selectedItems = await MasterModel.getPemeriksaanByIds(pemeriksaan_ids);
                const total_biaya = selectedItems.reduce((sum, item) => sum + Number(item.harga), 0);
                const jenis_pemeriksaan_str = selectedItems.map(i => i.nama_pemeriksaan).join(', ');

                // Masukkan hasil hitungan ke fieldData agar ikut ter-update
                fieldData.total_biaya = total_biaya;
                fieldData.jenis_pemeriksaan = jenis_pemeriksaan_str;

                // Reset detail
                await connection.execute('DELETE FROM registration_details WHERE registration_id = ?', [id]);
                await connection.execute('DELETE FROM registration_tests WHERE registration_id = ?', [id]);

                // Insert detail baru
                if (selectedItems.length > 0) {
                    const sqlDetail = `INSERT INTO registration_details (registration_id, pemeriksaan_id, harga_saat_ini) VALUES (?, ?, ?)`;
                    const sqlTestInit = `INSERT INTO registration_tests (registration_id, parameter_name, satuan, status) VALUES (?, ?, ?, 'pending')`;

                    for (const item of selectedItems) {
                        await connection.execute(sqlDetail, [id, item.id, item.harga]);
                        await connection.execute(sqlTestInit, [id, item.nama_pemeriksaan, item.satuan]);
                    }
                }
            }

            // B. Logic Update Data Diri (Hanya field yang diizinkan)
            const updates = [];
            const values = [];
            const dateFields = ['tgl_lahir', 'tgl_terima', 'tgl_pengambilan'];

            for (const [key, value] of Object.entries(fieldData)) {
                // HANYA proses jika key ada di daftar ALLOWED_FIELDS
                if (ALLOWED_FIELDS.includes(key)) {
                    updates.push(`${key} = ?`);

                    if (dateFields.includes(key) && value) {
                        values.push(formatDate(value));
                    } else {
                        values.push(value);
                    }
                }
            }

            // Jika tidak ada field yang valid untuk diupdate, return saja
            if (updates.length === 0) {
                return { id, message: "Nothing to update" };
            }

            values.push(id);
            const sql = `UPDATE registrations SET ${updates.join(', ')} WHERE id = ?`;
            await connection.execute(sql, values);
            return { id, ...data };
        });
    },

    // --- FUNGSI DELETE YANG HILANG ---
    async delete(id) {
        // Karena menggunakan ON DELETE CASCADE di database (biasanya), cukup hapus parent
        // Tapi untuk aman di level aplikasi, kita bisa gunakan Transaction

        return await db.transaction(async (connection) => {
            // Hapus Details
            await connection.execute('DELETE FROM registration_details WHERE registration_id = ?', [id]);
            // Hapus Tests
            await connection.execute('DELETE FROM registration_tests WHERE registration_id = ?', [id]);
            // Hapus Header
            const [result] = await connection.execute('DELETE FROM registrations WHERE id = ?', [id]);

            return result.affectedRows > 0;
        });
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
            'UPDATE registrations SET link_hasil = ?, status = ?, updated_at = NOW() WHERE id = ?',
            [link, 'selesai', id]
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