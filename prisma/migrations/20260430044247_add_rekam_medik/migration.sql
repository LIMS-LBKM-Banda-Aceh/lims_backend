-- CreateTable
CREATE TABLE `master_instalasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_instalasi` VARCHAR(10) NOT NULL,
    `nama_instalasi` VARCHAR(255) NOT NULL,
    `kode_sampel` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_pemeriksaan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instalasi_id` INTEGER NULL,
    `kategori` VARCHAR(255) NOT NULL,
    `nama_pemeriksaan` VARCHAR(100) NOT NULL,
    `satuan` VARCHAR(50) NULL,
    `nilai_rujukan` VARCHAR(100) NULL,
    `metode` VARCHAR(50) NULL,
    `harga` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `tipe` ENUM('tunggal', 'paket') NULL DEFAULT 'tunggal',

    INDEX `fk_mp_instalasi`(`instalasi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_pemeriksaan_parameters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `master_pemeriksaan_id` INTEGER NOT NULL,
    `parameter_name` VARCHAR(255) NOT NULL,
    `satuan` VARCHAR(50) NULL,
    `nilai_rujukan` VARCHAR(255) NULL,
    `metode` VARCHAR(100) NULL,
    `urutan` INTEGER NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `master_pemeriksaan_id`(`master_pemeriksaan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registration_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registration_id` INTEGER NOT NULL,
    `pemeriksaan_id` INTEGER NOT NULL,
    `harga_saat_ini` DECIMAL(12, 2) NOT NULL,

    INDEX `pemeriksaan_id`(`pemeriksaan_id`),
    INDEX `registration_id`(`registration_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registration_tests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registration_id` INTEGER NOT NULL,
    `pemeriksaan_name` VARCHAR(255) NULL,
    `parameter_name` VARCHAR(100) NOT NULL,
    `nilai` VARCHAR(100) NULL,
    `satuan` VARCHAR(50) NULL,
    `range_normal` VARCHAR(100) NULL,
    `status` ENUM('pending', 'in_progress', 'completed') NULL DEFAULT 'pending',
    `validation_status` ENUM('pending', 'approved', 'rejected') NULL DEFAULT 'pending',
    `validated_by` INTEGER NULL,
    `validation_note` TEXT NULL,
    `validated_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `metode` VARCHAR(50) NULL,
    `nilai_rujukan` VARCHAR(100) NULL,
    `validator_id` INTEGER NULL,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `registration_id`(`registration_id`),
    INDEX `validated_by`(`validated_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registrations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_pasien` VARCHAR(100) NULL,
    `tgl_lahir` DATE NULL,
    `umur` INTEGER NULL,
    `jenis_kelamin` ENUM('L', 'P') NULL,
    `nik` VARCHAR(20) NULL,
    `alamat` TEXT NULL,
    `no_kontak` VARCHAR(20) NULL,
    `asal_sampel` VARCHAR(100) NULL,
    `pengirim_instansi` VARCHAR(255) NULL,
    `tgl_daftar` DATE NULL,
    `waktu_daftar` TIME(0) NULL,
    `tgl_pengambilan` DATE NULL,
    `no_sampel_lab` VARCHAR(255) NULL,
    `form_pe` VARCHAR(50) NULL,
    `petugas_input` VARCHAR(50) NULL,
    `kode_ins` VARCHAR(50) NULL,
    `jenis_pemeriksaan` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `no_reg` VARCHAR(50) NULL,
    `no_invoice` VARCHAR(100) NULL,
    `status` VARCHAR(50) NULL,
    `validator` VARCHAR(100) NULL,
    `validated_at` TIMESTAMP(0) NULL,
    `ket_pengerjaan` TEXT NULL,
    `waktu_mulai_periksa` DATETIME(0) NULL,
    `waktu_selesai_periksa` DATETIME(0) NULL,
    `total_biaya` DECIMAL(15, 2) NULL DEFAULT 0.00,
    `catatan_tambahan` TEXT NULL,
    `status_pembayaran` ENUM('berbayar', 'gratis') NULL DEFAULT 'berbayar',
    `last_sample_seq` INTEGER NULL DEFAULT 0,
    `link_hasil` VARCHAR(255) NULL,
    `no_rekam_medik` VARCHAR(50) NULL,
    `waktu_pengambilan` DATETIME(3) NULL,

    UNIQUE INDEX `idx_unique_no_sampel`(`no_sampel_lab`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `setting_key` VARCHAR(50) NOT NULL,
    `setting_value` VARCHAR(255) NOT NULL,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `setting_key`(`setting_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `fullname` VARCHAR(100) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'input', 'sampler', 'lab', 'manajemen', 'kasir', 'validator') NULL DEFAULT 'input',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `instalasi_id` INTEGER NULL,

    INDEX `fk_user_instalasi`(`instalasi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `master_pemeriksaan` ADD CONSTRAINT `fk_mp_instalasi` FOREIGN KEY (`instalasi_id`) REFERENCES `master_instalasi`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `master_pemeriksaan_parameters` ADD CONSTRAINT `master_pemeriksaan_parameters_ibfk_1` FOREIGN KEY (`master_pemeriksaan_id`) REFERENCES `master_pemeriksaan`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `registration_details` ADD CONSTRAINT `registration_details_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `registration_details` ADD CONSTRAINT `registration_details_ibfk_2` FOREIGN KEY (`pemeriksaan_id`) REFERENCES `master_pemeriksaan`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `registration_tests` ADD CONSTRAINT `registration_tests_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `registration_tests` ADD CONSTRAINT `registration_tests_ibfk_2` FOREIGN KEY (`validated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_user_instalasi` FOREIGN KEY (`instalasi_id`) REFERENCES `master_instalasi`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
