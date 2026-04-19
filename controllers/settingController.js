const SettingModel = require('../models/settingModel');

exports.getSettings = async (req, res) => {
    try {
        const settings = await SettingModel.getAllSettings();
        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('Error getting settings:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { signature_mode } = req.body;

        if (signature_mode) {
            await SettingModel.updateSetting('signature_mode', signature_mode);
        }

        res.json({ success: true, message: 'Pengaturan berhasil diperbarui secara global' });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};