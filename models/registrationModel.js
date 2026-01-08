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

    async getLabQueue() {
        const sql = `
            SELECT * FROM registrations 
            WHERE status NOT IN ('terdaftar', 'proses_sampling') 
            ORDER BY created_at ASC
        `;
        return await db.query(sql);
    },

    async create(data) {
        // [UPDATE] Menerima 'items' yang berisi array { id, qty }
        // Format payload frontend harus: items: [{id: 1, qty: 5}, {id: 2, qty: 1}]
        const { items } = data;

        const no_reg = await this.generateNoReg();
        const no_sampel_lab = await this.generateNoSampelLab();

        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            const m = moment(dateStr);
            return m.isValid() ? m.format('YYYY-MM-DD HH:mm:ss') : null;
        };

        let total_biaya = 0;
        let validItems = [];

        // 1. Ambil Data Master & Hitung Total
        if (items && items.length > 0) {
            // Ambil ID unik untuk query ke master
            const uniqueIds = [...new Set(items.map(i => i.id))];
            const masterData = await MasterModel.getPemeriksaanByIds(uniqueIds);

            // Map master data dengan quantity dari request
            validItems = items.map(reqItem => {
                const master = masterData.find(m => m.id == reqItem.id);
                if (!master) return null;
                return {
                    ...master,
                    qty: reqItem.qty || 1 // Default qty 1
                };
            }).filter(Boolean);

            // LOGIKA BIAYA
            if (data.status_pembayaran === 'berbayar') {
                total_biaya = validItems.reduce((sum, item) => sum + (Number(item.harga) * item.qty), 0);
            } else {
                total_biaya = 0;
            }
        }

        return await db.transaction(async (connection) => {
            // Buat string nama pemeriksaan (misal: "Gula Darah (1), Nyamuk (5)")
            const jenis_pemeriksaan_str = validItems
                .map(i => `${i.nama_pemeriksaan} (${i.qty})`)
                .join(', ');

            const sqlReg = `
            INSERT INTO registrations (
                nama_pasien, tgl_lahir, umur, jenis_kelamin,
                nik, alamat, no_kontak, asal_sampel, pengirim_instansi, 
                tgl_terima, waktu_sampling, tgl_pengambilan, no_sampel_lab, form_pe, petugas_input,
                kode_ins, jenis_pemeriksaan, total_biaya, no_reg, catatan_tambahan, status, status_pembayaran
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
            `;

            const paramsReg = [
                data.nama_pasien, formatDate(data.tgl_lahir), data.umur || null, data.jenis_kelamin || 'L',
                data.nik || null, data.alamat || null, data.no_kontak || null,
                data.asal_sampel || null, data.pengirim_instansi || null,
                formatDate(data.tgl_terima), data.waktu_sampling || null, formatDate(data.tgl_pengambilan),
                no_sampel_lab, data.form_pe || null, data.petugas_input || null,
                data.kode_ins || null, jenis_pemeriksaan_str, total_biaya, no_reg,
                data.catatan_tambahan || null,
                'terdaftar',
                data.status_pembayaran || 'berbayar'
            ];

            const [resultReg] = await connection.execute(sqlReg, paramsReg);
            const registrationId = resultReg.insertId;

            // [UPDATE] Insert Details dengan Looping Quantity
            if (validItems.length > 0) {
                const sqlDetail = `INSERT INTO registration_details (registration_id, pemeriksaan_id, harga_saat_ini) VALUES (?, ?, ?)`;

                const sqlTestInit = `
                INSERT INTO registration_tests 
                (registration_id, parameter_name, satuan, nilai_rujukan, metode, status) 
                VALUES (?, ?, ?, ?, ?, 'pending')
                `;

                for (const item of validItems) {
                    // LOOP SESUAI QUANTITY
                    // Jika qty = 5, maka insert 5 baris agar ada 5 form hasil nanti
                    for (let i = 0; i < item.qty; i++) {
                        // Insert ke tabel detail (history harga)
                        await connection.execute(sqlDetail, [registrationId, item.id, item.harga]);

                        // Insert ke tabel tests (untuk input hasil)
                        // Kita tambahkan penanda indeks jika lebih dari 1, misal "Nyamuk #1", "Nyamuk #2"
                        const paramName = item.qty > 1
                            ? `${item.nama_pemeriksaan} #${i + 1}`
                            : item.nama_pemeriksaan;

                        await connection.execute(sqlTestInit, [
                            registrationId,
                            paramName,
                            item.satuan,
                            item.nilai_rujukan,
                            item.metode
                        ]);
                    }
                }
            }

            return { id: registrationId, no_reg: no_reg };
        });
    },

    // ... (Fungsi getAll, findById, getLabQueue TETAP SAMA) ...
    async getAll() {
        return await db.query('SELECT * FROM registrations ORDER BY created_at DESC');
    },

    async findById(id) {
        const rows = await db.query('SELECT * FROM registrations WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        const registration = rows[0];
        // Note: Detail mungkin perlu disesuaikan cara fetch-nya jika butuh info qty, 
        // tapi logic existing biasanya cukup menampilkan list row.
        const details = await db.query(`
            SELECT rd.*, mp.nama_pemeriksaan 
            FROM registration_details rd
            JOIN master_pemeriksaan mp ON rd.pemeriksaan_id = mp.id
            WHERE rd.registration_id = ?
        `, [id]);
        registration.details = details;
        return registration;
    },

    async getLabQueue() {
        const sql = `
            SELECT * FROM registrations 
            WHERE status NOT IN ('terdaftar', 'proses_sampling') 
            ORDER BY created_at ASC
        `;
        return await db.query(sql);
    },

    // [UPDATE] Fungsi Update juga harus support quantity
    async update(id, data) {
        // Ambil 'items' (array of objects) bukan pemeriksaan_ids
        const { items, pemeriksaan_ids, ...fieldData } = data;

        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            const m = moment(dateStr);
            return m.isValid() ? m.format('YYYY-MM-DD HH:mm:ss') : null;
        };

        const ALLOWED_FIELDS = [
            'nama_pasien', 'tgl_lahir', 'umur', 'jenis_kelamin',
            'nik', 'alamat', 'no_kontak', 'asal_sampel', 'pengirim_instansi',
            'tgl_terima', 'waktu_sampling', 'tgl_pengambilan', 'ket_pengerjaan',
            'no_sampel_lab', 'petugas_input',
            'kode_ins', 'jenis_pemeriksaan', 'catatan_tambahan', 'total_biaya',
            'status', 'link_hasil', 'status_pembayaran'
        ];

        return await db.transaction(async (connection) => {
            // A. Logic Update Pemeriksaan dengan Quantity
            // Kita prioritaskan 'items' (new format). Jika frontend masih kirim 'pemeriksaan_ids', kita convert.
            let itemsToProcess = items;

            // Backward compability kalau frontend edit belum diubah
            if (!itemsToProcess && pemeriksaan_ids) {
                itemsToProcess = pemeriksaan_ids.map(id => ({ id, qty: 1 }));
            }

            if (itemsToProcess && Array.isArray(itemsToProcess)) {
                const uniqueIds = [...new Set(itemsToProcess.map(i => i.id))];
                const masterData = await MasterModel.getPemeriksaanByIds(uniqueIds);

                let validItems = itemsToProcess.map(reqItem => {
                    const master = masterData.find(m => m.id == reqItem.id);
                    if (!master) return null;
                    return { ...master, qty: reqItem.qty || 1 };
                }).filter(Boolean);

                // Hitung total harga item * qty
                let calculatedTotal = validItems.reduce((sum, item) => sum + (Number(item.harga) * item.qty), 0);

                const currentStatus = fieldData.status_pembayaran || 'berbayar';
                if (currentStatus === 'gratis') {
                    calculatedTotal = 0;
                }

                const jenis_pemeriksaan_str = validItems.map(i => `${i.nama_pemeriksaan} (${i.qty})`).join(', ');

                fieldData.total_biaya = calculatedTotal;
                fieldData.jenis_pemeriksaan = jenis_pemeriksaan_str;

                // Reset & Re-insert details
                await connection.execute('DELETE FROM registration_details WHERE registration_id = ?', [id]);
                await connection.execute('DELETE FROM registration_tests WHERE registration_id = ?', [id]);

                if (validItems.length > 0) {
                    const sqlDetail = `INSERT INTO registration_details (registration_id, pemeriksaan_id, harga_saat_ini) VALUES (?, ?, ?)`;
                    const sqlTestInit = `INSERT INTO registration_tests (registration_id, parameter_name, satuan, status) VALUES (?, ?, ?, 'pending')`;

                    for (const item of validItems) {
                        for (let i = 0; i < item.qty; i++) {
                            await connection.execute(sqlDetail, [id, item.id, item.harga]);

                            const paramName = item.qty > 1 ? `${item.nama_pemeriksaan} #${i + 1}` : item.nama_pemeriksaan;
                            await connection.execute(sqlTestInit, [id, paramName, item.satuan]);
                        }
                    }
                }
            }

            // B. Logic Update Data Diri & Status
            const updates = [];
            const values = [];
            const dateFields = ['tgl_lahir', 'tgl_terima', 'tgl_pengambilan'];

            for (const [key, value] of Object.entries(fieldData)) {
                if (ALLOWED_FIELDS.includes(key)) {
                    updates.push(`${key} = ?`);
                    if (dateFields.includes(key) && value) {
                        values.push(formatDate(value));
                    } else {
                        values.push(value);
                    }
                }
            }

            if (updates.length === 0) {
                return { id, message: "Nothing to update" };
            }

            values.push(id);
            const sql = `UPDATE registrations SET ${updates.join(', ')} WHERE id = ?`;
            await connection.execute(sql, values);

            return { id, ...data };
        });
    },

    async delete(id) {
        return await db.transaction(async (connection) => {
            await connection.execute('DELETE FROM registration_details WHERE registration_id = ?', [id]);
            await connection.execute('DELETE FROM registration_tests WHERE registration_id = ?', [id]);
            const [result] = await connection.execute('DELETE FROM registrations WHERE id = ?', [id]);
            return result.affectedRows > 0;
        });
    },

    async setStatus(id, status) {
        let sql = 'UPDATE registrations SET status = ?';
        const params = [status];
        if (status === 'proses_sampling') sql += ', waktu_sampling = CURTIME(), tgl_pengambilan = CURDATE()';
        else if (status === 'diterima_lab') sql += ', tgl_terima = CURDATE()';
        else if (status === 'proses_lab') sql += ', waktu_mulai_periksa = NOW()';
        else if (status === 'selesai_uji') sql += ', waktu_selesai_periksa = NOW()';
        else if (status === 'selesai') sql += ', updated_at = NOW()';
        sql += ' WHERE id = ?';
        params.push(id);
        return await db.execute(sql, params);
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
        WHERE nama_pasien LIKE ? OR no_reg LIKE ? OR no_sampel_lab LIKE ? OR nik LIKE ?
        ORDER BY created_at DESC`;
        const searchTerm = `%${query}%`;
        return await db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm]);
    }
};

module.exports = RegistrationModel;