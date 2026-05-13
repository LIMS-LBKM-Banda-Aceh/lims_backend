// controllers/settingController.js
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
        // FIX: Tambahkan allow_public_download ke dalam destructuring
        const { signature_mode, kode_laboratorium, use_kop_surat, allow_public_download } = req.body;

        // Update masing-masing setting jika ada dalam payload
        if (signature_mode !== undefined) {
            await SettingModel.updateSetting('signature_mode', signature_mode);
        }
        if (kode_laboratorium !== undefined) {
            await SettingModel.updateSetting('kode_laboratorium', kode_laboratorium);
        }
        if (use_kop_surat !== undefined) {
            await SettingModel.updateSetting('use_kop_surat', String(use_kop_surat));
        }
        // FIX: Simpan allow_public_download ke tabel system_settings
        if (allow_public_download !== undefined) {
            await SettingModel.updateSetting('allow_public_download', String(allow_public_download));
        }

        res.json({ success: true, message: 'Pengaturan berhasil diperbarui secara global' });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};