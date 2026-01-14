// models/registrationModel.js

const db = require('../config/dbConfig');
const moment = require('moment');
const MasterModel = require('./masterModel');

const RegistrationModel = {
    // ... (Fungsi generateNoReg, generateNoSampelLab, getLabQueue biarkan tetap sama) ...
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
        return await db.query('SELECT * FROM registrations ORDER BY created_at DESC');
    },

    async findById(id) {
        const rows = await db.query('SELECT * FROM registrations WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        const registration = rows[0];
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

    // --- Logic Create Data ---
    async create(data) {
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

        // 1. Validasi & Hitung Biaya
        if (items && items.length > 0) {
            const uniqueIds = [...new Set(items.map(i => i.id))];
            const masterData = await MasterModel.getPemeriksaanByIds(uniqueIds);

            validItems = items.map(reqItem => {
                const master = masterData.find(m => m.id == reqItem.id);
                if (!master) return null;
                return { ...master, qty: reqItem.qty || 1 };
            }).filter(Boolean);

            if (data.status_pembayaran === 'berbayar') {
                total_biaya = validItems.reduce((sum, item) => sum + (Number(item.harga) * item.qty), 0);
            }
        }

        return await db.transaction(async (connection) => {
            // String gabungan nama pemeriksaan
            const jenis_pemeriksaan_str = validItems
                .map(i => `${i.nama_pemeriksaan} (${i.qty})`)
                .join(', ');

            // Insert Header Registration
            const sqlReg = `
            INSERT INTO registrations (
                nama_pasien, tgl_lahir, umur, jenis_kelamin,
                nik, alamat, no_kontak, asal_sampel, pengirim_instansi, 
                tgl_daftar, waktu_daftar, tgl_pengambilan, no_sampel_lab, form_pe, petugas_input,
                kode_ins, jenis_pemeriksaan, total_biaya, no_reg, catatan_tambahan, status, status_pembayaran
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
            `;

            const paramsReg = [
                data.nama_pasien, formatDate(data.tgl_lahir), data.umur || null, data.jenis_kelamin || 'L',
                data.nik || null, data.alamat || null, data.no_kontak || null,
                data.asal_sampel || null, data.pengirim_instansi || null,
                formatDate(data.tgl_daftar), data.waktu_daftar || null, formatDate(data.tgl_pengambilan),
                no_sampel_lab, data.form_pe || null, data.petugas_input || null,
                data.kode_ins || null, jenis_pemeriksaan_str, total_biaya, no_reg,
                data.catatan_tambahan || null, 'terdaftar', data.status_pembayaran || 'berbayar'
            ];

            const [resultReg] = await connection.execute(sqlReg, paramsReg);
            const registrationId = resultReg.insertId;

            // 2. Insert Detail & Tests (LOGIC FIX DISINI)
            if (validItems.length > 0) {
                const sqlDetail = `INSERT INTO registration_details (registration_id, pemeriksaan_id, harga_saat_ini) VALUES (?, ?, ?)`;

                const sqlTestInit = `
                INSERT INTO registration_tests 
                (registration_id, parameter_name, satuan, nilai_rujukan, metode, status) 
                VALUES (?, ?, ?, ?, ?, 'pending')
                `;

                for (const item of validItems) {
                    // Tentukan parameter yang akan diinsert ke tabel hasil
                    let testParameters = [];

                    // FIX: Cek tipe Paket
                    if (item.tipe === 'paket') {
                        // Ambil rincian parameter dari tabel master_pemeriksaan_parameters
                        const [dbParams] = await connection.execute(
                            `SELECT parameter_name, satuan, nilai_rujukan, metode 
                             FROM master_pemeriksaan_parameters 
                             WHERE master_pemeriksaan_id = ? 
                             ORDER BY urutan ASC`,
                            [item.id]
                        );

                        if (dbParams.length > 0) {
                            testParameters = dbParams;
                        } else {
                            // Fallback: Jika tipe paket tapi tidak ada parameter, gunakan header (safety)
                            testParameters.push({
                                parameter_name: item.nama_pemeriksaan,
                                satuan: item.satuan,
                                nilai_rujukan: item.nilai_rujukan,
                                metode: item.metode
                            });
                        }
                    } else {
                        // Tipe Tunggal
                        testParameters.push({
                            parameter_name: item.nama_pemeriksaan,
                            satuan: item.satuan,
                            nilai_rujukan: item.nilai_rujukan,
                            metode: item.metode
                        });
                    }

                    // Loop Quantity (jika pasien minta 2x tes yang sama)
                    for (let i = 0; i < item.qty; i++) {
                        // Insert Detail Biaya (Satu baris per quantity item master)
                        await connection.execute(sqlDetail, [registrationId, item.id, item.harga]);

                        // Insert Tests (Sebanyak jumlah parameter x quantity)
                        for (const param of testParameters) {
                            // Handle penamaan jika qty > 1
                            const finalParamName = item.qty > 1
                                ? `${param.parameter_name} #${i + 1}`
                                : param.parameter_name;

                            await connection.execute(sqlTestInit, [
                                registrationId,
                                finalParamName,
                                param.satuan || null,
                                param.nilai_rujukan || null,
                                param.metode || null
                            ]);
                        }
                    }
                }
            }

            return { id: registrationId, no_reg: no_reg };
        });
    },

    // --- BAGIAN FIX UTAMA: UPDATE ---
    async update(id, data) {
        const { items, pemeriksaan_ids, ...fieldData } = data;

        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            const m = moment(dateStr);
            return m.isValid() ? m.format('YYYY-MM-DD HH:mm:ss') : null;
        };

        const ALLOWED_FIELDS = [
            'nama_pasien', 'tgl_lahir', 'umur', 'jenis_kelamin',
            'nik', 'alamat', 'no_kontak', 'asal_sampel', 'pengirim_instansi',
            'tgl_daftar', 'waktu_daftar', 'tgl_pengambilan', 'ket_pengerjaan',
            'no_sampel_lab', 'petugas_input', 'no_invoice',
            'kode_ins', 'jenis_pemeriksaan', 'catatan_tambahan', 'total_biaya',
            'status', 'link_hasil', 'status_pembayaran'
        ];

        return await db.transaction(async (connection) => {
            // A. Logic Update Pemeriksaan
            let itemsToProcess = items;
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

                // Recalculate Total
                let calculatedTotal = validItems.reduce((sum, item) => sum + (Number(item.harga) * item.qty), 0);
                if ((fieldData.status_pembayaran || 'berbayar') === 'gratis') {
                    calculatedTotal = 0;
                }

                fieldData.total_biaya = calculatedTotal;
                fieldData.jenis_pemeriksaan = validItems.map(i => `${i.nama_pemeriksaan} (${i.qty})`).join(', ');

                // RESET DATA LAMA
                await connection.execute('DELETE FROM registration_details WHERE registration_id = ?', [id]);
                await connection.execute('DELETE FROM registration_tests WHERE registration_id = ?', [id]);

                // INSERT ULANG DENGAN LOGIKA PAKET
                if (validItems.length > 0) {
                    const sqlDetail = `INSERT INTO registration_details (registration_id, pemeriksaan_id, harga_saat_ini) VALUES (?, ?, ?)`;
                    const sqlTestInit = `INSERT INTO registration_tests (registration_id, parameter_name, satuan, nilai_rujukan, metode, status) VALUES (?, ?, ?, ?, ?, 'pending')`;

                    for (const item of validItems) {
                        // Logic deteksi paket yang sama dengan CREATE
                        let testParameters = [];
                        if (item.tipe === 'paket') {
                            const [dbParams] = await connection.execute(
                                `SELECT parameter_name, satuan, nilai_rujukan, metode 
                                 FROM master_pemeriksaan_parameters 
                                 WHERE master_pemeriksaan_id = ? 
                                 ORDER BY urutan ASC`,
                                [item.id]
                            );
                            if (dbParams.length > 0) testParameters = dbParams;
                            else testParameters.push({
                                parameter_name: item.nama_pemeriksaan,
                                satuan: item.satuan,
                                nilai_rujukan: item.nilai_rujukan,
                                metode: item.metode
                            });
                        } else {
                            testParameters.push({
                                parameter_name: item.nama_pemeriksaan,
                                satuan: item.satuan,
                                nilai_rujukan: item.nilai_rujukan,
                                metode: item.metode
                            });
                        }

                        for (let i = 0; i < item.qty; i++) {
                            await connection.execute(sqlDetail, [id, item.id, item.harga]);

                            for (const param of testParameters) {
                                const finalParamName = item.qty > 1
                                    ? `${param.parameter_name} #${i + 1}`
                                    : param.parameter_name;

                                await connection.execute(sqlTestInit, [
                                    id,
                                    finalParamName,
                                    param.satuan || null,
                                    param.nilai_rujukan || null,
                                    param.metode || null
                                ]);
                            }
                        }
                    }
                }
            }

            // B. Logic Update Data Diri (Standard)
            const updates = [];
            const values = [];
            const dateFields = ['tgl_lahir', 'tgl_daftar', 'tgl_pengambilan'];

            for (const [key, value] of Object.entries(fieldData)) {
                if (ALLOWED_FIELDS.includes(key)) {
                    updates.push(`${key} = ?`);
                    values.push(dateFields.includes(key) && value ? formatDate(value) : value);
                }
            }

            if (updates.length > 0) {
                values.push(id);
                await connection.execute(`UPDATE registrations SET ${updates.join(', ')} WHERE id = ?`, values);
            }

            return { id, ...data };
        });
    },

    // ... (Fungsi delete, setStatus, dll biarkan tetap sama) ...
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
        if (status === 'proses_sampling') sql += ', waktu_daftar = CURTIME(), tgl_pengambilan = CURDATE()';
        else if (status === 'diterima_lab') sql += ', tgl_daftar = CURDATE()';
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