const db = require('../config/dbConfig');

const SettingModel = {
    // Ambil semua setting dan ubah jadi object (dict)
    async getAllSettings() {
        const rows = await db.query('SELECT setting_key, setting_value FROM system_settings');
        const settings = {};
        // Normalisasi hasil query agar aman
        const data = Array.isArray(rows[0]) ? rows[0] : rows;

        data.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        return settings;
    },

    // Update atau Insert (Upsert) setting baru
    async updateSetting(key, value) {
        const sql = `
            INSERT INTO system_settings (setting_key, setting_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE setting_value = ?
        `;
        return await db.execute(sql, [key, value, value]);
    }
};

module.exports = SettingModel;