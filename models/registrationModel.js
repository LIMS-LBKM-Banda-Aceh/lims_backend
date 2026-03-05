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

    async getAll() {
        return await db.query('SELECT * FROM registrations ORDER BY created_at DESC');
    },

    // --- FUNGSI Mengambil Nomor Urut Selanjutnya & Data Terakhir (FIXED) ---
    async getNextSampleSeq() {
        const year = new Date().getFullYear();
        // Mengambil nomor urut terbesar di tahun berjalan BESERTA no_sampel_lab nya
        const sql = `
            SELECT last_sample_seq as max_seq, no_sampel_lab 
            FROM registrations 
            WHERE YEAR(created_at) = ? 
            ORDER BY last_sample_seq DESC 
            LIMIT 1
        `;

        try {
            // FIX: Hapus kurung siku [] di [rows] karena db.query di setup Anda mereturn array langsung
            const rows = await db.query(sql, [year]);

            // Cek apakah rows ada dan memiliki panjang > 0
            if (rows && rows.length > 0) {
                const lastSeq = rows[0].max_seq || 0;
                const lastString = rows[0].no_sampel_lab || "Belum ada data di tahun ini";

                return {
                    next_seq: lastSeq + 1,
                    last_sample_string: lastString
                };
            } else {
                // Jika tabel benar-benar kosong untuk tahun tersebut
                return {
                    next_seq: 1,
                    last_sample_string: "Belum ada data registrasi"
                };
            }
        } catch (error) {
            console.error("Database query error in getNextSampleSeq:", error);
            // Fallback aman jika query gagal
            return {
                next_seq: 1,
                last_sample_string: "Error memuat data terakhir"
            };
        }
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

    async checkSampleAvailability(no_sampel_string, excludeId = null) {
        if (!no_sampel_string) return true;

        const samples = no_sampel_string.split(',').map(s => s.trim()).filter(Boolean);
        if (samples.length === 0) return true;

        for (const sample of samples) {
            let sql = `
                SELECT COUNT(*) as cnt FROM registrations 
                WHERE (no_sampel_lab = ? 
                   OR no_sampel_lab LIKE ? 
                   OR no_sampel_lab LIKE ? 
                   OR no_sampel_lab LIKE ?)
            `;
            const params = [
                sample,
                `${sample}, %`,
                `%, ${sample}, %`,
                `%, ${sample}`
            ];

            if (excludeId) {
                sql += ' AND id != ?';
                params.push(excludeId);
            }

            try {
                const result = await db.query(sql, params);

                let count = 0;
                if (Array.isArray(result)) {
                    if (result.length > 0 && Array.isArray(result[0])) count = result[0][0]?.cnt || 0;
                    else if (result.length > 0 && result[0].cnt !== undefined) count = result[0].cnt;
                    else if (result.length > 0) count = result[0]?.cnt || 0;
                } else if (result?.cnt !== undefined) {
                    count = result.cnt;
                }

                if (count > 0) return false;
            } catch (error) {
                console.error('Error in checkSampleAvailability:', error);
                return true;
            }
        }
        return true;
    },

    async getLastInvoice() {
        const year = new Date().getFullYear();
        const sql = `
        SELECT no_invoice 
        FROM registrations 
        WHERE no_invoice IS NOT NULL 
          AND no_invoice != '' 
          AND no_invoice LIKE '%/690798/PNBP/%' 
          AND YEAR(created_at) = ?
        ORDER BY 
            CAST(SUBSTRING_INDEX(no_invoice, '/', 1) AS UNSIGNED) DESC,
            id DESC 
        LIMIT 1
    `;
        try {
            const rows = await db.query(sql, [year]);
            return rows.length > 0 ? rows[0].no_invoice : null;
        } catch (error) {
            console.error("Error in getLastInvoice:", error);
            return null;
        }
    },

   async getLabQueue(userRole, instalasiId) {
        let sql = `
        SELECT DISTINCT r.* FROM registrations r
        LEFT JOIN registration_details rd ON r.id = rd.registration_id
        LEFT JOIN master_pemeriksaan mp ON rd.pemeriksaan_id = mp.id
        WHERE r.status NOT IN ('terdaftar', 'proses_sampling')
        `;

        const params = [];
        
        if (userRole === 'lab') {
            sql += ` AND mp.instalasi_id = ?`;
            params.push(instalasiId || 0); 
        }

        sql += ` ORDER BY r.created_at ASC`;
        return await db.query(sql, params);
    },

    async findLastPatientByNik(nik) {
        const sql = `
        SELECT 
            nama_pasien, 
            tgl_lahir, 
            jenis_kelamin, 
            alamat, 
            no_kontak 
        FROM registrations 
        WHERE nik = ? 
        ORDER BY created_at DESC 
        LIMIT 1
    `;
        const rows = await db.query(sql, [nik]);
        return rows.length > 0 ? rows[0] : null;
    },

    async create(data) {
        const { items } = data;
        if (!data.no_sampel_lab || data.no_sampel_lab.trim() === "") {
            throw new Error("Nomor Sampel Lab wajib diisi!");
        }
        const no_sampel_lab = data.no_sampel_lab.trim().toUpperCase();

        const isAvailable = await this.checkSampleAvailability(no_sampel_lab);
        if (!isAvailable) {
            throw new Error(`Nomor Sampel "${no_sampel_lab}" sudah digunakan. Mohon refresh atau gunakan nomor lain.`);
        }

        // AUTO-EXTRACT: Ambil nomor urut paling besar dari string inputan (misal "1 IMB 12 2 2026")
        let max_seq = 0;
        const samples = no_sampel_lab.split(',').map(s => s.trim());
        for (const s of samples) {
            const parts = s.split(' ');
            if (parts.length >= 3) {
                const seqStr = parts[parts.length - 3]; // Posisi ke-3 dari kanan pasti nomor urut
                const seqNum = parseInt(seqStr, 10);
                if (!isNaN(seqNum) && seqNum > max_seq) {
                    max_seq = seqNum;
                }
            }
        }

        const no_reg = await this.generateNoReg();

        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            const m = moment(dateStr);
            return m.isValid() ? m.format('YYYY-MM-DD HH:mm:ss') : null;
        };

        const serverTime = moment();
        const tgl_daftar_fix = serverTime.format('YYYY-MM-DD');
        const waktu_daftar_fix = serverTime.format('HH:mm:ss');

        let total_biaya = 0;
        let validItems = [];

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
            const jenis_pemeriksaan_str = validItems
                .map(i => `${i.nama_pemeriksaan} (${i.qty})`)
                .join(', ');

            // INSERT Ditambahkan kolom 'last_sample_seq'
            const sqlReg = `
            INSERT INTO registrations (
                nama_pasien, tgl_lahir, umur, jenis_kelamin,
                nik, alamat, no_kontak, asal_sampel, pengirim_instansi, 
                tgl_daftar, waktu_daftar, tgl_pengambilan, no_sampel_lab, form_pe, petugas_input,
                kode_ins, jenis_pemeriksaan, total_biaya, no_reg, catatan_tambahan, status, status_pembayaran, last_sample_seq
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
            `;

            const paramsReg = [
                data.nama_pasien, formatDate(data.tgl_lahir), data.umur || null, data.jenis_kelamin || 'L',
                data.nik || null, data.alamat || null, data.no_kontak || null,
                data.asal_sampel || null, data.pengirim_instansi || null,
                tgl_daftar_fix, waktu_daftar_fix, formatDate(data.tgl_pengambilan),
                no_sampel_lab, data.form_pe || null, data.petugas_input || null,
                data.kode_ins || null, jenis_pemeriksaan_str, total_biaya, no_reg,
                data.catatan_tambahan || null, 'terdaftar', data.status_pembayaran || 'berbayar', max_seq
            ];

            const [resultReg] = await connection.execute(sqlReg, paramsReg);
            const registrationId = resultReg.insertId;

            if (validItems.length > 0) {
                const sqlDetail = `INSERT INTO registration_details (registration_id, pemeriksaan_id, harga_saat_ini) VALUES (?, ?, ?)`;
                const sqlTestInit = `
                INSERT INTO registration_tests 
                (registration_id, parameter_name, satuan, nilai_rujukan, metode, status) 
                VALUES (?, ?, ?, ?, ?, 'pending')
                `;

                for (const item of validItems) {
                    let testParameters = [];
                    if (item.tipe === 'paket') {
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
                            testParameters.push({
                                parameter_name: item.nama_pemeriksaan,
                                satuan: item.satuan,
                                nilai_rujukan: item.nilai_rujukan,
                                metode: item.metode
                            });
                        }
                    } else {
                        testParameters.push({
                            parameter_name: item.nama_pemeriksaan,
                            satuan: item.satuan,
                            nilai_rujukan: item.nilai_rujukan,
                            metode: item.metode
                        });
                    }

                    for (let i = 0; i < item.qty; i++) {
                        await connection.execute(sqlDetail, [registrationId, item.id, item.harga]);
                        for (const param of testParameters) {
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

    async update(id, data) {
        const { items, pemeriksaan_ids, ...fieldData } = data;

        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            const m = moment(dateStr);
            return m.isValid() ? m.format('YYYY-MM-DD HH:mm:ss') : null;
        };

        // DITAMBAHKAN last_sample_seq KE ALLOWED FIELDS
        const ALLOWED_FIELDS = [
            'nama_pasien', 'tgl_lahir', 'umur', 'jenis_kelamin',
            'nik', 'alamat', 'no_kontak', 'asal_sampel', 'pengirim_instansi',
            'tgl_daftar', 'waktu_daftar', 'tgl_pengambilan', 'ket_pengerjaan',
            'no_sampel_lab', 'petugas_input', 'no_invoice',
            'kode_ins', 'jenis_pemeriksaan', 'catatan_tambahan', 'total_biaya',
            'status', 'link_hasil', 'status_pembayaran', 'last_sample_seq'
        ];

        if (data.no_sampel_lab) {
            const no_sampel_clean = data.no_sampel_lab.trim().toUpperCase();
            const isAvailable = await this.checkSampleAvailability(no_sampel_clean, id);

            if (!isAvailable) {
                throw new Error(`Nomor Sampel "${no_sampel_clean}" sudah digunakan oleh pasien lain.`);
            }
            data.no_sampel_lab = no_sampel_clean;

            // Extrak jika diupdate
            let max_seq = 0;
            const samples = no_sampel_clean.split(',').map(s => s.trim());
            for (const s of samples) {
                const parts = s.split(' ');
                if (parts.length >= 3) {
                    const seqStr = parts[parts.length - 3];
                    const seqNum = parseInt(seqStr, 10);
                    if (!isNaN(seqNum) && seqNum > max_seq) {
                        max_seq = seqNum;
                    }
                }
            }
            fieldData.last_sample_seq = max_seq;
        }

        try {
            return await db.transaction(async (connection) => {
                let itemsToProcess = items;
                if (!itemsToProcess && pemeriksaan_ids) {
                    itemsToProcess = pemeriksaan_ids.map(id => ({ id, qty: 1 }));
                }

                if (itemsToProcess && Array.isArray(itemsToProcess)) {
                    const [existingTests] = await connection.query(
                        'SELECT parameter_name, nilai, status, validation_status, validated_by, validation_note, validated_at FROM registration_tests WHERE registration_id = ?',
                        [id]
                    );

                    const resultsMap = new Map();
                    existingTests.forEach(test => {
                        if (test.nilai !== null || test.status === 'completed') {
                            resultsMap.set(test.parameter_name, test);
                        }
                    });

                    const uniqueIds = [...new Set(itemsToProcess.map(i => i.id))];
                    const masterData = await MasterModel.getPemeriksaanByIds(uniqueIds);

                    let validItems = itemsToProcess.map(reqItem => {
                        const master = masterData.find(m => m.id == reqItem.id);
                        if (!master) return null;
                        return { ...master, qty: reqItem.qty || 1 };
                    }).filter(Boolean);

                    let calculatedTotal = validItems.reduce((sum, item) => sum + (Number(item.harga) * item.qty), 0);
                    if ((fieldData.status_pembayaran || 'berbayar') === 'gratis') {
                        calculatedTotal = 0;
                    }

                    fieldData.total_biaya = calculatedTotal;
                    fieldData.jenis_pemeriksaan = validItems.map(i => `${i.nama_pemeriksaan} (${i.qty})`).join(', ');

                    await connection.execute('DELETE FROM registration_details WHERE registration_id = ?', [id]);
                    await connection.execute('DELETE FROM registration_tests WHERE registration_id = ?', [id]);

                    if (validItems.length > 0) {
                        const sqlDetail = `INSERT INTO registration_details (registration_id, pemeriksaan_id, harga_saat_ini) VALUES (?, ?, ?)`;
                        const sqlTestInsert = `
                        INSERT INTO registration_tests 
                        (registration_id, parameter_name, satuan, nilai_rujukan, metode, status, nilai, validation_status, validated_by, validation_note, validated_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                        for (const item of validItems) {
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

                                    const previousData = resultsMap.get(finalParamName);
                                    const valNilai = previousData ? previousData.nilai : null;
                                    const valStatus = previousData ? previousData.status : 'pending';
                                    const valValidStatus = previousData ? previousData.validation_status : 'pending';
                                    const valValidBy = previousData ? previousData.validated_by : null;
                                    const valValidNote = previousData ? previousData.validation_note : null;
                                    const valValidAt = previousData ? previousData.validated_at : null;

                                    await connection.execute(sqlTestInsert, [
                                        id,
                                        finalParamName,
                                        param.satuan || null,
                                        param.nilai_rujukan || null,
                                        param.metode || null,
                                        valStatus,
                                        valNilai,
                                        valValidStatus,
                                        valValidBy,
                                        valValidNote,
                                        valValidAt
                                    ]);
                                }
                            }
                        }
                    }
                }

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
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
                throw new Error(`Gagal Update: Nomor Sampel sudah ada di sistem.`);
            }
            throw err;
        }
    },

    async getFinanceStats(period, startDate, endDate) {
        let dateFilter = "";

        // 1. Cek jika menggunakan parameter 'period' dari frontend
        if (period) {
            switch (period) {
                case 'today':
                    dateFilter = `DATE(created_at) = CURDATE()`;
                    break;
                case 'this_week':
                    // YEARWEEK mode 1 = Senin sebagai hari pertama
                    dateFilter = `YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)`;
                    break;
                case 'this_month':
                    dateFilter = `YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`;
                    break;
                case 'this_year':
                    dateFilter = `YEAR(created_at) = YEAR(CURDATE())`;
                    break;
                case 'all_time':
                    dateFilter = `1=1`; // Lewati filter waktu
                    break;
                default:
                    dateFilter = `created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
            }
        }
        // 2. Fallback jika menggunakan custom StartDate & EndDate
        else if (startDate && endDate) {
            dateFilter = `DATE(created_at) BETWEEN '${startDate}' AND '${endDate}'`;
        }
        // 3. Default jika tidak ada parameter sama sekali
        else {
            dateFilter = `created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
        }

        const sqlSummary = `
        SELECT 
            SUM(total_biaya) as total_revenue,
            COUNT(id) as total_transactions,
            SUM(CASE WHEN status_pembayaran = 'berbayar' THEN 1 ELSE 0 END) as paid_count,
            SUM(CASE WHEN status_pembayaran = 'gratis' THEN 1 ELSE 0 END) as free_count
        FROM registrations
        WHERE ${dateFilter} AND status NOT IN ('batal')
        `;

        const sqlChart = `
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m-%d') as date,
            SUM(total_biaya) as revenue
        FROM registrations
        WHERE ${dateFilter} AND status_pembayaran = 'berbayar' AND status NOT IN ('batal')
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC
        `;

        const sqlRecent = `
        SELECT id, no_reg, no_invoice, nama_pasien, total_biaya, status_pembayaran, created_at
        FROM registrations
        WHERE ${dateFilter} AND total_biaya > 0
        ORDER BY created_at DESC
        `;

        const summaryRows = await db.query(sqlSummary);
        const chartData = await db.query(sqlChart);
        const recentData = await db.query(sqlRecent);

        return {
            summary: summaryRows.length > 0 ? summaryRows[0] : null,
            chartData,
            recentData
        };
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

        if (status === 'proses_sampling') sql += ', waktu_daftar = CURTIME(), tgl_pengambilan = CURDATE()';
        else if (status === 'diterima_lab') sql += ', tgl_daftar = CURDATE()';
        else if (status === 'proses_lab') sql += ', waktu_mulai_periksa = NOW()';
        else if (status === 'selesai_uji') sql += ', waktu_selesai_periksa = NOW()';
        else if (status === 'selesai') sql += ', updated_at = NOW()';

        sql += ' WHERE id = ?';
        params.push(id);
        return await db.execute(sql, params);
    },

    async setStatusAndValidator(id, status, validator) {
        let sql = 'UPDATE registrations SET status = ?, validator = ?';
        const params = [status, validator];

        if (status === 'selesai') {
            sql += ', validated_at = NOW()';
        }

        sql += ' WHERE id = ?';
        params.push(id);

        return await db.execute(sql, params);
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