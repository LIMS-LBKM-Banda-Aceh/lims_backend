// utils/backupDatabase.js

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const backupDatabase = async () => {
    const date = new Date();
    // Format: YYYY-MM-DDTHH-mm-ss
    const dateString = date.toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const fileName = `lims_backup_${dateString}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);

    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'lims_db';
    const dbHost = process.env.DB_HOST || 'localhost';

    // Sesuaikan path mysqldump dengan environment. 
    // Menggunakan path absolut XAMPP sesuai kode sebelumnya.
    let dumpCommand = `"C:\\xampp\\mysql\\bin\\mysqldump.exe" -h ${dbHost} -u ${dbUser}`;
    if (dbPassword) {
        dumpCommand += ` -p"${dbPassword}"`;
    }
    dumpCommand += ` ${dbName} > "${filePath}"`;

    try {
        console.log(`[Backup] Mengekstrak database ${dbName} ke ${fileName}...`);

        // 1. Eksekusi Dump Database
        await exec(dumpCommand);
        console.log(`✅ [Backup Success] Dump SQL berhasil dibuat secara lokal.`);

        // 2. Eksekusi Rclone
        const rcloneRemote = process.env.RCLONE_REMOTE_NAME || 'gdrive';
        const rcloneFolder = process.env.RCLONE_DEST_FOLDER || 'Backup_LIMS';

        console.log(`[Rclone] Memulai upload ${fileName} ke Google Drive via Rclone...`);

        // Gunakan 'copy' untuk mempertahankan file lokal. 
        // Jika ingin otomatis menghapus file lokal setelah upload berhasil, ganti 'copy' menjadi 'move'.
        const rcloneCommand = `rclone copy "${filePath}" "${rcloneRemote}:${rcloneFolder}"`;

        await exec(rcloneCommand);
        console.log(`✅ [Rclone Success] File berhasil diamankan ke ${rcloneRemote}:${rcloneFolder}`);

        // 3. Cleanup Lokal (Opsional)
        // Jika menggunakan 'copy' tapi tetap ingin menghapus file lokal:
        // fs.unlinkSync(filePath);
        // console.log(`[Cleanup] File lokal ${fileName} telah dihapus dari server.`);

    } catch (error) {
        console.error(`❌ [Backup/Rclone Error] Proses gagal:`, error.message);
    }
};

module.exports = {
    startAutomatedBackup: () => {
        // Berjalan setiap hari jam 18:00 WIB
        cron.schedule('0 18 * * *', () => {
            console.log('[Backup Cron] Memulai proses auto-backup & rclone sync...');
            backupDatabase();
        }, {
            scheduled: true,
            timezone: "Asia/Jakarta"
        });

        console.log('✅ Auto-Backup Rclone aktif (Berjalan tiap 18:00 WIB).');
    },
    triggerManualBackup: backupDatabase
};