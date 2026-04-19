-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: lims_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `master_instalasi`
--

DROP TABLE IF EXISTS `master_instalasi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_instalasi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kode_instalasi` varchar(10) NOT NULL,
  `nama_instalasi` varchar(255) NOT NULL,
  `kode_sampel` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_instalasi`
--

LOCK TABLES `master_instalasi` WRITE;
/*!40000 ALTER TABLE `master_instalasi` DISABLE KEYS */;
INSERT INTO `master_instalasi` VALUES (1,'01','Instalasi Mikrobiologi dan Biomolekuler','1 IMB'),(2,'02','Instalasi Patologi Klinik dan Immunologi','2 IPK'),(3,'03','Instalasi Kesehatan Lingkungan, Vektor dan Binatang Pembawa Penyakit','3 IKL');
/*!40000 ALTER TABLE `master_instalasi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_pemeriksaan`
--

DROP TABLE IF EXISTS `master_pemeriksaan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_pemeriksaan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `instalasi_id` int(11) DEFAULT NULL,
  `kategori` varchar(255) NOT NULL,
  `nama_pemeriksaan` varchar(100) NOT NULL,
  `satuan` varchar(50) DEFAULT NULL,
  `nilai_rujukan` varchar(100) DEFAULT NULL,
  `metode` varchar(50) DEFAULT NULL,
  `harga` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `tipe` enum('tunggal','paket') DEFAULT 'tunggal',
  PRIMARY KEY (`id`),
  KEY `fk_mp_instalasi` (`instalasi_id`),
  CONSTRAINT `fk_mp_instalasi` FOREIGN KEY (`instalasi_id`) REFERENCES `master_instalasi` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=447 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_pemeriksaan`
--

LOCK TABLES `master_pemeriksaan` WRITE;
/*!40000 ALTER TABLE `master_pemeriksaan` DISABLE KEYS */;
INSERT INTO `master_pemeriksaan` VALUES (274,2,'HEMATOLOGI','Darah Rutin','Multiple','Lihat parameter','Various',80000.00,'2026-01-06 15:47:54','paket'),(275,2,'HEMATOLOGI','Morfologi Darah Tepi',NULL,NULL,NULL,10000.00,'2026-01-06 15:47:54','tunggal'),(276,2,'HEMATOLOGI','Laju Endap Darah (LED)','mm/jam',NULL,'Westergren',20000.00,'2026-01-06 15:47:54','tunggal'),(277,NULL,'HEMATOLOGI','Golongan Darah',NULL,NULL,'Slide',15000.00,'2026-01-06 15:47:54','tunggal'),(278,2,'IMMUNOSEROLOGI','HBsAg (Rapid)',NULL,NULL,'Rapid',60000.00,'2026-01-06 15:47:54','tunggal'),(279,2,'IMMUNOSEROLOGI','Anti HBs / HBs Ab (Rapid)',NULL,NULL,'Rapid',101000.00,'2026-01-06 15:47:54','tunggal'),(280,NULL,'IMMUNOSEROLOGI','Anti-HCV',NULL,NULL,'Rapid',60000.00,'2026-01-06 15:47:54','tunggal'),(281,2,'IMMUNOSEROLOGI','TPHA (Treponema Pallidum)',NULL,NULL,'Hemaglutinasi',50000.00,'2026-01-06 15:47:54','tunggal'),(282,NULL,'IMMUNOSEROLOGI','VDRL',NULL,NULL,'Flokulasi',50000.00,'2026-01-06 15:47:54','tunggal'),(283,NULL,'IMMUNOSEROLOGI','Triiodotironin (T3) Elisa',NULL,NULL,'Elisa',121000.00,'2026-01-06 15:47:54','tunggal'),(284,NULL,'IMMUNOSEROLOGI','Tetraiodotironin (T4) Elisa',NULL,NULL,'Elisa',121000.00,'2026-01-06 15:47:54','tunggal'),(285,NULL,'IMMUNOSEROLOGI','Thyroid Stimulating Hormon (TSH)',NULL,NULL,'Elisa',132000.00,'2026-01-06 15:47:54','tunggal'),(286,NULL,'IMMUNOSEROLOGI','Free Tiroksin (FT4)',NULL,NULL,'Elisa',161000.00,'2026-01-06 15:47:54','tunggal'),(287,NULL,'IMMUNOSEROLOGI','Anti Dengue IgG/IgM',NULL,NULL,'Rapid',150000.00,'2026-01-06 15:47:54','tunggal'),(288,NULL,'IMMUNOSEROLOGI','Tes Kehamilan',NULL,NULL,'Rapid',35000.00,'2026-01-06 15:47:54','tunggal'),(289,NULL,'IMMUNOSEROLOGI','Tes Narkoba',NULL,NULL,'Rapid',90000.00,'2026-01-06 15:47:54','tunggal'),(290,NULL,'IMMUNOSEROLOGI','CRP (C-Reactive Protein) Kualitatif',NULL,NULL,'Aglutinasi',50000.00,'2026-01-06 15:47:54','tunggal'),(291,NULL,'IMMUNOSEROLOGI','RF (Rheumatoid Factor) Kuantitatif',NULL,NULL,'Immunoturbidimetry',129000.00,'2026-01-06 15:47:54','tunggal'),(292,2,'IMMUNOSEROLOGI','ASTO (Anti Streptolisin O) Kuantitatif',NULL,'Positif/Negatif','Immunoturbidimetry',131000.00,'2026-01-06 15:47:54','tunggal'),(293,NULL,'IMMUNOSEROLOGI','Toxoplasma IgG',NULL,NULL,'Rapid/Elisa',110000.00,'2026-01-06 15:47:54','tunggal'),(294,NULL,'IMMUNOSEROLOGI','Toxoplasma IgM',NULL,NULL,'Rapid/Elisa',150000.00,'2026-01-06 15:47:54','tunggal'),(295,2,'KIMIA KLINIK','Bilirubin Total','mg/dL',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(296,2,'KIMIA KLINIK','Bilirubin Direct','mg/dL',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(297,2,'KIMIA KLINIK','Bilirubin Indirect','mg/dL',NULL,'Kalkulasi',29000.00,'2026-01-06 15:47:54','tunggal'),(298,2,'KIMIA KLINIK','Alkali Fosfatase','U/L',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(299,2,'KIMIA KLINIK','SGOT (ASAT)','U/L',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(300,2,'KIMIA KLINIK','SGPT (ALAT)','U/L',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(301,2,'KIMIA KLINIK','Total Protein','g/dL',NULL,'Fotometri',25000.00,'2026-01-06 15:47:54','tunggal'),(302,2,'KIMIA KLINIK','Albumin','g/dL','0,4 - 0,6','Fotometri',40000.00,'2026-01-06 15:47:54','tunggal'),(303,2,'KIMIA KLINIK','Globulin','g/dL',NULL,'Kalkulasi',25000.00,'2026-01-06 15:47:54','tunggal'),(304,2,'KIMIA KLINIK','Kolesterol Total','mg/dL',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(305,2,'KIMIA KLINIK','Kolesterol HDL','mg/dL',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(306,2,'KIMIA KLINIK','Kolesterol LDL','mg/dL',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(307,2,'KIMIA KLINIK','Trigliserida','mg/dL',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(308,2,'KIMIA KLINIK','Ureum','mg/dL',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(309,2,'KIMIA KLINIK','Asam Urat','mg/dL',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(310,2,'KIMIA KLINIK','Kreatinin','mg/dL',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(311,2,'KIMIA KLINIK','HbA1c','%',NULL,'HPLC/Imunoturbidimetry',145000.00,'2026-01-06 15:47:54','tunggal'),(312,2,'KIMIA KLINIK','Gula Darah','mg/dL',NULL,'Fotometri',30000.00,'2026-01-06 15:47:54','tunggal'),(313,2,'URINALISA','Urine Lengkap','Multiple','Lihat parameter','Various',20000.00,'2026-01-06 15:47:54','paket'),(314,1,'MIKROBIOLOGI','Angka Kuman','CFU',NULL,'Plate Count',60000.00,'2026-01-06 15:47:54','tunggal'),(315,2,'MIKROBIOLOGI','Clostridium sp. (Dalam Air)',NULL,NULL,'Kultur',42000.00,'2026-01-06 15:47:54','tunggal'),(316,1,'MIKROBIOLOGI','Clostridium sp. (Padat/Makanan/Sludge/Swab)',NULL,NULL,'Kultur',53000.00,'2026-01-06 15:47:54','tunggal'),(317,1,'MIKROBIOLOGI','Coliform (Dalam Air)',NULL,NULL,'MPN',77000.00,'2026-01-06 15:47:54','tunggal'),(318,1,'MIKROBIOLOGI','Coliform (Padat/Makanan/Sludge/Swab)',NULL,NULL,'MPN',80000.00,'2026-01-06 15:47:54','tunggal'),(319,1,'MIKROBIOLOGI','Escherichia Coli (Dalam Air)',NULL,NULL,'Kultur',88000.00,'2026-01-06 15:47:54','tunggal'),(320,1,'MIKROBIOLOGI','Escherichia Coli (Padat/Makanan/Sludge/Swab)',NULL,NULL,'Kultur',88000.00,'2026-01-06 15:47:54','tunggal'),(321,1,'MIKROBIOLOGI','Identifikasi Spesies Bakteri (Mikrobiologi Analyzer)',NULL,NULL,'Analyzer',210000.00,'2026-01-06 15:47:54','tunggal'),(322,1,'MIKROBIOLOGI','Staphylococcus sp. (Dalam Air)',NULL,NULL,'Kultur',42000.00,'2026-01-06 15:47:54','tunggal'),(323,1,'MIKROBIOLOGI','Staphylococcus sp. (Padat/Makanan/Sludge/Swab)',NULL,NULL,'Kultur',80000.00,'2026-01-06 15:47:54','tunggal'),(324,1,'MIKROBIOLOGI','Staphylococcus sp. (Dalam Udara)',NULL,NULL,'Kultur',150000.00,'2026-01-06 15:47:54','tunggal'),(325,1,'MIKROBIOLOGI','Streptococcus sp. (Dalam Air)',NULL,NULL,'Kultur',42000.00,'2026-01-06 15:47:54','tunggal'),(326,1,'MIKROBIOLOGI','Streptococcus sp. (Padat/Makanan/Sludge/Swab)',NULL,NULL,'Kultur',80000.00,'2026-01-06 15:47:54','tunggal'),(327,1,'MIKROBIOLOGI','Salmonella sp. (Dalam Air)',NULL,NULL,'Kultur',42000.00,'2026-01-06 15:47:54','tunggal'),(328,1,'MIKROBIOLOGI','Salmonella sp. (Padat/Makanan/Sludge/Swab)',NULL,NULL,'Kultur',150000.00,'2026-01-06 15:47:54','tunggal'),(329,1,'MIKROBIOLOGI','Shigella sp. (Dalam Air)',NULL,NULL,'Kultur',42000.00,'2026-01-06 15:47:54','tunggal'),(330,1,'MIKROBIOLOGI','Shigella sp. (Padat/Makanan/Sludge/Swab)',NULL,NULL,'Kultur',150000.00,'2026-01-06 15:47:54','tunggal'),(331,1,'MIKROBIOLOGI','Bacillus sp. (Dalam Air)',NULL,NULL,'Kultur',150000.00,'2026-01-06 15:47:54','tunggal'),(332,1,'MIKROBIOLOGI','Bacillus sp. (Padat/Makanan/Sludge/Swab)',NULL,NULL,'Kultur',150000.00,'2026-01-06 15:47:54','tunggal'),(333,1,'MIKROBIOLOGI','Bacillus sp. (Dalam Udara)',NULL,NULL,'Kultur',150000.00,'2026-01-06 15:47:54','tunggal'),(334,1,'MIKROBIOLOGI','Vibrio sp. (Padat/Makanan/Sludge/Swab)',NULL,NULL,'Kultur',150000.00,'2026-01-06 15:47:54','tunggal'),(335,1,'MIKROBIOLOGI','Klebsiella sp. (Dalam Air)',NULL,NULL,'Kultur',42000.00,'2026-01-06 15:47:54','tunggal'),(336,1,'MIKROBIOLOGI','Klebsiella sp. (Padat/Makanan/Sludge/Swab)',NULL,NULL,'Kultur',150000.00,'2026-01-06 15:47:54','tunggal'),(337,1,'MIKROBIOLOGI','Klebsiella sp. (Dalam Udara)',NULL,NULL,'Kultur',150000.00,'2026-01-06 15:47:54','tunggal'),(338,1,'MIKROBIOLOGI','Fungi/Jamur (Padat/Makanan/Sludge/Swab)',NULL,NULL,'Kultur',42000.00,'2026-01-06 15:47:54','tunggal'),(339,1,'MIKROBIOLOGI','Pewarnaan Jamur (KOH)',NULL,NULL,'Mikroskopis',25000.00,'2026-01-06 15:47:54','tunggal'),(340,1,'MIKROBIOLOGI','Pemeriksaan BTA (Basil Tahan Asam)',NULL,NULL,'Ziehl-Neelsen',24000.00,'2026-01-06 15:47:54','tunggal'),(341,1,'MIKROBIOLOGI','Malaria (Hematologi/Apusan Darah Tebal)',NULL,NULL,'Giemsa',50000.00,'2026-01-06 15:47:54','tunggal'),(342,NULL,'MIKROBIOLOGI','Pemeriksaan Pewarnaan Gram',NULL,NULL,'Mikroskopis',75000.00,'2026-01-06 15:47:54','tunggal'),(343,NULL,'MIKROBIOLOGI','Faeces Lengkap (Telur Cacing)',NULL,NULL,'Mikroskopis',25000.00,'2026-01-06 15:47:54','tunggal'),(344,1,'BIOMOLEKULER','PCR Konvensional (Per Gen)',NULL,NULL,'PCR',150000.00,'2026-01-06 15:47:54','tunggal'),(345,1,'BIOMOLEKULER','PCR Konvensional Difteri',NULL,NULL,'PCR',150000.00,'2026-01-06 15:47:54','tunggal'),(346,1,'BIOMOLEKULER','PCR Konvensional Legionella',NULL,NULL,'PCR',150000.00,'2026-01-06 15:47:54','tunggal'),(347,1,'BIOMOLEKULER','PCR Konvensional Malaria',NULL,NULL,'PCR',150000.00,'2026-01-06 15:47:54','tunggal'),(348,1,'BIOMOLEKULER','PCR Konvensional Filariasis',NULL,NULL,'PCR',150000.00,'2026-01-06 15:47:54','tunggal'),(349,NULL,'BIOMOLEKULER','Pemeriksaan PCR Umum',NULL,NULL,'PCR',250000.00,'2026-01-06 15:47:54','tunggal'),(350,1,'BIOMOLEKULER','Real Time PCR Pertusis',NULL,NULL,'Real Time PCR',250000.00,'2026-01-06 15:47:54','tunggal'),(351,1,'BIOMOLEKULER','Real Time PCR Tuberkulosis',NULL,NULL,'Real Time PCR',250000.00,'2026-01-06 15:47:54','tunggal'),(352,1,'BIOMOLEKULER','Real Time PCR M-Pox',NULL,NULL,'Real Time PCR',250000.00,'2026-01-06 15:47:54','tunggal'),(353,1,'BIOMOLEKULER','Real Time PCR Panel Respiratory (Per Gen)',NULL,NULL,'Real Time PCR',250000.00,'2026-01-06 15:47:54','tunggal'),(354,1,'BIOMOLEKULER','Real Time PCR Malaria (5 Plasmodium)',NULL,NULL,'Real Time PCR',250000.00,'2026-01-06 15:47:54','tunggal'),(355,1,'BIOMOLEKULER','Real Time PCR HPV',NULL,NULL,'Real Time PCR',250000.00,'2026-01-06 15:47:54','tunggal'),(356,NULL,'BIOMOLEKULER','RT-PCR (Per Gen)',NULL,NULL,'RT-PCR',300000.00,'2026-01-06 15:47:54','tunggal'),(357,1,'BIOMOLEKULER','Real Time PCR MersCov',NULL,NULL,'Real Time PCR',300000.00,'2026-01-06 15:47:54','tunggal'),(358,1,'BIOMOLEKULER','Real Time PCR HMPV',NULL,NULL,'Real Time PCR',300000.00,'2026-01-06 15:47:54','tunggal'),(359,1,'BIOMOLEKULER','Real Time PCR Covid-19',NULL,NULL,'Real Time PCR',300000.00,'2026-01-06 15:47:54','tunggal'),(360,1,'BIOMOLEKULER','Real Time PCR Zika/Dengue/Chikungunya (Per Gen)',NULL,NULL,'Real Time PCR',300000.00,'2026-01-06 15:47:54','tunggal'),(361,1,'BIOMOLEKULER','Real Time PCR Dengue Serotyping DEN 1-4',NULL,NULL,'Real Time PCR',300000.00,'2026-01-06 15:47:54','tunggal'),(362,NULL,'BIOMOLEKULER','Real Time PCR ILI-SARI',NULL,NULL,'Real Time PCR',300000.00,'2026-01-06 15:47:54','tunggal'),(363,1,'BIOMOLEKULER','Real Time PCR Subtype Flu A',NULL,NULL,'Real Time PCR',300000.00,'2026-01-06 15:47:54','tunggal'),(364,1,'BIOMOLEKULER','Real Time PCR Subtype Flu B',NULL,NULL,'Real Time PCR',300000.00,'2026-01-06 15:47:54','tunggal'),(365,3,'PENGUJIAN SAMPEL LINGKUNGAN PEMERIKSAAN UJI FISIKA (AIR)','Suhu Udara/Air','Celsius',NULL,'Fisika',2000.00,'2026-01-06 15:47:54','tunggal'),(366,3,'PENGUJIAN SAMPEL LINGKUNGAN PEMERIKSAAN UJI FISIKA (AIR)','Warna','TCU',NULL,'Fisika',7000.00,'2026-01-06 15:47:54','tunggal'),(367,3,'PENGUJIAN SAMPEL LINGKUNGAN PEMERIKSAAN UJI FISIKA (AIR)','Zat Terlarut (TDS)','mg/L',NULL,'Fisika',9000.00,'2026-01-06 15:47:54','tunggal'),(368,3,'PENGUJIAN SAMPEL LINGKUNGAN PEMERIKSAAN UJI FISIKA (AIR)','Zat Tersuspensi (TSS)','mg/L',NULL,'Fisika',9000.00,'2026-01-06 15:47:54','tunggal'),(369,3,'KESLING','Kekeruhan','NTU',NULL,'Fisika',10000.00,'2026-01-06 15:47:54','tunggal'),(370,3,'KESLING','Kejernihan',NULL,NULL,'Organoleptik',2000.00,'2026-01-06 15:47:54','tunggal'),(371,3,'KESLING','Bau',NULL,NULL,'Organoleptik',2000.00,'2026-01-06 15:47:54','tunggal'),(372,3,'KESLING','Rasa',NULL,NULL,'Organoleptik',2000.00,'2026-01-06 15:47:54','tunggal'),(373,3,'PEMERIKSAAN UJI FISIKA (AIR)','Besi (Fe) - Rapid','mg/L',NULL,'Rapid',30000.00,'2026-01-06 15:47:54','tunggal'),(374,3,'PENGUJIAN SAMPEL LINGKUNGAN PEMERIKSAAN UJI FISIKA (AIR)','Mangan (Mn)','mg/L',NULL,'Spektrofotometri',9000.00,'2026-01-06 15:47:54','tunggal'),(375,3,'PENGUJIAN SAMPEL LINGKUNGAN PEMERIKSAAN UJI FISIKA (AIR)','Kadmium (Cd) Air','mg/L',NULL,'AAS/Spektro',50000.00,'2026-01-06 15:47:54','tunggal'),(376,3,'PEMERIKSAAN UJI FISIKA (AIR)','Aluminium (Al) Air','mg/L',NULL,'Spektrofotometri',60000.00,'2026-01-06 15:47:54','tunggal'),(377,2,'PEMERIKSAAN UJI KIMIA (AIR)','Arsen (As) Air','mg/L',NULL,'Spektrofotometri',60000.00,'2026-01-06 15:47:54','tunggal'),(378,3,'PEMERIKSAAN UJI KIMIA (AIR)','Chrom Valensi 6 (Cr6+)','mg/L',NULL,'Spektrofotometri',20000.00,'2026-01-06 15:47:54','tunggal'),(379,3,'PEMERIKSAAN UJI KIMIA (AIR)','Nitrat (NO3)','mg/L',NULL,'Spektrofotometri',9000.00,'2026-01-06 15:47:54','tunggal'),(380,3,'PEMERIKSAAN UJI KIMIA (AIR)','Nitrit (NO2)','mg/L',NULL,'Spektrofotometri',9000.00,'2026-01-06 15:47:54','tunggal'),(381,NULL,'KESLING','pH (Air)',NULL,'6.5-8.5','Elektrometri',10000.00,'2026-01-06 15:47:54','tunggal'),(382,NULL,'KESLING','pH (Padat/Makanan/Minuman)',NULL,NULL,'Elektrometri',7000.00,'2026-01-06 15:47:54','tunggal'),(383,1,'PEMERIKSAAN UJI KIMIA (AIR)','Fluorida (Air)','mg/L',NULL,'Spektrofotometri',9000.00,'2026-01-06 15:47:54','tunggal'),(384,NULL,'KESLING','Timbal (Padat/Makanan/Minuman)','mg/L',NULL,'AAS',70000.00,'2026-01-06 15:47:54','tunggal'),(385,3,'UDARA (RUANGAN INDOOR)','Kebisingan Sesaat','dBA',NULL,'Sound Level Meter',15000.00,'2026-01-06 15:47:54','tunggal'),(386,3,'UDARA (RUANGAN INDOOR)','Kelembaban','% RH','40-60','Hygrometer',13000.00,'2026-01-06 15:47:54','tunggal'),(387,3,'UDARA (RUANGAN INDOOR)','Pencahayaan','Lux',NULL,'Lux Meter',13000.00,'2026-01-06 15:47:54','tunggal'),(388,3,'KESLING','Suhu Ruangan','Celsius',NULL,'Thermometer',13000.00,'2026-01-06 15:47:54','tunggal'),(389,3,'UDARA (RUANGAN INDOOR)','Arah dan Kecepatan Angin',NULL,NULL,'Anemometer',13000.00,'2026-01-06 15:47:54','tunggal'),(390,3,'UDARA (RUANGAN INDOOR)','Debu Suspended Particulate Matter (SPM) Sesaat Metode Elektrometri','µg/m3',NULL,'Elektrometri',68000.00,'2026-01-06 15:47:54','tunggal'),(391,NULL,'MAKANAN','Borax (Rapid Test)',NULL,'Negatif','Rapid',35000.00,'2026-01-06 15:47:54','tunggal'),(392,NULL,'MAKANAN','Formalin (Rapid Test)',NULL,'Negatif','Rapid',67000.00,'2026-01-06 15:47:54','tunggal'),(393,NULL,'MAKANAN','Rhodamin B (Rapid Test)',NULL,'Negatif','Rapid',36000.00,'2026-01-06 15:47:54','tunggal'),(394,NULL,'MAKANAN','Methanyl Yellow (Rapid Test)',NULL,'Negatif','Rapid',35000.00,'2026-01-06 15:47:54','tunggal'),(395,NULL,'MAKANAN','Sacharin (Rapid Test)',NULL,'Negatif','Rapid',32000.00,'2026-01-06 15:47:54','tunggal'),(396,NULL,'VEKTOR','Identifikasi Spesies Lalat','Per parameter',NULL,'Identifikasi',25000.00,'2026-01-06 15:47:54','tunggal'),(397,NULL,'VEKTOR','Identifikasi Spesies Nyamuk Aedes','Per parameter',NULL,'Identifikasi',25000.00,'2026-01-06 15:47:54','tunggal'),(398,NULL,'VEKTOR','Identifikasi Spesies Nyamuk Anopheles','Per parameter',NULL,'Identifikasi',25000.00,'2026-01-06 15:47:54','tunggal'),(399,NULL,'VEKTOR','Identifikasi Spesies Nyamuk Culex','Per parameter',NULL,'Identifikasi',25000.00,'2026-01-06 15:47:54','tunggal'),(400,NULL,'VEKTOR','Identifikasi Spesies Nyamuk Armigeres','Per parameter',NULL,'Identifikasi',25000.00,'2026-01-06 15:47:54','tunggal'),(401,NULL,'VEKTOR','Identifikasi Spesies Nyamuk Mansonia','Per parameter',NULL,'Identifikasi',25000.00,'2026-01-06 15:47:54','tunggal'),(402,NULL,'VEKTOR','Pembedahan Nyamuk (Kepala/Thorax/Abdomen)','Per ekor',NULL,'Bedah Mikroskopis',5000.00,'2026-01-06 15:47:54','tunggal'),(403,NULL,'PENYEDIAAN VEKTOR','Larva/Nyamuk Aedes aegypti (Perusahaan)','Ekor',NULL,NULL,2000.00,'2026-01-06 15:54:55','tunggal'),(404,NULL,'PENYEDIAAN VEKTOR','Larva/Nyamuk Aedes aegypti (Mahasiswa S2/S3)','Ekor',NULL,NULL,750.00,'2026-01-06 15:54:55','tunggal'),(405,NULL,'PENYEDIAAN VEKTOR','Larva/Nyamuk Aedes aegypti (Mahasiswa S1)','Ekor',NULL,NULL,350.00,'2026-01-06 15:54:55','tunggal'),(406,NULL,'PENYEDIAAN VEKTOR','Telur Nyamuk Aedes aegypti (Perusahaan)','100 Butir',NULL,NULL,1000.00,'2026-01-06 15:54:55','tunggal'),(407,NULL,'PENYEDIAAN VEKTOR','Telur Nyamuk Aedes aegypti (Mahasiswa S2/S3)','100 Butir',NULL,NULL,750.00,'2026-01-06 15:54:55','tunggal'),(408,NULL,'PENYEDIAAN VEKTOR','Telur Nyamuk Aedes aegypti (Mahasiswa S1)','100 Butir',NULL,NULL,500.00,'2026-01-06 15:54:55','tunggal'),(409,NULL,'PENYEDIAAN HEWAN','Mencit (Perusahaan)','Ekor',NULL,NULL,30000.00,'2026-01-06 15:54:55','tunggal'),(410,NULL,'PENYEDIAAN HEWAN','Mencit (Mahasiswa S2/S3)','Ekor',NULL,NULL,20000.00,'2026-01-06 15:54:55','tunggal'),(411,NULL,'PENYEDIAAN HEWAN','Mencit (Mahasiswa S1)','Ekor',NULL,NULL,10000.00,'2026-01-06 15:54:55','tunggal'),(412,NULL,'PENYEDIAAN HEWAN','Tikus Putih (Perusahaan)','Ekor',NULL,NULL,35000.00,'2026-01-06 15:54:55','tunggal'),(413,NULL,'PENYEDIAAN HEWAN','Tikus Putih (Mahasiswa S2/S3)','Ekor',NULL,NULL,25000.00,'2026-01-06 15:54:55','tunggal'),(414,NULL,'PENYEDIAAN HEWAN','Tikus Putih (Mahasiswa S1)','Ekor',NULL,NULL,15000.00,'2026-01-06 15:54:55','tunggal'),(415,NULL,'MAGANG & PENELITIAN','Magang Teknis Lab - Biologi','Paket (1-3 Hari)',NULL,'Magang',100000.00,'2026-01-06 15:54:55','tunggal'),(416,NULL,'MAGANG & PENELITIAN','Magang Teknis K3 Laboratorium','Paket (1-3 Hari)',NULL,'Magang',100000.00,'2026-01-06 15:54:55','tunggal'),(417,NULL,'MAGANG & PENELITIAN','Magang Teknis Lab Entomologi','Paket (1-3 Hari)',NULL,'Magang',100000.00,'2026-01-06 15:54:55','tunggal'),(418,NULL,'MAGANG & PENELITIAN','Magang Manajemen Data','Paket (1-3 Hari)',NULL,'Magang',100000.00,'2026-01-06 15:54:55','tunggal'),(419,NULL,'MAGANG & PENELITIAN','Magang Pemetaan','Paket (1-3 Hari)',NULL,'Magang',100000.00,'2026-01-06 15:54:55','tunggal'),(420,NULL,'MAGANG & PENELITIAN','Praktik Mahasiswa D3','Per Minggu',NULL,'Praktik',50000.00,'2026-01-06 15:54:55','tunggal'),(421,NULL,'MAGANG & PENELITIAN','Praktik Mahasiswa D4/S1','Per Minggu',NULL,'Praktik',80000.00,'2026-01-06 15:54:55','tunggal'),(422,NULL,'MAGANG & PENELITIAN','Praktik Mahasiswa S2','Per Minggu',NULL,'Praktik',140000.00,'2026-01-06 15:54:55','tunggal'),(423,NULL,'MAGANG & PENELITIAN','Penelitian Mahasiswa D3','Per Orang',NULL,'Penelitian',80000.00,'2026-01-06 15:54:55','tunggal'),(424,NULL,'MAGANG & PENELITIAN','Penelitian Mahasiswa D4','Per Orang',NULL,'Penelitian',120000.00,'2026-01-06 15:54:55','tunggal'),(425,NULL,'MAGANG & PENELITIAN','Penelitian Mahasiswa S1','Per Orang',NULL,'Penelitian',120000.00,'2026-01-06 15:54:55','tunggal'),(426,NULL,'MAGANG & PENELITIAN','Penelitian Mahasiswa S2','Per Orang',NULL,'Penelitian',500000.00,'2026-01-06 15:54:55','tunggal'),(436,NULL,'Medchical Chek Up','MCU','Multiple','Lihat parameter','Various',19000.00,'2026-01-11 11:14:29','paket'),(437,NULL,'Medchical Chek Up','Ehe','Multiple','Lihat parameter','Various',990.00,'2026-01-11 14:29:27','paket'),(438,NULL,'Medchical Chek Up','Eyoo','Multiple','Lihat parameter','Various',707070.00,'2026-01-12 04:18:57','paket'),(441,1,'MIKROBIOLOGI','Feaces Lengkap (Telur Cacing)',NULL,NULL,NULL,25000.00,'2026-03-04 01:53:39','tunggal'),(442,1,'BIOMOLEKULER','Bioteknologi terapan Polymerase Chain Reaction (PCR) dan Electroforesis',NULL,NULL,NULL,150000.00,'2026-03-04 01:54:57','tunggal'),(443,1,'BIOMOLEKULER','Pemeriksaan Polymerase Chain Reaction (PCR)',NULL,NULL,NULL,250000.00,'2026-03-04 01:57:50','tunggal'),(444,1,'BIOMOLEKULER','Pemeriksaan Reverse Transcription Polymerase Chain Reaction (RT-PCR) (Per gen)',NULL,NULL,NULL,300000.00,'2026-03-04 02:14:10','tunggal'),(445,1,'BIOMOLEKULER','Real Time PCR ILI-SARI',NULL,NULL,NULL,300000.00,'2026-03-04 02:15:55','tunggal'),(446,3,'PEMERIKSAAN UJI KIMIA DALAM ZAT PADAT/MAKANAN/MINUMAN/SLUDGE','Derajat Keasaman (pH) (Dalam Zat Padat/Makanan/Minuman/Sludge)',NULL,NULL,NULL,7000.00,'2026-03-04 02:32:22','tunggal');
/*!40000 ALTER TABLE `master_pemeriksaan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_pemeriksaan_parameters`
--

DROP TABLE IF EXISTS `master_pemeriksaan_parameters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_pemeriksaan_parameters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `master_pemeriksaan_id` int(11) NOT NULL,
  `parameter_name` varchar(255) NOT NULL,
  `satuan` varchar(50) DEFAULT NULL,
  `nilai_rujukan` varchar(255) DEFAULT NULL,
  `metode` varchar(100) DEFAULT NULL,
  `urutan` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `master_pemeriksaan_id` (`master_pemeriksaan_id`),
  CONSTRAINT `master_pemeriksaan_parameters_ibfk_1` FOREIGN KEY (`master_pemeriksaan_id`) REFERENCES `master_pemeriksaan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_pemeriksaan_parameters`
--

LOCK TABLES `master_pemeriksaan_parameters` WRITE;
/*!40000 ALTER TABLE `master_pemeriksaan_parameters` DISABLE KEYS */;
INSERT INTO `master_pemeriksaan_parameters` VALUES (18,436,'Hoy','Prastige','23','Heho',1,'2026-01-11 14:08:55'),(19,437,'Yokhoso','Kira','Kira','Doki',0,'2026-01-11 14:30:19'),(20,437,'Doki','Puyo','Puyo','Waku',1,'2026-01-11 14:30:19'),(38,438,'kk','kv','jk','jb',0,'2026-01-12 04:19:19'),(39,438,'jj','nn','nn','nn',1,'2026-01-12 04:19:19'),(120,274,'Leukosit','103/uL','4 - 11','VOLUMETRIC IMPEDANCE',0,'2026-03-04 18:49:39'),(121,274,'Eritrosit','106/uL','3,5 - 5','VOLUMETRIC IMPEDANCE',1,'2026-03-04 18:49:39'),(122,274,'Hemoglobin','g/dL','11 -16','VOLUMETRIC IMPEDANCE',2,'2026-03-04 18:49:39'),(123,274,'Hematokrit','%','35 - 50','VOLUMETRIC IMPEDANCE',3,'2026-03-04 18:49:39'),(124,274,'MCV','fL','80 - 100','VOLUMETRIC IMPEDANCE',4,'2026-03-04 18:49:39'),(125,274,'MCH','Pg','27 - 34','VOLUMETRIC IMPEDANCE',5,'2026-03-04 18:49:39'),(126,274,'MCHC			','g/dL','32 - 36	','VOLUMETRIC IMPEDANCE',6,'2026-03-04 18:49:39'),(127,274,'Trombosit','103/uL','100 - 450','VOLUMETRIC IMPEDANCE',7,'2026-03-04 18:49:39'),(128,274,'Limfosit','103/uL','0,6 – 3,5','VOLUMETRIC IMPEDANCE',8,'2026-03-04 18:49:39'),(129,274,'Neutrofil','103/uL','1,3 – 6,7','VOLUMETRIC IMPEDANCE',9,'2026-03-04 18:49:39'),(130,274,'MXD','103/uL','0,1 – 0,9','VOLUMETRIC IMPEDANCE',10,'2026-03-04 18:49:39'),(131,313,'Bilirubin','mg/dL','Negatif','STRIP AUTOMATED URINE CHEMISTRY',0,'2026-03-30 08:00:33'),(132,313,'Urobilinogen','mg/dL','Normal','STRIP AUTOMATED URINE CHEMISTRY',1,'2026-03-30 08:00:33'),(133,313,'Keton','mg/dL','Negatif','STRIP AUTOMATED URINE CHEMISTRY',2,'2026-03-30 08:00:33'),(134,313,'Ascorbat','mg/dL','Negatif','STRIP AUTOMATED URINE CHEMISTRY',3,'2026-03-30 08:00:33');
/*!40000 ALTER TABLE `master_pemeriksaan_parameters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration_details`
--

DROP TABLE IF EXISTS `registration_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registration_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `registration_id` int(11) NOT NULL,
  `pemeriksaan_id` int(11) NOT NULL,
  `harga_saat_ini` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `registration_id` (`registration_id`),
  KEY `pemeriksaan_id` (`pemeriksaan_id`),
  CONSTRAINT `registration_details_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `registration_details_ibfk_2` FOREIGN KEY (`pemeriksaan_id`) REFERENCES `master_pemeriksaan` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=651 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_details`
--

LOCK TABLES `registration_details` WRITE;
/*!40000 ALTER TABLE `registration_details` DISABLE KEYS */;
INSERT INTO `registration_details` VALUES (634,239,274,80000.00),(643,249,274,80000.00),(644,249,313,20000.00),(645,250,346,150000.00),(646,250,357,300000.00),(648,251,298,30000.00),(649,252,310,30000.00),(650,252,389,13000.00);
/*!40000 ALTER TABLE `registration_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration_tests`
--

DROP TABLE IF EXISTS `registration_tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registration_tests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `registration_id` int(11) NOT NULL,
  `pemeriksaan_name` varchar(255) DEFAULT NULL,
  `parameter_name` varchar(100) NOT NULL,
  `nilai` varchar(100) DEFAULT NULL,
  `satuan` varchar(50) DEFAULT NULL,
  `range_normal` varchar(100) DEFAULT NULL,
  `status` enum('pending','in_progress','completed') DEFAULT 'pending',
  `validation_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `validated_by` int(11) DEFAULT NULL,
  `validation_note` text DEFAULT NULL,
  `validated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `metode` varchar(50) DEFAULT NULL,
  `nilai_rujukan` varchar(100) DEFAULT NULL,
  `validator_id` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `registration_id` (`registration_id`),
  KEY `validated_by` (`validated_by`),
  CONSTRAINT `registration_tests_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `registration_tests_ibfk_2` FOREIGN KEY (`validated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1243 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_tests`
--

LOCK TABLES `registration_tests` WRITE;
/*!40000 ALTER TABLE `registration_tests` DISABLE KEYS */;
INSERT INTO `registration_tests` VALUES (1151,239,NULL,'Leukosit','5','103/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-17 03:54:31','VOLUMETRIC IMPEDANCE','4 - 11',NULL,'2026-03-17 03:54:31'),(1152,239,NULL,'Eritrosit','3.7','106/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-17 03:54:31','VOLUMETRIC IMPEDANCE','3,5 - 5',NULL,'2026-03-17 03:54:31'),(1153,239,NULL,'Hemoglobin','12','g/dL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-17 03:54:31','VOLUMETRIC IMPEDANCE','11 -16',NULL,'2026-03-17 03:54:31'),(1154,239,NULL,'Hematokrit','39','%',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-17 03:54:31','VOLUMETRIC IMPEDANCE','35 - 50',NULL,'2026-03-17 03:54:31'),(1155,239,NULL,'MCV','85','fL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-17 03:54:31','VOLUMETRIC IMPEDANCE','80 - 100',NULL,'2026-03-17 03:54:31'),(1156,239,NULL,'MCH','30','Pg',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-17 03:54:31','VOLUMETRIC IMPEDANCE','27 - 34',NULL,'2026-03-17 03:54:31'),(1157,239,NULL,'MCHC			','32','g/dL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-17 03:54:31','VOLUMETRIC IMPEDANCE','32 - 36	',NULL,'2026-03-17 03:54:31'),(1158,239,NULL,'Trombosit','100','103/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-17 03:54:31','VOLUMETRIC IMPEDANCE','100 - 450',NULL,'2026-03-17 03:54:31'),(1159,239,NULL,'Limfosit','0.9','103/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-17 03:54:31','VOLUMETRIC IMPEDANCE','0,6 – 3,5',NULL,'2026-03-17 03:54:31'),(1160,239,NULL,'Neutrofil','2.5','103/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-17 03:54:31','VOLUMETRIC IMPEDANCE','1,3 – 6,7',NULL,'2026-03-17 03:54:31'),(1161,239,NULL,'MXD','0.5','103/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-17 03:54:31','VOLUMETRIC IMPEDANCE','0,1 – 0,9',NULL,'2026-03-17 03:54:31'),(1222,249,'Darah Rutin','Leukosit','5','103/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','VOLUMETRIC IMPEDANCE','4 - 11',NULL,'2026-03-30 08:17:12'),(1223,249,'Darah Rutin','Eritrosit','5','106/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','VOLUMETRIC IMPEDANCE','3,5 - 5',NULL,'2026-03-30 08:17:12'),(1224,249,'Darah Rutin','Hemoglobin','26','g/dL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','VOLUMETRIC IMPEDANCE','11 -16',NULL,'2026-03-30 08:17:12'),(1225,249,'Darah Rutin','Hematokrit','45','%',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','VOLUMETRIC IMPEDANCE','35 - 50',NULL,'2026-03-30 08:17:12'),(1226,249,'Darah Rutin','MCV','56','fL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','VOLUMETRIC IMPEDANCE','80 - 100',NULL,'2026-03-30 08:17:12'),(1227,249,'Darah Rutin','MCH','52','Pg',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','VOLUMETRIC IMPEDANCE','27 - 34',NULL,'2026-03-30 08:17:12'),(1228,249,'Darah Rutin','MCHC			','14','g/dL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','VOLUMETRIC IMPEDANCE','32 - 36	',NULL,'2026-03-30 08:17:12'),(1229,249,'Darah Rutin','Trombosit','44','103/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','VOLUMETRIC IMPEDANCE','100 - 450',NULL,'2026-03-30 08:17:12'),(1230,249,'Darah Rutin','Limfosit','0,7','103/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','VOLUMETRIC IMPEDANCE','0,6 – 3,5',NULL,'2026-03-30 08:23:38'),(1231,249,'Darah Rutin','Neutrofil','5','103/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','VOLUMETRIC IMPEDANCE','1,3 – 6,7',NULL,'2026-03-30 08:17:12'),(1232,249,'Darah Rutin','MXD','1','103/uL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','VOLUMETRIC IMPEDANCE','0,1 – 0,9',NULL,'2026-03-30 08:17:12'),(1233,249,'Urine Lengkap','Bilirubin','Positif','mg/dL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','STRIP AUTOMATED URINE CHEMISTRY','Negatif',NULL,'2026-03-30 08:17:12'),(1234,249,'Urine Lengkap','Urobilinogen','Normal','mg/dL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','STRIP AUTOMATED URINE CHEMISTRY','Normal',NULL,'2026-03-30 08:17:12'),(1235,249,'Urine Lengkap','Keton','Positif','mg/dL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','STRIP AUTOMATED URINE CHEMISTRY','Negatif',NULL,'2026-03-30 08:17:12'),(1236,249,'Urine Lengkap','Ascorbat','Negatif','mg/dL',NULL,'completed','pending',NULL,NULL,NULL,'2026-03-30 08:15:34','STRIP AUTOMATED URINE CHEMISTRY','Negatif',NULL,'2026-03-30 08:17:12'),(1237,250,'PCR Konvensional Legionella','PCR Konvensional Legionella','7',NULL,NULL,'completed','pending',NULL,NULL,NULL,'2026-04-01 01:58:17','PCR',NULL,NULL,'2026-04-01 02:03:03'),(1238,250,'Real Time PCR MersCov','Real Time PCR MersCov','6',NULL,NULL,'completed','pending',NULL,NULL,NULL,'2026-04-01 01:58:17','Real Time PCR',NULL,NULL,'2026-04-01 02:03:03'),(1240,251,'Alkali Fosfatase','Alkali Fosfatase','32','U/L',NULL,'completed','pending',NULL,NULL,NULL,'2026-04-01 04:26:53','Fotometri',NULL,NULL,'2026-04-15 02:54:09'),(1241,252,'Kreatinin','Kreatinin',NULL,'mg/dL',NULL,'pending','pending',NULL,NULL,NULL,'2026-04-15 08:46:20','Fotometri',NULL,NULL,'2026-04-15 08:46:20'),(1242,252,'Arah dan Kecepatan Angin','Arah dan Kecepatan Angin',NULL,NULL,NULL,'pending','pending',NULL,NULL,NULL,'2026-04-15 08:46:20','Anemometer',NULL,NULL,'2026-04-15 08:46:20');
/*!40000 ALTER TABLE `registration_tests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registrations`
--

DROP TABLE IF EXISTS `registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_pasien` varchar(100) DEFAULT NULL,
  `tgl_lahir` date DEFAULT NULL,
  `umur` int(11) DEFAULT NULL,
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `nik` varchar(20) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `no_kontak` varchar(20) DEFAULT NULL,
  `asal_sampel` varchar(100) DEFAULT NULL,
  `pengirim_instansi` varchar(255) DEFAULT NULL,
  `tgl_daftar` date DEFAULT NULL,
  `waktu_daftar` time DEFAULT NULL,
  `tgl_pengambilan` date DEFAULT NULL,
  `no_sampel_lab` varchar(255) DEFAULT NULL,
  `form_pe` varchar(50) DEFAULT NULL,
  `petugas_input` varchar(50) DEFAULT NULL,
  `kode_ins` varchar(50) DEFAULT NULL,
  `jenis_pemeriksaan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `no_reg` varchar(50) DEFAULT NULL,
  `no_invoice` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `validator` varchar(100) DEFAULT NULL,
  `validated_at` timestamp NULL DEFAULT NULL,
  `ket_pengerjaan` text DEFAULT NULL,
  `waktu_mulai_periksa` datetime DEFAULT NULL,
  `waktu_selesai_periksa` datetime DEFAULT NULL,
  `total_biaya` decimal(15,2) DEFAULT 0.00,
  `catatan_tambahan` text DEFAULT NULL,
  `status_pembayaran` enum('berbayar','gratis') DEFAULT 'berbayar',
  `last_sample_seq` int(11) DEFAULT 0,
  `link_hasil` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unique_no_sampel` (`no_sampel_lab`)
) ENGINE=InnoDB AUTO_INCREMENT=253 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registrations`
--

LOCK TABLES `registrations` WRITE;
/*!40000 ALTER TABLE `registrations` DISABLE KEYS */;
INSERT INTO `registrations` VALUES (239,'Stevani','2016-08-03',9,'P','8989898989888984','Blang Pidie,Aceh Barat Daya','0812121211121212','Mandiri','RSUD Lhokseumawe','2026-03-04','01:56:00','2026-03-04','2 IPK 1 3 2026',NULL,'Defri Salwan, S.Kom',NULL,'Darah Rutin (1)','2026-03-04 18:25:14','2026-03-17 03:54:31','REG-20260305-002','1/690798/PNBP/2026','selesai','Defri Salwan, S.Kom','2026-03-05 01:38:39',NULL,'2026-03-05 01:56:25','2026-03-05 08:37:08',80000.00,NULL,'berbayar',1,NULL),(249,'Alex Smith','2013-08-30',12,'L','8080808080808080','Kreung Paseh','082342432473','Mandiri',NULL,'2026-03-30','15:15:54','2026-03-30','2 IPK 2 3 2026',NULL,'Defri Salwan, S.Kom',NULL,'Darah Rutin (1), Urine Lengkap (1)','2026-03-30 08:15:34','2026-03-30 08:23:46','REG-20260330-001','2/690798/PNBP/2026','selesai','Defri Salwan, S.Kom','2026-03-30 08:23:46',NULL,'2026-03-30 15:16:00','2026-03-30 15:23:38',100000.00,NULL,'berbayar',2,NULL),(250,'Eyo Smith Nico','2005-04-01',21,'L','9090909090900909','Takengon, Aceh Tengah','082342432473','Mandiri',NULL,'2026-04-01','08:58:52','2026-04-01','1 IMB 3 4 2026',NULL,'Defri Salwan, S.Kom',NULL,'PCR Konvensional Legionella (1), Real Time PCR MersCov (1)','2026-04-01 01:58:17','2026-04-14 08:46:59','REG-20260401-001','3/690798/PNBP/2026','selesai','Admin, S.Kom','2026-04-06 08:59:08',NULL,'2026-04-01 09:00:15','2026-04-01 09:03:03',450000.00,NULL,'berbayar',3,NULL),(251,'Alex Smith','2019-07-31',6,'L','9834352032923434','Kreung Barona Jaya','082342432473','Mandiri',NULL,'2026-04-10','11:25:00','2026-03-31','2 IPK 4 4 2026',NULL,'Defri Salwan, S.Kom',NULL,'Alkali Fosfatase (1)','2026-04-01 04:25:39','2026-04-15 02:54:09','REG-20260401-002',NULL,'selesai_uji',NULL,NULL,NULL,'2026-04-10 15:05:11','2026-04-15 09:54:09',30000.00,NULL,'berbayar',4,NULL),(252,'Brandon Smith Nicolas','2011-08-15',14,'L','8080808080808081','Bada Kreung Baru Raya, Banda Aceh','082342342342','Rujukan','-','2026-04-15','15:46:20',NULL,'2 IPK 5 4 2026, 3 IKL 5 4 2026',NULL,'Admin, S.Kom',NULL,'Kreatinin (1), Arah dan Kecepatan Angin (1)','2026-04-15 08:46:20','2026-04-15 08:46:20','REG-20260415-001',NULL,'terdaftar',NULL,NULL,NULL,NULL,NULL,43000.00,NULL,'berbayar',5,NULL);
/*!40000 ALTER TABLE `registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','input','sampler','lab','manajemen','kasir','validator') DEFAULT 'input',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `instalasi_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_user_instalasi` (`instalasi_id`),
  CONSTRAINT `fk_user_instalasi` FOREIGN KEY (`instalasi_id`) REFERENCES `master_instalasi` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (37,'admin','Admin Ni Bos','$2a$10$JEfBu6o4ejrcXXpemZ8eDejFn7WHWBCNjcUSTZfonAGnPCa/9Yn6q','admin','2025-12-10 04:55:27','2026-01-08 16:13:44',NULL),(50,'lims','Admin, S.Kom','$2a$10$IJ4l9AJHgeI8QeonhPdgTe0xMalzUMyneAcQEYIleWQ/YFB/lpgs2','admin','2026-01-08 15:33:44','2026-04-01 04:30:27',NULL),(51,'kasir','Fitria Humaira, A.Md, S.E','$2a$10$ysKk5wyFvVV4ytkdeRdPNeJxGQO.s/GlpKdqM7KtAGO6R0PNU3LDy','kasir','2026-01-09 02:20:37','2026-02-10 11:05:23',NULL),(52,'input','Andre','$2a$10$PB4lQjztxgPXDhvkhWh02Occ03e.FYlWoj6Tyfo/UShUd5xsu2BpS','input','2026-01-09 02:26:38','2026-03-03 09:08:46',NULL),(53,'sampling','Sampling Ni Bos','$2a$10$oWZU3/dXejyRVvGnxaTt9O.yFY9FMXZwKZcvj8MWyxUZwmxot8vyS','sampler','2026-01-10 08:32:05','2026-01-10 08:32:05',NULL),(54,'lab','Fahri S,Kep','$2a$10$2E2hFfRDovD0qjSM.FTS3.64PlN8U/j9gczcMk3ecNOlB1PzLhucy','lab','2026-01-10 09:37:41','2026-03-04 14:04:43',2),(55,'alex','alex','$2a$10$BwNobqR6LTizwIn3VVILsev4eqqrqWb8kuIjRIYUMKF2KsuUeyQqG','input','2026-01-11 08:59:10','2026-01-11 08:59:10',NULL),(56,'manajemen','Manajemen Nih Bos','$2a$10$d3PP38XU9VVKdOXhlPUE5e50QZA9UTf7qbOjQn9RZnhgWyEB3ygvm','manajemen','2026-01-12 03:54:15','2026-01-12 03:54:15',NULL),(57,'validator','dr. Uzi Mardha Phoenna, Sp.PK','$2a$10$5WiaAmzIpEQyxR/y7v7LH.vlqcgWfLS61wxeCtDwVsEZLnYdWy/eC','validator','2026-01-28 04:48:17','2026-01-30 08:36:24',NULL),(58,'alya','Alya Ulfayanti','$2a$10$9KlrI1nUhb2Tzgr5kjoV9uK/hc1i8yMH9suvU1vHovRs7.YRUc5dm','lab','2026-03-03 07:54:22','2026-03-04 02:18:15',1),(59,'dara','Dara','$2a$10$AR4ONq/4SicsZv6c9Rsl6OPrwKgggEMb1xM3DqlUjQocr3y2XyTFW','kasir','2026-03-04 04:09:07','2026-03-04 04:09:07',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-15 18:00:00
