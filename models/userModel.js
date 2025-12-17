// models/userModels

const db = require('../config/dbConfig');
const bcrypt = require('bcryptjs');

const UserModel = {
    async createUser({ username, password, role = 'input' }) {
        const hash = await bcrypt.hash(password, 10);

        const result = await db.execute(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hash, role]
        );

        return {
            id: result.insertId,
            username,
            role
        };
    },

    async findByUsername(username) {
        const rows = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const rows = await db.query(
            'SELECT id, username, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    async comparePassword(plain, hashed) {
        return await bcrypt.compare(plain, hashed);
    },

    async getAllUsers() {
        const rows = await db.query(
            'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    },

    async updateUser(id, data) {
        const updates = [];
        const values = [];

        if (data.username) {
            updates.push('username = ?');
            values.push(data.username);
        }

        if (data.role) {
            updates.push('role = ?');
            values.push(data.role);
        }

        if (data.password) {
            const hash = await bcrypt.hash(data.password, 10);
            updates.push('password = ?');
            values.push(hash);
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