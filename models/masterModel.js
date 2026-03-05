// models/masterModel.js

const db = require('../config/dbConfig');

const MasterModel = {
    async getAllInstalasi() {
        const rows = await db.query('SELECT * FROM master_instalasi ORDER BY id ASC');
        return rows;
    },

    async createInstalasi(data) {
        const sql = `INSERT INTO master_instalasi (kode_instalasi, nama_instalasi, kode_sampel) VALUES (?, ?, ?)`;
        const result = await db.execute(sql, [
            data.kode_instalasi,
            data.nama_instalasi,
            data.kode_sampel
        ]);
        return { id: result.insertId, ...data };
    },

    // --- TAMBAHAN BARU ---
    async updateInstalasi(id, data) {
        const sql = `UPDATE master_instalasi SET kode_instalasi = ?, nama_instalasi = ?, kode_sampel = ? WHERE id = ?`;
        await db.execute(sql, [data.kode_instalasi, data.nama_instalasi, data.kode_sampel, id]);
        return { id, ...data };
    },

    async deleteInstalasi(id) {
        const result = await db.execute('DELETE FROM master_instalasi WHERE id = ?', [id]);
        return result;
    },
    // ---------------------

    async getAllPemeriksaan() {
        // Tambahkan JOIN ke master_instalasi
        const sql = `
            SELECT mp.*, 
            mi.nama_instalasi,
            mi.kode_sampel,
            (
                SELECT COUNT(*) 
                FROM master_pemeriksaan_parameters mpp 
                WHERE mpp.master_pemeriksaan_id = mp.id
            ) as total_parameters
            FROM master_pemeriksaan mp 
            LEFT JOIN master_instalasi mi ON mp.instalasi_id = mi.id
            ORDER BY mp.kategori, mp.nama_pemeriksaan
        `;
        const rows = await db.query(sql);
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
            INSERT INTO master_pemeriksaan (instalasi_id, kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.execute(sql, [
            data.instalasi_id || null, // Tambahan instalasi_id
            data.kategori,
            data.nama_pemeriksaan,
            data.satuan,
            data.harga,
            data.nilai_rujukan,
            data.metode
        ]);
        return { id: result.insertId, ...data };
    },

    async update(id, data) {
        const sql = `
            UPDATE master_pemeriksaan 
            SET instalasi_id = ?, kategori = ?, nama_pemeriksaan = ?, satuan = ?, harga = ?, nilai_rujukan = ?, metode = ?
            WHERE id = ?
        `;
        await db.execute(sql, [
            data.instalasi_id || null, // Tambahan instalasi_id
            data.kategori,
            data.nama_pemeriksaan,
            data.satuan,
            data.harga,
            data.nilai_rujukan,
            data.metode,
            id
        ]);
        return { id, ...data };
    },

    async delete(id) {
        const result = await db.execute('DELETE FROM master_pemeriksaan WHERE id = ?', [id]);
        return result;
    },

    async getParametersByMasterId(masterId) {
        const sql = `
            SELECT * FROM master_pemeriksaan_parameters 
            WHERE master_pemeriksaan_id = ? 
            ORDER BY urutan ASC
        `;
        return await db.query(sql, [masterId]);
    },

    async createWithParameters(data) {
        const { parameters, ...masterData } = data;

        return await db.transaction(async (connection) => {
            let satuan = masterData.satuan || null;
            let nilai_rujukan = masterData.nilai_rujukan || null;
            let metode = masterData.metode || null;

            if (masterData.tipe === 'paket') {
                satuan = "Multiple";
                nilai_rujukan = "Lihat parameter";
                metode = "Various";
            }

            const sqlMaster = `
                INSERT INTO master_pemeriksaan 
                (instalasi_id, kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode, tipe)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [resultMaster] = await connection.execute(sqlMaster, [
                masterData.instalasi_id || null, // Tambahan instalasi_id
                masterData.kategori,
                masterData.nama_pemeriksaan,
                satuan,
                masterData.harga,
                nilai_rujukan,
                metode,
                masterData.tipe || 'tunggal'
            ]);

            const masterId = resultMaster.insertId;

            if (masterData.tipe === 'paket' && parameters && parameters.length > 0) {
                const sqlParam = `
                    INSERT INTO master_pemeriksaan_parameters 
                    (master_pemeriksaan_id, parameter_name, satuan, nilai_rujukan, metode, urutan)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                for (let i = 0; i < parameters.length; i++) {
                    const param = parameters[i];
                    await connection.execute(sqlParam, [
                        masterId,
                        param.parameter_name,
                        param.satuan || null,
                        param.nilai_rujukan || null,
                        param.metode || null,
                        i
                    ]);
                }
            }

            return {
                id: masterId,
                ...masterData,
                parameters: parameters || []
            };
        });
    },

    async updateWithParameters(id, data) {
        const { parameters, ...masterData } = data;

        return await db.transaction(async (connection) => {
            let satuan = masterData.satuan || null;
            let nilai_rujukan = masterData.nilai_rujukan || null;
            let metode = masterData.metode || null;

            if (masterData.tipe === 'paket') {
                satuan = "Multiple";
                nilai_rujukan = "Lihat parameter";
                metode = "Various";
            }

            const sqlMaster = `
                UPDATE master_pemeriksaan 
                SET instalasi_id = ?, kategori = ?, nama_pemeriksaan = ?, satuan = ?, 
                    harga = ?, nilai_rujukan = ?, metode = ?, tipe = ?
                WHERE id = ?
            `;

            await connection.execute(sqlMaster, [
                masterData.instalasi_id || null, // Tambahan instalasi_id
                masterData.kategori,
                masterData.nama_pemeriksaan,
                satuan,
                masterData.harga,
                nilai_rujukan,
                metode,
                masterData.tipe || 'tunggal',
                id
            ]);

            await connection.execute(
                'DELETE FROM master_pemeriksaan_parameters WHERE master_pemeriksaan_id = ?',
                [id]
            );

            if (masterData.tipe === 'paket' && parameters && parameters.length > 0) {
                const sqlParam = `
                    INSERT INTO master_pemeriksaan_parameters 
                    (master_pemeriksaan_id, parameter_name, satuan, nilai_rujukan, metode, urutan)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                for (let i = 0; i < parameters.length; i++) {
                    const param = parameters[i];
                    await connection.execute(sqlParam, [
                        id,
                        param.parameter_name,
                        param.satuan || null,
                        param.nilai_rujukan || null,
                        param.metode || null,
                        i
                    ]);
                }
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