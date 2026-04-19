// models/settingModel.js
const prisma = require('../config/prisma');

const SettingModel = {
    async getAllSettings() {
        const rows = await prisma.system_settings.findMany();
        const settings = {};

        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        return settings;
    },

    async updateSetting(key, value) {
        return await prisma.system_settings.upsert({
            where: { setting_key: key },
            update: { setting_value: value },
            create: { setting_key: key, setting_value: value }
        });
    }
};

module.exports = SettingModel;