// models/masterModel.js
const db = require('../config/dbConfig');

const MasterModel = {
    async getAllPemeriksaan() {
        // Tambahkan subquery COUNT untuk menghitung jumlah parameter
        const sql = `
            SELECT mp.*, 
            (
                SELECT COUNT(*) 
                FROM master_pemeriksaan_parameters mpp 
                WHERE mpp.master_pemeriksaan_id = mp.id
            ) as total_parameters
            FROM master_pemeriksaan mp 
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
            INSERT INTO master_pemeriksaan (kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = await db.execute(sql, [
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
            SET kategori = ?, nama_pemeriksaan = ?, satuan = ?, harga = ?, nilai_rujukan = ?, metode = ?
            WHERE id = ?
        `;
        await db.execute(sql, [
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
            // SET DEFAULT UNTUK PAKET
            let satuan = masterData.satuan || null;
            let nilai_rujukan = masterData.nilai_rujukan || null;
            let metode = masterData.metode || null;

            if (masterData.tipe === 'paket') {
                // Untuk paket, set default atau ambil dari parameter pertama
                satuan = "Multiple";
                nilai_rujukan = "Lihat parameter";
                metode = "Various";
            }

            // 1. Insert master pemeriksaan
            const sqlMaster = `
        INSERT INTO master_pemeriksaan 
        (kategori, nama_pemeriksaan, satuan, harga, nilai_rujukan, metode, tipe)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

            const [resultMaster] = await connection.execute(sqlMaster, [
                masterData.kategori,
                masterData.nama_pemeriksaan,
                satuan, // Gunakan yang sudah di-set
                masterData.harga,
                nilai_rujukan, // Gunakan yang sudah di-set
                metode, // Gunakan yang sudah di-set
                masterData.tipe || 'tunggal'
            ]);

            const masterId = resultMaster.insertId;

            // 2. Insert parameters jika tipe paket
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
                        i // urutan
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
            // SET DEFAULT UNTUK PAKET
            let satuan = masterData.satuan || null;
            let nilai_rujukan = masterData.nilai_rujukan || null;
            let metode = masterData.metode || null;

            if (masterData.tipe === 'paket') {
                // Untuk paket, set default
                satuan = "Multiple";
                nilai_rujukan = "Lihat parameter";
                metode = "Various";
            }

            // 1. Update master pemeriksaan
            const sqlMaster = `
        UPDATE master_pemeriksaan 
        SET kategori = ?, nama_pemeriksaan = ?, satuan = ?, 
            harga = ?, nilai_rujukan = ?, metode = ?, tipe = ?
        WHERE id = ?
      `;

            await connection.execute(sqlMaster, [
                masterData.kategori,
                masterData.nama_pemeriksaan,
                satuan,
                masterData.harga,
                nilai_rujukan,
                metode,
                masterData.tipe || 'tunggal',
                id
            ]);

            // 2. Hapus parameter lama (jika ada)
            await connection.execute(
                'DELETE FROM master_pemeriksaan_parameters WHERE master_pemeriksaan_id = ?',
                [id]
            );

            // 3. Insert parameter baru (jika tipe paket)
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
        // Ambil data master
        const master = await this.findById(id);
        if (!master) return null;

        // Jika tipe paket, ambil parameter
        if (master.tipe === 'paket') {
            master.parameters = await this.getParametersByMasterId(id);
        } else {
            // Untuk tunggal, buat satu parameter dari data master
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