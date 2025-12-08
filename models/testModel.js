// models/testModel.js

const db = require('../config/dbConfig');

const TestModel = {
    async createTest(registration_id, data) {
        const sql = `
            INSERT INTO registration_tests 
            (registration_id, parameter_name, nilai, satuan, range_normal, status) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const status = data.nilai ? 'completed' : 'pending';

        await db.execute(sql, [
            registration_id,
            data.parameter_name,
            data.nilai || null,
            data.satuan || null,
            data.range_normal || null,
            status
        ]);

        // Get the created test
        const [rows] = await db.query(
            'SELECT * FROM registration_tests WHERE registration_id = ? ORDER BY id DESC LIMIT 1',
            [registration_id]
        );
        return rows[0];
    },

    async getByRegistration(registration_id) {
        const rows = await db.query(
            'SELECT * FROM registration_tests WHERE registration_id = ? ORDER BY id ASC',
            [registration_id]
        );
        return rows;
    },

    async updateTest(testId, data) {
        const fields = Object.keys(data)
            .filter(key => key !== 'id')
            .map(key => `${key} = ?`)
            .join(', ');

        const values = Object.keys(data)
            .filter(key => key !== 'id')
            .map(key => data[key]);

        values.push(testId);

        const sql = `UPDATE registration_tests SET ${fields} WHERE id = ?`;
        await db.execute(sql, values);

        return this.findById(testId);
    },

    async findById(testId) {
        const rows = await db.query(
            'SELECT * FROM registration_tests WHERE id = ?',
            [testId]
        );
        return rows[0];
    },

    async validateTest(testId, data) {
        const sql = `
            UPDATE registration_tests 
            SET validation_status = ?, 
                validated_by = ?, 
                validation_note = ?, 
                validated_at = NOW() 
            WHERE id = ?
        `;

        await db.execute(sql, [
            data.validation_status,
            data.validated_by,
            data.validation_note || null,
            testId
        ]);

        return this.findById(testId);
    },

    async getTestsByRegistrationId(registrationId) {
        const sql = `
            SELECT rt.*, u.username as validator_name
            FROM registration_tests rt
            LEFT JOIN users u ON rt.validated_by = u.id
            WHERE rt.registration_id = ?
            ORDER BY rt.id ASC
        `;
        return await db.query(sql, [registrationId]);
    },

    async areAllTestsValidated(registrationId) {
        const sql = `
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN validation_status = 'approved' THEN 1 ELSE 0 END) as approved,
                   SUM(CASE WHEN validation_status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM registration_tests
            WHERE registration_id = ?
        `;
        const rows = await db.query(sql, [registrationId]);
        return rows[0];
    }
};

module.exports = TestModel;