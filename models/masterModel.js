// models/masterModel.js
const prisma = require('../config/prisma');

const MasterModel = {
    async getAllInstalasi() {
        return await prisma.master_instalasi.findMany({
            orderBy: { id: 'asc' }
        });
    },

    async createInstalasi(data) {
        return await prisma.master_instalasi.create({
            data: {
                kode_instalasi: data.kode_instalasi,
                nama_instalasi: data.nama_instalasi,
                kode_sampel: data.kode_sampel
            }
        });
    },

    async updateInstalasi(id, data) {
        return await prisma.master_instalasi.update({
            where: { id: Number(id) },
            data: {
                kode_instalasi: data.kode_instalasi,
                nama_instalasi: data.nama_instalasi,
                kode_sampel: data.kode_sampel
            }
        });
    },

    async deleteInstalasi(id) {
        return await prisma.master_instalasi.delete({
            where: { id: Number(id) }
        });
    },

    async getAllPemeriksaan() {
        const rows = await prisma.master_pemeriksaan.findMany({
            include: {
                master_instalasi: true,
                _count: { select: { master_pemeriksaan_parameters: true } }
            },
            orderBy: [{ kategori: 'asc' }, { nama_pemeriksaan: 'asc' }]
        });

        // Mapping agar mirip hasil JOIN lamamu dan Decimal aman
        return rows.map(r => ({
            ...r,
            harga: Number(r.harga),
            nama_instalasi: r.master_instalasi?.nama_instalasi || null,
            kode_sampel: r.master_instalasi?.kode_sampel || null,
            total_parameters: r._count.master_pemeriksaan_parameters,
            master_instalasi: undefined, // bersihkan sisa Prisma
            _count: undefined
        }));
    },

    async getPemeriksaanByIds(ids) {
        if (!ids || ids.length === 0) return [];
        const rows = await prisma.master_pemeriksaan.findMany({
            where: { id: { in: ids.map(Number) } }
        });
        return rows.map(r => ({ ...r, harga: Number(r.harga) }));
    },

    async findById(id) {
        const row = await prisma.master_pemeriksaan.findUnique({
            where: { id: Number(id) }
        });
        return row ? { ...row, harga: Number(row.harga) } : null;
    },

    async create(data) {
        const result = await prisma.master_pemeriksaan.create({
            data: {
                instalasi_id: data.instalasi_id ? Number(data.instalasi_id) : null,
                kategori: data.kategori,
                nama_pemeriksaan: data.nama_pemeriksaan,
                satuan: data.satuan,
                harga: data.harga,
                nilai_rujukan: data.nilai_rujukan,
                metode: data.metode
            }
        });
        return { ...result, harga: Number(result.harga) };
    },

    async update(id, data) {
        const result = await prisma.master_pemeriksaan.update({
            where: { id: Number(id) },
            data: {
                instalasi_id: data.instalasi_id ? Number(data.instalasi_id) : null,
                kategori: data.kategori,
                nama_pemeriksaan: data.nama_pemeriksaan,
                satuan: data.satuan,
                harga: data.harga,
                nilai_rujukan: data.nilai_rujukan,
                metode: data.metode
            }
        });
        return { ...result, harga: Number(result.harga) };
    },

    async delete(id) {
        try {
            // Jalankan dalam transaksi agar aman
            return await prisma.$transaction(async (tx) => {
                // 1. Hapus semua parameter anaknya terlebih dahulu (jika ada)
                await tx.master_pemeriksaan_parameters.deleteMany({
                    where: { master_pemeriksaan_id: Number(id) }
                });

                // 2. Baru hapus master pemeriksaannya
                return await tx.master_pemeriksaan.delete({
                    where: { id: Number(id) }
                });
            });
        } catch (err) {
            // Tangkap error P2003 dari Prisma (Data masih dipakai di transaksi)
            if (err.code === 'P2003') {
                throw new Error('Data master ini tidak bisa dihapus karena sudah memiliki riwayat transaksi pendaftaran pasien. Hapus data pendaftaran terkait terlebih dahulu atau nonaktifkan layanan ini.');
            }
            throw err; // Lempar error lain ke controller
        }
    },

    async getParametersByMasterId(masterId) {
        return await prisma.master_pemeriksaan_parameters.findMany({
            where: { master_pemeriksaan_id: Number(masterId) },
            orderBy: { urutan: 'asc' }
        });
    },

    async createWithParameters(data) {
        const { parameters, ...masterData } = data;

        let satuan = masterData.satuan || null;
        let nilai_rujukan = masterData.nilai_rujukan || null;
        let metode = masterData.metode || null;

        if (masterData.tipe === 'paket') {
            satuan = "Multiple";
            nilai_rujukan = "Lihat parameter";
            metode = "Various";
        }

        // Jalankan transaksi Prisma
        return await prisma.$transaction(async (tx) => {
            const master = await tx.master_pemeriksaan.create({
                data: {
                    instalasi_id: masterData.instalasi_id ? Number(masterData.instalasi_id) : null,
                    kategori: masterData.kategori,
                    nama_pemeriksaan: masterData.nama_pemeriksaan,
                    satuan,
                    harga: masterData.harga,
                    nilai_rujukan,
                    metode,
                    tipe: masterData.tipe || 'tunggal'
                }
            });

            if (masterData.tipe === 'paket' && parameters && parameters.length > 0) {
                const paramData = parameters.map((param, index) => ({
                    master_pemeriksaan_id: master.id,
                    parameter_name: param.parameter_name,
                    satuan: param.satuan || null,
                    nilai_rujukan: param.nilai_rujukan || null,
                    metode: param.metode || null,
                    urutan: index
                }));

                await tx.master_pemeriksaan_parameters.createMany({
                    data: paramData
                });
            }

            return {
                id: master.id,
                ...masterData,
                harga: Number(master.harga),
                parameters: parameters || []
            };
        });
    },

    async updateWithParameters(id, data) {
        const { parameters, ...masterData } = data;

        let satuan = masterData.satuan || null;
        let nilai_rujukan = masterData.nilai_rujukan || null;
        let metode = masterData.metode || null;

        if (masterData.tipe === 'paket') {
            satuan = "Multiple";
            nilai_rujukan = "Lihat parameter";
            metode = "Various";
        }

        return await prisma.$transaction(async (tx) => {
            await tx.master_pemeriksaan.update({
                where: { id: Number(id) },
                data: {
                    instalasi_id: masterData.instalasi_id ? Number(masterData.instalasi_id) : null,
                    kategori: masterData.kategori,
                    nama_pemeriksaan: masterData.nama_pemeriksaan,
                    satuan,
                    harga: masterData.harga,
                    nilai_rujukan,
                    metode,
                    tipe: masterData.tipe || 'tunggal'
                }
            });

            // Hapus yang lama, insert yang baru
            await tx.master_pemeriksaan_parameters.deleteMany({
                where: { master_pemeriksaan_id: Number(id) }
            });

            if (masterData.tipe === 'paket' && parameters && parameters.length > 0) {
                const paramData = parameters.map((param, index) => ({
                    master_pemeriksaan_id: Number(id),
                    parameter_name: param.parameter_name,
                    satuan: param.satuan || null,
                    nilai_rujukan: param.nilai_rujukan || null,
                    metode: param.metode || null,
                    urutan: index
                }));

                await tx.master_pemeriksaan_parameters.createMany({
                    data: paramData
                });
            }

            return { id, ...masterData, parameters: parameters || [] };
        });
    },

    async getPemeriksaanWithParameters(id) {
        const master = await this.findById(id);
        if (!master) return null;

        if (master.tipe === 'paket') {
            master.parameters = await this.getParametersByMasterId(id);
        } else {
            master.parameters = [{
                id: null,
                parameter_name: master.nama_pemeriksaan,
                satuan: master.satuan,
                nilai_rujukan: master.nilai_rujukan,
                metode: master.metode,
                urutan: 0
            }];
        }

        return master;
    }
};

module.exports = MasterModel;