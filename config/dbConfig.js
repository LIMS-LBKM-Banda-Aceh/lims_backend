// config/dbConfig.js

require('dotenv').config();
const mysql = require('mysql2/promise');

class Database {
    constructor() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'lims_db',
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }

    async query(sql, params) {
        try {
            const [rows, fields] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async execute(sql, params) {
        try {
            const [result] = await this.pool.execute(sql, params);
            return result;
        } catch (error) {
            console.error('Database execute error:', error);
            throw error;
        }
    }

    async transaction(callback) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async checkConnection() {
        try {
            await this.pool.query('SELECT 1');
            return true;
        } catch (err) {
            console.error('Database connection error:', err);
            return false;
        }
    }
}

module.exports = new Database();