// models/userModel.js

const db = require('../config/dbConfig');
const bcrypt = require('bcryptjs');

const UserModel = {
    // FIX 1: Pastikan createUser juga menyimpan instalasi_id
    async createUser({ username, password, fullname, role = 'input', instalasi_id = null }) {
        const hash = await bcrypt.hash(password, 10);
        const result = await db.execute(
            'INSERT INTO users (username, password, fullname, role, instalasi_id) VALUES (?, ?, ?, ?, ?)',
            [username, hash, fullname, role, instalasi_id]
        );
        return { id: result.insertId, username, fullname, role, instalasi_id };
    },

    async findByUsername(username) {
        const rows = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows[0] || null;
    },

    async findById(id) {
        // FIX 2: Tambahkan instalasi_id pada query SELECT
        const rows = await db.query(
            'SELECT id, username, fullname, role, instalasi_id, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    async comparePassword(plain, hashed) {
        return await bcrypt.compare(plain, hashed);
    },

    async getAllUsers() {
        // FIX 3: Tambahkan instalasi_id pada query SELECT agar Frontend bisa membaca relasinya
        const rows = await db.query(
            'SELECT id, username, fullname, role, instalasi_id, created_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    },

    async updateUser(id, data) {
        const updates = [];
        const values = [];

        // Gunakan pengecekan !== undefined agar nilai NULL tetap bisa diproses
        if (data.fullname !== undefined) {
            updates.push('fullname = ?');
            values.push(data.fullname);
        }
        if (data.username !== undefined) {
            updates.push('username = ?');
            values.push(data.username);
        }
        if (data.role !== undefined) {
            updates.push('role = ?');
            values.push(data.role);
        }
        if (data.password) {
            const hash = await bcrypt.hash(data.password, 10);
            updates.push('password = ?');
            values.push(hash);
        }
        
        // FIX 4: Tangkap dan proses instalasi_id ke dalam query UPDATE
        if (data.instalasi_id !== undefined) {
            updates.push('instalasi_id = ?');
            // Jika dikirim string kosong "", ubah menjadi null agar tidak error Foreign Key di database
            values.push(data.instalasi_id === "" ? null : data.instalasi_id);
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        
        await db.execute(sql, values);
        
        return this.findById(id);
    },

    async deleteUser(id) {
        const result = await db.execute('DELETE FROM users WHERE id = ?', [id]);
        return result;
    }
};

module.exports = UserModel;