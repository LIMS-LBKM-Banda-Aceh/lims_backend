// models/registrationModel.js
const prisma = require('../config/prisma');
const moment = require('moment');
const MasterModel = require('./masterModel');

const RegistrationModel = {

    async generateNoReg() {
        const datePart = moment().format('YYYYMMDD');

        // Prisma butuh range object Date untuk filter "CURDATE()"
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

        const cnt = await prisma.registrations.count({
            where: {
                created_at: { gte: startOfDay, lte: endOfDay }
            }
        });

        return `REG-${datePart}-${String(cnt + 1).padStart(3, '0')}`;
    },

    async getAll() {
        const rows = await prisma.registrations.findMany({
            orderBy: { created_at: 'desc' }
        });
        return rows.map(r => ({ ...r, total_biaya: Number(r.total_biaya) }));
    },

    async getNextSampleSeq() {
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

        const lastRecord = await prisma.registrations.findFirst({
            where: { created_at: { gte: startOfYear, lte: endOfYear } },
            orderBy: { last_sample_seq: 'desc' },
            select: { last_sample_seq: true, no_sampel_lab: true }
        });

        if (lastRecord) {
            return {
                next_seq: (lastRecord.last_sample_seq || 0) + 1,
                last_sample_string: lastRecord.no_sampel_lab || "Belum ada data di tahun ini"
            };
        } else {
            return { next_seq: 1, last_sample_string: "Belum ada data registrasi" };
        }
    },

    async findById(id) {
        const registration = await prisma.registrations.findUnique({
            where: { id: Number(id) },
            include: {
                registration_details: {
                    include: { master_pemeriksaan: { select: { nama_pemeriksaan: true } } }
                }
            }
        });

        if (!registration) return null;

        // Transformasi ke Number & Flatten Details
        registration.total_biaya = Number(registration.total_biaya);
        registration.details = registration.registration_details.map(rd => ({
            ...rd,
            harga_saat_ini: Number(rd.harga_saat_ini),
            nama_pemeriksaan: rd.master_pemeriksaan?.nama_pemeriksaan
        }));
        delete registration.registration_details; // bersihkan relasi Prisma

        return registration;
    },

    async checkSampleAvailability(no_sampel_string, excludeId = null) {
        if (!no_sampel_string) return true;

        const samples = no_sampel_string.split(',').map(s => s.trim()).filter(Boolean);
        if (samples.length === 0) return true;

        for (const sample of samples) {
            const conditions = [
                { no_sampel_lab: sample },
                { no_sampel_lab: { startsWith: `${sample}, ` } },
                { no_sampel_lab: { contains: `, ${sample}, ` } },
                { no_sampel_lab: { endsWith: `, ${sample}` } }
            ];

            const whereClause = excludeId
                ? { AND: [{ id: { not: Number(excludeId) } }, { OR: conditions }] }
                : { OR: conditions };

            const count = await prisma.registrations.count({ where: whereClause });
            if (count > 0) return false;
        }
        return true;
    },

    async getLastInvoice() {
        const year = new Date().getFullYear();
        // RAW QUERY dibutuhkan karena CAST dan SUBSTRING_INDEX rumit di ORM
        const rows = await prisma.$queryRaw`
            SELECT no_invoice 
            FROM registrations 
            WHERE no_invoice IS NOT NULL 
              AND no_invoice != '' 
              AND no_invoice LIKE '%/690798/PNBP/%' 
              AND YEAR(created_at) = ${year}
            ORDER BY 
                CAST(SUBSTRING_INDEX(no_invoice, '/', 1) AS UNSIGNED) DESC,
                id DESC 
            LIMIT 1
        `;
        return rows.length > 0 ? rows[0].no_invoice : null;
    },

    async getLabQueue(userRole, instalasiId) {
        const whereClause = {
            status: { notIn: ['terdaftar', 'proses_sampling'] }
        };

        if (userRole === 'lab') {
            whereClause.registration_details = {
                some: { master_pemeriksaan: { instalasi_id: Number(instalasiId) || 0 } }
            };
        }

        const rows = await prisma.registrations.findMany({
            where: whereClause,
            orderBy: { created_at: 'asc' }
        });

        return rows.map(r => ({ ...r, total_biaya: Number(r.total_biaya) }));
    },

    async findLastPatientByNik(nik) {
        return await prisma.registrations.findFirst({
            where: { nik },
            select: { nama_pasien: true, tgl_lahir: true, jenis_kelamin: true, alamat: true, no_kontak: true },
            orderBy: { created_at: 'desc' }
        });
    },

    async create(data) {
        const { items } = data;
        if (!data.no_sampel_lab || data.no_sampel_lab.trim() === "") {
            throw new Error("Nomor Sampel Lab wajib diisi!");
        }
        const no_sampel_lab = data.no_sampel_lab.trim().toUpperCase();

        const isAvailable = await this.checkSampleAvailability(no_sampel_lab);
        if (!isAvailable) {
            throw new Error(`Nomor Sampel "${no_sampel_lab}" sudah digunakan.`);
        }

        let max_seq = 0;
        const samples = no_sampel_lab.split(',').map(s => s.trim());
        for (const s of samples) {
            const parts = s.split(' ');
            if (parts.length >= 3) {
                const seqNum = parseInt(parts[parts.length - 3], 10);
                if (!isNaN(seqNum) && seqNum > max_seq) max_seq = seqNum;
            }
        }

        const no_reg = await this.generateNoReg();

        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            const m = moment(dateStr);
            return m.isValid() ? m.toDate() : null;
        };

        const serverTime = new Date();
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

        return await prisma.$transaction(async (tx) => {
            const jenis_pemeriksaan_str = validItems.map(i => `${i.nama_pemeriksaan} (${i.qty})`).join(', ');

            // Insert Pendaftaran Utama
            const reg = await tx.registrations.create({
                data: {
                    nama_pasien: data.nama_pasien,
                    tgl_lahir: parseDate(data.tgl_lahir),
                    umur: data.umur || null,
                    jenis_kelamin: data.jenis_kelamin || 'L',
                    nik: data.nik || null,
                    alamat: data.alamat || null,
                    no_kontak: data.no_kontak || null,
                    asal_sampel: data.asal_sampel || null,
                    pengirim_instansi: data.pengirim_instansi || null,
                    tgl_daftar: serverTime,
                    waktu_daftar: serverTime,
                    tgl_pengambilan: parseDate(data.tgl_pengambilan),
                    no_sampel_lab: no_sampel_lab,
                    form_pe: data.form_pe || null,
                    petugas_input: data.petugas_input || null,
                    kode_ins: data.kode_ins || null,
                    jenis_pemeriksaan: jenis_pemeriksaan_str,
                    total_biaya: total_biaya,
                    no_reg: no_reg,
                    catatan_tambahan: data.catatan_tambahan || null,
                    status: 'terdaftar',
                    status_pembayaran: data.status_pembayaran || 'berbayar',
                    last_sample_seq: max_seq
                }
            });

            // Insert Detail dan Testing Parameter
            if (validItems.length > 0) {
                for (const item of validItems) {
                    let testParameters = [];
                    if (item.tipe === 'paket') {
                        const dbParams = await tx.master_pemeriksaan_parameters.findMany({
                            where: { master_pemeriksaan_id: item.id },
                            orderBy: { urutan: 'asc' }
                        });

                        if (dbParams.length > 0) testParameters = dbParams;
                        else testParameters.push({
                            parameter_name: item.nama_pemeriksaan, satuan: item.satuan,
                            nilai_rujukan: item.nilai_rujukan, metode: item.metode
                        });
                    } else {
                        testParameters.push({
                            parameter_name: item.nama_pemeriksaan, satuan: item.satuan,
                            nilai_rujukan: item.nilai_rujukan, metode: item.metode
                        });
                    }

                    for (let i = 0; i < item.qty; i++) {
                        await tx.registration_details.create({
                            data: {
                                registration_id: reg.id,
                                pemeriksaan_id: item.id,
                                harga_saat_ini: item.harga
                            }
                        });

                        for (const param of testParameters) {
                            const finalParamName = item.qty > 1 ? `${param.parameter_name} #${i + 1}` : param.parameter_name;
                            await tx.registration_tests.create({
                                data: {
                                    registration_id: reg.id,
                                    pemeriksaan_name: item.nama_pemeriksaan,
                                    parameter_name: finalParamName,
                                    satuan: param.satuan || null,
                                    nilai_rujukan: param.nilai_rujukan || null,
                                    metode: param.metode || null,
                                    status: 'pending'
                                }
                            });
                        }
                    }
                }
            }

            return { id: reg.id, no_reg: no_reg };
        });
    },

    async update(id, data) {
        const { items, pemeriksaan_ids, ...fieldData } = data;

        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            const m = moment(dateStr);
            return m.isValid() ? m.toDate() : null;
        };

        if (data.no_sampel_lab) {
            const no_sampel_clean = data.no_sampel_lab.trim().toUpperCase();
            const isAvailable = await this.checkSampleAvailability(no_sampel_clean, id);

            if (!isAvailable) throw new Error(`Nomor Sampel "${no_sampel_clean}" sudah digunakan.`);
            data.no_sampel_lab = no_sampel_clean;

            let max_seq = 0;
            const samples = no_sampel_clean.split(',').map(s => s.trim());
            for (const s of samples) {
                const parts = s.split(' ');
                if (parts.length >= 3) {
                    const seqNum = parseInt(parts[parts.length - 3], 10);
                    if (!isNaN(seqNum) && seqNum > max_seq) max_seq = seqNum;
                }
            }
            fieldData.last_sample_seq = max_seq;
        }

        try {
            return await prisma.$transaction(async (tx) => {
                let itemsToProcess = items;
                if (!itemsToProcess && pemeriksaan_ids) {
                    itemsToProcess = pemeriksaan_ids.map(pid => ({ id: pid, qty: 1 }));
                }

                if (itemsToProcess && Array.isArray(itemsToProcess)) {
                    const existingTests = await tx.registration_tests.findMany({ where: { registration_id: Number(id) } });
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
                    if ((fieldData.status_pembayaran || 'berbayar') === 'gratis') calculatedTotal = 0;

                    fieldData.total_biaya = calculatedTotal;
                    fieldData.jenis_pemeriksaan = validItems.map(i => `${i.nama_pemeriksaan} (${i.qty})`).join(', ');

                    // Bersihkan record lama
                    await tx.registration_details.deleteMany({ where: { registration_id: Number(id) } });
                    await tx.registration_tests.deleteMany({ where: { registration_id: Number(id) } });

                    if (validItems.length > 0) {
                        for (const item of validItems) {
                            let testParameters = [];
                            if (item.tipe === 'paket') {
                                const dbParams = await tx.master_pemeriksaan_parameters.findMany({
                                    where: { master_pemeriksaan_id: item.id }, orderBy: { urutan: 'asc' }
                                });
                                if (dbParams.length > 0) testParameters = dbParams;
                                else testParameters.push({ parameter_name: item.nama_pemeriksaan, satuan: item.satuan, nilai_rujukan: item.nilai_rujukan, metode: item.metode });
                            } else {
                                testParameters.push({ parameter_name: item.nama_pemeriksaan, satuan: item.satuan, nilai_rujukan: item.nilai_rujukan, metode: item.metode });
                            }

                            for (let i = 0; i < item.qty; i++) {
                                await tx.registration_details.create({
                                    data: { registration_id: Number(id), pemeriksaan_id: item.id, harga_saat_ini: item.harga }
                                });

                                for (const param of testParameters) {
                                    const finalParamName = item.qty > 1 ? `${param.parameter_name} #${i + 1}` : param.parameter_name;
                                    const previousData = resultsMap.get(finalParamName);

                                    await tx.registration_tests.create({
                                        data: {
                                            registration_id: Number(id),
                                            pemeriksaan_name: item.nama_pemeriksaan,
                                            parameter_name: finalParamName,
                                            satuan: param.satuan || null,
                                            nilai_rujukan: param.nilai_rujukan || null,
                                            metode: param.metode || null,
                                            status: previousData ? previousData.status : 'pending',
                                            nilai: previousData ? previousData.nilai : null,
                                            validation_status: previousData ? previousData.validation_status : 'pending',
                                            validated_by: previousData ? previousData.validated_by : null,
                                            validation_note: previousData ? previousData.validation_note : null,
                                            validated_at: previousData ? previousData.validated_at : null
                                        }
                                    });
                                }
                            }
                        }
                    }
                }

                // Update fields utama
                const ALLOWED_FIELDS = [
                    'nama_pasien', 'tgl_lahir', 'umur', 'jenis_kelamin', 'nik', 'alamat', 'no_kontak', 'asal_sampel', 'pengirim_instansi',
                    'tgl_daftar', 'waktu_daftar', 'tgl_pengambilan', 'ket_pengerjaan', 'no_sampel_lab', 'petugas_input', 'no_invoice',
                    'kode_ins', 'jenis_pemeriksaan', 'catatan_tambahan', 'total_biaya', 'status', 'link_hasil', 'status_pembayaran', 'last_sample_seq'
                ];

                const updatePayload = {};
                const dateFields = ['tgl_lahir', 'tgl_daftar', 'tgl_pengambilan'];

                for (const [key, value] of Object.entries(fieldData)) {
                    if (ALLOWED_FIELDS.includes(key)) {
                        if (dateFields.includes(key) && value) {
                            // Parse standard date fields
                            updatePayload[key] = parseDate(value);

                        } else if (key === 'waktu_daftar' && value) {
                            // FIX: Handle waktu_daftar specific formatting to satisfy Prisma DateTime
                            // Combine with tgl_daftar if available, otherwise fallback to today
                            const baseDate = fieldData.tgl_daftar
                                ? moment(fieldData.tgl_daftar).format('YYYY-MM-DD')
                                : moment().format('YYYY-MM-DD');

                            // value from <input type="time"> is usually "HH:mm". Append seconds.
                            const timeStr = value.length === 5 ? `${value}:00` : value;
                            const mTime = moment(`${baseDate}T${timeStr}`);

                            updatePayload[key] = mTime.isValid() ? mTime.toDate() : null;

                        } else if (key === 'umur') {
                            updatePayload[key] = (value !== null && value !== '') ? Number(value) : null;
                        } else {
                            updatePayload[key] = value;
                        }
                    }
                }

                if (Object.keys(updatePayload).length > 0) {
                    await tx.registrations.update({
                        where: { id: Number(id) },
                        data: updatePayload
                    });
                }

                return { id, ...data };
            });
        } catch (err) {
            // Memastikan duplikat ditangkap (P2002 di Prisma adalah Unqiue Constraint failed)
            if (err.code === 'P2002') throw new Error(`Gagal Update: Nomor Sampel sudah ada di sistem.`);
            throw err;
        }
    },

    async getFinanceStats(period, startDate, endDate) {
        // PERHATIAN: Dipertahankan pakai Unsafe Query karena kerumitan YEARWEEK dan DATE filter.
        let dateFilter = "";
        if (period) {
            switch (period) {
                case 'today': dateFilter = `DATE(created_at) = CURDATE()`; break;
                case 'this_week': dateFilter = `YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)`; break;
                case 'this_month': dateFilter = `YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`; break;
                case 'this_year': dateFilter = `YEAR(created_at) = YEAR(CURDATE())`; break;
                case 'all_time': dateFilter = `1=1`; break;
                default: dateFilter = `created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
            }
        } else if (startDate && endDate) {
            dateFilter = `DATE(created_at) BETWEEN '${startDate}' AND '${endDate}'`;
        } else {
            dateFilter = `created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
        }

        const sqlSummary = `SELECT SUM(total_biaya) as total_revenue, COUNT(id) as total_transactions, SUM(CASE WHEN status_pembayaran = 'berbayar' THEN 1 ELSE 0 END) as paid_count, SUM(CASE WHEN status_pembayaran = 'gratis' THEN 1 ELSE 0 END) as free_count FROM registrations WHERE ${dateFilter} AND status NOT IN ('batal')`;
        const sqlChart = `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, SUM(total_biaya) as revenue FROM registrations WHERE ${dateFilter} AND status_pembayaran = 'berbayar' AND status NOT IN ('batal') GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') ORDER BY date ASC`;
        const sqlRecent = `SELECT id, no_reg, no_invoice, nama_pasien, total_biaya, status_pembayaran, created_at FROM registrations WHERE ${dateFilter} AND total_biaya > 0 ORDER BY created_at DESC`;

        const summaryRows = await prisma.$queryRawUnsafe(sqlSummary);
        const chartData = await prisma.$queryRawUnsafe(sqlChart);
        const recentData = await prisma.$queryRawUnsafe(sqlRecent);

        return {
            summary: summaryRows.length > 0 ? {
                total_revenue: Number(summaryRows[0].total_revenue || 0),
                total_transactions: Number(summaryRows[0].total_transactions || 0),
                paid_count: Number(summaryRows[0].paid_count || 0),
                free_count: Number(summaryRows[0].free_count || 0)
            } : null,
            chartData: chartData.map(d => ({ ...d, revenue: Number(d.revenue) })),
            recentData: recentData.map(d => ({ ...d, total_biaya: Number(d.total_biaya) }))
        };
    },

    async delete(id) {
        // Cascade delete diurus oleh Prisma, cukup delete parent-nya
        try {
            await prisma.registrations.delete({ where: { id: Number(id) } });
            return true;
        } catch {
            return false;
        }
    },

    async setStatus(id, status) {
        const updateData = { status: status, updated_at: new Date() };

        if (status === 'proses_sampling') {
            updateData.waktu_daftar = new Date();
            updateData.tgl_pengambilan = new Date();
        } else if (status === 'diterima_lab') {
            updateData.tgl_daftar = new Date();
        } else if (status === 'proses_lab') {
            updateData.waktu_mulai_periksa = new Date();
        } else if (status === 'selesai_uji') {
            updateData.waktu_selesai_periksa = new Date();
        }

        return await prisma.registrations.update({
            where: { id: Number(id) },
            data: updateData
        });
    },

    async setStatusAndValidator(id, status, validator) {
        const updateData = { status, validator, updated_at: new Date() };
        if (status === 'selesai') updateData.validated_at = new Date();

        return await prisma.registrations.update({
            where: { id: Number(id) },
            data: updateData
        });
    },

    async setLinkResult(id, link) {
        return await prisma.registrations.update({
            where: { id: Number(id) },
            data: { link_hasil: link, status: 'selesai', updated_at: new Date() }
        });
    },

    async search(query) {
        const rows = await prisma.registrations.findMany({
            where: {
                OR: [
                    { nama_pasien: { contains: query } },
                    { no_reg: { contains: query } },
                    { no_sampel_lab: { contains: query } },
                    { nik: { contains: query } }
                ]
            },
            orderBy: { created_at: 'desc' }
        });
        return rows.map(r => ({ ...r, total_biaya: Number(r.total_biaya) }));
    }
};

module.exports = RegistrationModel;