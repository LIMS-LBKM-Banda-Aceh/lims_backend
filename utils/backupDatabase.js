// utils/backupDatabase.js

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { google } = require('googleapis');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const uploadToGoogleDrive = async (filePath, fileName) => {
    try {
        console.log(`[Google Drive] Memulai upload ${fileName}...`);

        const fileMetadata = {
            name: fileName,
            parents: [process.env.DRIVE_FOLDER_ID] // ID Folder tujuan
        };

        const media = {
            mimeType: 'application/sql',
            body: fs.createReadStream(filePath) // Gunakan stream agar hemat RAM
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });

        console.log(`✅ [Google Drive Success] File berhasil diupload dengan ID: ${response.data.id}`);

        // Opsional: Hapus file lokal setelah berhasil upload agar server tidak penuh
        // fs.unlinkSync(filePath);
        // console.log(`[Cleanup] File lokal ${fileName} telah dihapus.`);

    } catch (error) {
        console.error(`❌ [Google Drive Error] Gagal mengupload file:`, error.message);
    }
};

const backupDatabase = () => {
    const date = new Date();
    const dateString = date.toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const fileName = `lims_backup_${dateString}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);

    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'lims_db';
    const dbHost = process.env.DB_HOST || 'localhost';

    let dumpCommand = `"C:\\xampp\\mysql\\bin\\mysqldump.exe" -h ${dbHost} -u ${dbUser}`;
    if (dbPassword) {
        dumpCommand += ` -p"${dbPassword}"`;
    }
    dumpCommand += ` ${dbName} > "${filePath}"`;

    console.log(`[Backup] Mengekstrak database ke ${fileName}...`);

    exec(dumpCommand, async (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ [Backup Error] Gagal melakukan dump database:`, error.message);
            return;
        }
        console.log(`✅ [Backup Success] Dump SQL berhasil dibuat secara lokal.`);

        // Panggil fungsi upload ke Drive
        await uploadToGoogleDrive(filePath, fileName);
    });
};

module.exports = {
    startAutomatedBackup: () => {
        // Jalan tiap hari jam 18:00 AM
        cron.schedule('0 18 * * *', () => {
            console.log('[Backup Cron] Memulai proses backup otomatis ke Google Drive...');
            backupDatabase();
        }, {
            scheduled: true,
            timezone: "Asia/Jakarta"
        });

        console.log('✅ Auto-Backup ke Google Drive aktif (Berjalan tiap 06:00 PM).');
    },
    triggerManualBackup: backupDatabase
}; 