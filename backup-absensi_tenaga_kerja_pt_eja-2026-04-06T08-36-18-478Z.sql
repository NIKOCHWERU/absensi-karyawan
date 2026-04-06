/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.13-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: absensi_tenaga_kerja_pt_eja
-- ------------------------------------------------------
-- Server version	10.11.13-MariaDB-0ubuntu0.24.04.1

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
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(512) DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `author_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_announcements_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES
(1,'Selamat Datang di Sistem Absensi','Ini adalah pengumuman pertama. Silahkan melakukan absensi setiap hari kerja.',NULL,NULL,'2026-03-04 01:44:30',1),
(2,'test','wwwwwwwwwwwwwwwwwwww','/uploads/1772618142196-ABSENSI MANAGEMENT PT ELOK JAYA ABADHI.jpeg','2026-03-04 16:00:00','2026-03-04 09:55:42',2);
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `check_in` timestamp NULL DEFAULT NULL,
  `check_in_photo` varchar(255) DEFAULT NULL,
  `check_in_location` text DEFAULT NULL,
  `break_start` timestamp NULL DEFAULT NULL,
  `break_start_photo` varchar(255) DEFAULT NULL,
  `break_start_location` text DEFAULT NULL,
  `break_end` timestamp NULL DEFAULT NULL,
  `break_end_photo` varchar(255) DEFAULT NULL,
  `break_end_location` text DEFAULT NULL,
  `check_out` timestamp NULL DEFAULT NULL,
  `check_out_photo` varchar(255) DEFAULT NULL,
  `check_out_location` text DEFAULT NULL,
  `shift` varchar(50) DEFAULT NULL,
  `session_number` int(11) DEFAULT 1,
  `status` enum('present','late','sick','permission','cuti','absent','off','libur') DEFAULT 'absent',
  `notes` text DEFAULT NULL,
  `late_reason` text DEFAULT NULL,
  `late_reason_photo` varchar(255) DEFAULT NULL,
  `permit_exit_at` timestamp NULL DEFAULT NULL,
  `permit_resume_at` timestamp NULL DEFAULT NULL,
  `shift_id` int(11) DEFAULT NULL,
  `is_fake_gps` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_attendance_user_id` (`user_id`),
  KEY `idx_attendance_date` (`date`),
  KEY `idx_attendance_user_date` (`user_id`,`date`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES
(1,3,'2026-03-06','2026-03-06 00:57:13','1Hj7Pth2FXHjc6JL0sWW_B4so6TscK3Eo','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-06 07:59:59',NULL,NULL,'Shift 3',1,'late','Sesi ditutup otomatis: Lupa Absen Pulang','Tes','1BWb-aDRJkwzwpx3RqL3IscY05c4u1vLW',NULL,NULL,NULL,0),
(2,3,'2026-03-09','2026-03-08 18:24:16','1hz2fggwv9D_x0vMPk0issCEOu8QTdksH','Jalan Teratai, Karawang, Nagasari, Karawang Barat, Karawang, Jawa Barat, Jawa, 41312, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Shift 1',1,'late',NULL,'Terlambat','1kHh2JmF6Y_zi4l4d4VQ-xppuNiwtrdRJ',NULL,NULL,NULL,0),
(3,76,'2026-03-10','2026-03-09 20:31:06','1nM_W1AE0cbaFGYOcWh4LEcEy0paQhUyf','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-10 05:16:49','1t-Fhw2YgdSS5QYECRhtGY5vEttXKby7q','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-10 05:16:56','1vieTRPVQSKZRkLtI45F29pAWfXV7Dqvq','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-10 05:17:03','1KEj_wkznDaQwdKlViJthDktrr3v2365d','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','Shift 1',1,'late',NULL,'p',NULL,NULL,NULL,NULL,0),
(4,76,'2026-03-10','2026-03-10 08:23:36','1fOqwNcHAkLOxm8fp2Y0hk1ftIinhDGpF','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-10 07:59:59',NULL,NULL,'Shift 1',2,'late','Sesi ditutup otomatis: Lupa Absen Pulang',NULL,NULL,NULL,NULL,NULL,0),
(5,76,'2026-03-11','2026-03-10 19:25:28',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-10 19:25:28',NULL,NULL,NULL,1,'off','[Libur sebelum kerja] Libur Bekerja / Off Day',NULL,NULL,NULL,NULL,NULL,0),
(6,76,'2026-03-11','2026-03-10 19:26:10','1VN72STrIWXsVBugOTch90RC50u93Fezr','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-10 19:26:25','1z9WZtRiW7hH1bQkUyfDovSuCDWnVuu7v','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-10 19:26:34','1cV6k_FoCS7GT7h8GKTzOXLB8Kzr5ptTQ','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-10 19:26:48','1u4AGlERWwKVgZWEpNtrvXP1YXomz2TK4','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','Karyawan',2,'late',NULL,NULL,NULL,NULL,NULL,NULL,0),
(7,76,'2026-03-11','2026-03-10 21:55:45','1OuMN_ERMJ-cra3hSUiX4Ke1u6dxjbL5Z','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-11 07:59:59',NULL,NULL,'Karyawan',3,'late','Sesi ditutup otomatis: Lupa Absen Pulang',NULL,NULL,NULL,NULL,NULL,0),
(8,76,'2026-03-13','2026-03-13 00:51:40',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-13 00:51:40',NULL,NULL,NULL,1,'off','[Libur sebelum kerja] Libur Bekerja / Off Day',NULL,NULL,NULL,NULL,NULL,0),
(9,76,'2026-03-13','2026-03-13 00:52:29','1oSYIFzIZGqaJW4CX-INivEtLd1FUPNSj','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-13 00:52:36','1-XS3iEtsXhQZvnSl-N6rIi_h0h8Dj9xj','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-13 00:52:43','1753Gef-phahcVvas6XtEvgGe-1hTt2KK','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-13 00:52:51','15-mRa1e4q2kiPivs1aoup8m0ptGy-9d7','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','Karyawan',2,'late',NULL,NULL,NULL,NULL,NULL,NULL,0),
(11,76,'2026-03-18','2026-03-18 00:01:04',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-18 00:01:04',NULL,NULL,NULL,1,'off','[Libur sebelum kerja] Libur Bekerja / Off Day',NULL,NULL,NULL,NULL,NULL,0),
(12,76,'2026-03-18','2026-03-18 00:08:40','1rkBqBKG8qkfhudF7R5409rw9AEq9nfwG','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-18 00:26:52','1mW6KABFRbCWikOHHqonXXq9wcVKy4IqU','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia',NULL,NULL,NULL,'2026-03-18 07:59:59',NULL,NULL,'Karyawan',2,'late','Sesi ditutup otomatis: Lupa Absen Pulang',NULL,NULL,NULL,NULL,NULL,0),
(13,78,'2026-03-25','2026-03-25 01:05:20','1oUJDwPTpNaYsE4VacmFoROCq3ncrUlOO','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-25 07:59:59',NULL,NULL,'Shift 1',1,'late','Sesi ditutup otomatis: Lupa Absen Pulang','Test','1CM3XEOrAiuj3NHKMS21tAoUoKDcKgBpe',NULL,NULL,1,0),
(15,80,'2026-03-28',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Karyawan',1,'cuti','Cuti Disetujui: Test',NULL,NULL,NULL,NULL,NULL,0),
(16,80,'2026-03-31',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Karyawan',1,'cuti','Cuti Disetujui: Test',NULL,NULL,NULL,NULL,NULL,0),
(17,80,'2026-03-29',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Karyawan',1,'cuti','Cuti Disetujui: Test',NULL,NULL,NULL,NULL,NULL,0),
(18,80,'2026-03-30',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Karyawan',1,'cuti','Cuti Disetujui: Test',NULL,NULL,NULL,NULL,NULL,0),
(19,80,'2026-04-01',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Karyawan',1,'cuti','Cuti Disetujui: Test',NULL,NULL,NULL,NULL,NULL,0),
(20,80,'2026-04-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Karyawan',1,'cuti','Cuti Disetujui: Test',NULL,NULL,NULL,NULL,NULL,0),
(21,80,'2026-04-03',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Karyawan',1,'cuti','Cuti Disetujui: Test',NULL,NULL,NULL,NULL,NULL,0),
(22,80,'2026-04-04',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Karyawan',1,'cuti','Cuti Disetujui: Test',NULL,NULL,NULL,NULL,NULL,0),
(23,80,'2026-03-27','2026-03-27 01:53:02','13TNCR4w3kCUpTCbYqJutyJizOVM55QL9','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'longshift',1,'late',NULL,'Test','17YCcry4lCRMbvQC-whE3niqEaMD_p-Xv',NULL,NULL,4,0),
(24,83,'2026-03-28','2026-03-28 09:23:45','1SnOr3jehxBQvZV1HF3T4P7Y1LCH91Ddq','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-28 09:24:11','1TrLFvNU5Z9lsmwgUadRkXI3hE3mwHzm3',NULL,'Shift 1',1,'permission','[Izin (saat bekerja)] Tt',NULL,NULL,'2026-03-28 09:24:11',NULL,1,0),
(25,84,'2026-03-30','2026-03-29 15:47:31','1wt3Dcap5Xg4gRxK8o8H3OSkYyK4BSYtj','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-30 07:59:59',NULL,NULL,'longshift',1,'present','Sesi ditutup otomatis: Lupa Absen Pulang',NULL,NULL,NULL,NULL,4,0),
(28,84,'2026-03-31','2026-03-30 15:59:18','1r5TxShEEAfbkw6ozGUsZx41SH1I_9C9W','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-03-30 22:11:44','1_NArM-p_UDR9i-nWfI0MVuUnExHTrPRH','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-03-31 07:44:10','1f3xzQxVHA9-46ErDitg9XlbesrOeNWSt','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-03-31 08:07:18','1NnfK-WgN2xKBZ28H-NZpar8-ziBRNdl_','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','longshift',1,'present',NULL,NULL,NULL,NULL,NULL,-4,0),
(29,87,'2026-03-31','2026-03-30 23:28:02','1yspk5qNwiXIIKWA1TwTxmK97fF3Bn-Ls','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Shift 3',1,'present',NULL,NULL,NULL,NULL,NULL,-3,0),
(30,86,'2026-03-31','2026-03-31 08:33:51','1oVJ7bg6Ovrs7lb6w0HKuCR06u83Aek2a','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-31 08:33:55',NULL,'Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-31 08:33:58',NULL,'Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-31 08:34:05','1AoFC0LfxmQtb3uuFk8vkVu9gy90C08em','Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','Shift 3',1,'late',NULL,'ttt',NULL,NULL,NULL,-3,0),
(31,88,'2026-03-31','2026-03-31 08:34:50','1riuM_D6QRsHQjDBBUfYjP5KhQmoO3qYe','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-31 08:35:00','1ukt7mlXC0lakPyGEdZ6hi2XoFw22B9CO','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-31 08:35:08','143ougIzz-WdSCFFUPN4H_F-1f15lSTKO','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','2026-03-31 08:35:25','1VS9LdJQJAM3JJgSYM6tMuEBX44d2ykXt','Jalan Kertabumi, Karawang Kulon, Karawang Barat, Karawang, West Java, Java, 41311, Indonesia','Shift 1',1,'late',NULL,'Ttt',NULL,NULL,NULL,-1,0),
(32,84,'2026-04-01','2026-03-31 15:46:08','15PWt0FUAAvnc1VYWjNQSXj4BdYvx0sxl','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-03-31 22:09:21','1z9ndQQ4aQucYloiTNmXwqc_H68huI5N3','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-01 00:43:46','1yfacPvoLYdB-wj7_Tv16yeJLgm-cZtQM','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-01 08:05:48','1XDUMbIuo2V_2_B7bHgZqmXRx63zcKYcq','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','longshift',1,'present',NULL,NULL,NULL,NULL,NULL,-4,0),
(33,84,'2026-04-03','2026-04-02 15:48:35','17VcDTPE_gLPloquSAYE9XnnDa-iwq7Oq','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-03 01:49:57','1x95cyQyPrSri0ixe2bvAV8xvzym0_6O2','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-03 04:06:07','1ahYGOqXD9OgEy5a1aLC9rDgpaoiPAWlz','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-03 09:14:55','1Q0XNIGHkGch0h4ZvBKn2nKC4xLOQFLv8',NULL,'longshift',1,'permission','[Izin (saat bekerja)] Telat absen',NULL,NULL,'2026-04-03 09:14:55',NULL,-4,0),
(34,84,'2026-04-04','2026-04-03 15:37:55','1tjuth9yz2ZrbxXPx-QzuMWvVplDoSUG6','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-03 23:31:11','15UakD2cSaTTxYq2yBORfWuI_YMwqkEkV','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-04 02:05:50','1wIwvfSCjQp1PfPqoRZ_UstWq_tSsCXO-','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-04 08:43:00','1QHAgsT9byJf3wp_4WHqRJkk3cxA6flGV','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','longshift',1,'present',NULL,NULL,NULL,NULL,NULL,-4,0),
(35,91,'2026-04-05','2026-04-04 15:39:01','19pn52rVLlrndha_jWMTIRlrUabTq9g7w','Pancawati, Klari, Karawang, Jawa Barat, Jawa, 41371, Indonesia','2026-04-05 08:00:11','1Stw8dXgcIAPR2VEgZLDtOZ0sGNGSB3a1','Pancawati, Klari, Karawang, Jawa Barat, Jawa, 41371, Indonesia','2026-04-05 08:00:21','1WsVaJdd-GYIDaO4AR8Xe1ZMBa3Yu1URL','Pancawati, Klari, Karawang, Jawa Barat, Jawa, 41371, Indonesia','2026-04-05 08:00:31','1cSN571cj1UzHY2BSemDA2npnyVksYQJV','Pancawati, Klari, Karawang, Jawa Barat, Jawa, 41371, Indonesia','longshift',1,'present',NULL,NULL,NULL,NULL,NULL,-4,0),
(36,90,'2026-04-05','2026-04-04 15:40:02','1JkCDAjCjZz5b8rp5IGWg8J5U2N24vsNb','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-04 22:03:45','1SgvKYlrz3dnCgO9bBatyPG7lMcu1iu2w','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-04 23:02:02','1cguEhEjSigS5bDN27W2A2_IO-yyWQ3O6','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 02:05:14','1o5Y7UK5XttRYWEiUc0VPN9zZfEttKoD0','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','Shift 1',1,'present',NULL,NULL,NULL,NULL,NULL,-1,0),
(37,84,'2026-04-05','2026-04-04 15:47:33','1eZR_GwQuBLIgFO9o8oSdSSZRyVFRqRSS','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 00:22:06','17zOAfKuH5YspZO4lNqtAHMxLuHCcvp3Q','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 02:54:55','1pDb_xBb2ZomSr5pdZqXNfoGPZXADvQqa','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 03:14:16','1D_4iiARamcb-niQJ1aSL0EDoIMKDBlBH',NULL,'longshift',1,'permission','[Izin (saat bekerja)] Test',NULL,NULL,'2026-04-05 03:14:16',NULL,-4,0),
(38,95,'2026-04-05','2026-04-04 15:52:08','1Knj8kmNajcqRdBvXAjkBaUMfEctqCX4g','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-04 22:02:13','1Egp6oTQt9NwLx_vBFIhszBrQY3EV1dWT','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-04 22:54:52','1Sz9CiKycbiunlG7VabfLfm4c8J7xcrl9','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 02:29:12','1Ef8DlNF6oeTtuX0gZ48jqxdR8wxBtlBH','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','Shift 1',1,'present',NULL,NULL,NULL,NULL,NULL,-1,0),
(39,97,'2026-04-05','2026-04-04 16:02:41','1Hf-Uxt1dg8ckeCBzF6P3HaJAYJ5vgbCB','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-04 22:40:20','13MtUDJBaRRBQ2-BLuOG31FOH-185_vXu','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-04 23:38:09','1lYWM-WdvgoDJkV5isG9mgdwCqrCjBlFG','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 02:08:01','1KAJZrmAl6KdWH-8JHoO61A6An5b9LrBg','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','Shift 1',1,'late',NULL,'Brifing harian telat absen',NULL,NULL,NULL,-1,0),
(40,89,'2026-04-05','2026-04-04 16:05:10','1x9G9GvCqs6wzOhi4hBwGdiLyHFJaKcQs','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-04 22:01:19','1eedNyS65DDqq4qRWKghlUsHdsOgv0-Ay','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-04 22:56:46','1mgI3m3o7kZz9iNt0iH_H_HqVmymJqq2e','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 02:03:35','1xDmQmde4P9VQErz0BqDUwnrX5zqrXXYr','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','Shift 1',1,'late',NULL,'Berobat ke puskesmas ','1JIFipvPssygIofKpjL6gz7_1q29dzVix',NULL,NULL,-1,0),
(41,93,'2026-04-05','2026-04-04 21:25:26','1f9BuHif8CWvgRUBMhlEoHznmyDcKrLx2','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 00:33:39','1YUYfmV0AhoADuOjmcavdtaD5xCrAMteW','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 01:30:38','1N6QJ44PKvozY6PmmK8Sif8pOoESNfg-o','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 08:00:41','10bkJJdJ-SzhH_zppcooTzZ2DFCbcitQL','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','Shift 2',1,'late',NULL,'Masuk shift 2','1jdhNF4_2lVuKy6QBjfNVNmoUof0ASVb9',NULL,NULL,-2,0),
(42,96,'2026-04-05','2026-04-04 21:35:16','1IbU1evfICrrGndDz1V4HRb6MULDtOZdO','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 00:34:58','15It1yuS8TgyMqudqQ_29BbL7x3nhege0','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 01:30:18','1H65sjyNfYZLZ6pZ6JWmj9cQ_uOOF0U5d','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 08:00:40','1CSTf0c1bJJZQk0fpqy4aH664xtxf2MP6','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','Shift 2',1,'late',NULL,'Absen masuk shift 2',NULL,NULL,NULL,-2,0),
(43,98,'2026-04-05','2026-04-04 22:12:00','1NaNdTWPL0_6qmemVu8YTS62xGPJpFTId','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 00:35:47','1tEuyHEZZKHqqxr9l0vNk8B4YkjlQEeVy','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 01:32:34','1qKGz1JiPtnnrYnbd3OBQ8FmYQqKakYmm','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 08:21:44','1Hq24QUSyqHX1esjf9EuitepBjffN_qW4','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','Shift 2',1,'late',NULL,'Masuk shift 2','1RkuPd451slTuY9vbO4MIi62-b8fL9jPs',NULL,NULL,-2,0),
(44,99,'2026-04-05','2026-04-04 22:28:41','1UyQE1Uedv2VhAdrYu-Z8YBxZLAqM0hIG','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 00:36:53','1U17na4Krq65fB5SR6t47NsC9RaXzfupv','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 01:35:30','1Ce9TFHdxd3K12G386g4nt9REGItAWe5B','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 08:12:47','1e3-5dTBye94tREeUEzq7ZVvCQQINsTdg','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','Shift 2',1,'late',NULL,'Absen masuk shift 2',NULL,NULL,NULL,-2,0),
(45,92,'2026-04-05','2026-04-04 23:36:21','12wjjXTfJA71kwXEm5K2m3V7nKn31AEdN','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 08:51:36','1se9k373cZSzeXCRs3eL40iE6WoKDK_cY','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 08:51:46','1985hTJz3hruSo3XllNOkclOQORZXNXiX','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 08:51:53','1J3LaF9YpGJU2Wrrf_Bm4KHZ7QvauogdU','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','Shift 3',1,'present',NULL,NULL,NULL,NULL,NULL,-3,0),
(46,100,'2026-04-05','2026-04-05 00:34:19','1A4McBUcKQFTjAN4eGJ1o1gNofVbsUxVD','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 00:34:54','1YyEAlBtMeO5UR1LejdaGFnSut416czOZ','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 01:19:21','1754CM2U03mI0xsoJ5cBq6PpPCp2jeBE0','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 08:00:25','1XNvQbA_AskTN9Lm1YmciP7CrrDFM23Np','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','Shift 2',1,'late',NULL,'Baru bisa masuk aplikasi','1sS5Cme0Rr1XD5btRjaBrI3JzY7Ikhvpo',NULL,NULL,-2,0),
(47,84,'2026-04-05','2026-04-05 03:15:10','1T9WtmtJENkn02NQolCIwLK2DShx3-JEX','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'longshift',2,'present',NULL,NULL,NULL,NULL,NULL,NULL,0),
(48,84,'2026-04-06',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Karyawan',1,'cuti','Cuti Disetujui: Keperluan Keluarga',NULL,NULL,NULL,NULL,NULL,0),
(49,84,'2026-04-07',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Karyawan',1,'cuti','Cuti Disetujui: Keperluan Keluarga',NULL,NULL,NULL,NULL,NULL,0),
(50,84,'2026-04-08',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Karyawan',1,'cuti','Cuti Disetujui: Keperluan Keluarga',NULL,NULL,NULL,NULL,NULL,0),
(51,100,'2026-04-06','2026-04-05 15:14:26','157YK0iRW9yDJc2puAenF4gWM_YL7gXdH','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 22:35:49','1KyR3m8g72jGgM6ltDXZtmeKd3YrgdQ8d','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 23:28:45','1FtBo715LZ5P-MX0YYQA1cZ5668moqRWE','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,'Shift 1',1,'present',NULL,NULL,NULL,NULL,NULL,-1,0),
(52,93,'2026-04-06','2026-04-05 15:29:03','1kYCqcKX2kUrxcNq8_Y-oRvpNPHWkXRkQ','Kedungwaringin, Kab Bekasi, Jawa Barat, Jawa, 17540, Indonesia','2026-04-05 22:36:17','1J2_gDraACs8n7KC-W-5hXilI-0nY1heZ','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 23:33:31','19NxwE4q1G1Dy-HuTaIl5ocqb0slzRTy7','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,'Shift 1',1,'present',NULL,NULL,NULL,NULL,NULL,-1,0),
(53,94,'2026-04-06','2026-04-05 15:37:51','1wf8ehuIRYKshS0Rd31NtcLz-vYhPpj6m','Pancawati, Klari, Karawang, Jawa Barat, Jawa, 41371, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'longshift',1,'present',NULL,NULL,NULL,NULL,NULL,-4,0),
(54,91,'2026-04-06','2026-04-05 15:39:02','1AN2xMdfH4zOcb7rhXr9NZkQzDj9lJJh_','Pancawati, Klari, Karawang, Jawa Barat, Jawa, 41371, Indonesia','2026-04-05 23:03:28','1qAPr_M7SgVTikX5xlUmbJAZ99bfjgGcG','Pancawati, Klari, Karawang, Jawa Barat, Jawa, 41371, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,'longshift',1,'present',NULL,NULL,NULL,NULL,NULL,-4,0),
(55,102,'2026-04-06','2026-04-05 15:43:05','1I_Ln0tP7RVvI8Ijgh4XbVSqZojYvy5Bc','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 21:12:11','1QgIt1KrCD4JcIKohRGMXVoi9sVvRIPXC','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 22:14:14','1OB6rsbgDxR961JHbLxV-aA333KkWy8ZB','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,'Shift 1',1,'present',NULL,NULL,NULL,NULL,NULL,-1,0),
(56,98,'2026-04-06','2026-04-05 15:54:37','1ntkJ2dgzRMsNOm7pkjg4DibbF3iqhDo6','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 22:48:37','1pJjNP65OXoEaXKznC6O7mBux8arUUpeI','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-05 23:42:39','1jsX5wKjvDzNvsat-58AiB9Zzu19M04oZ','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,'Shift 1',1,'present',NULL,NULL,NULL,NULL,NULL,-1,0),
(57,89,'2026-04-06','2026-04-05 17:16:37',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-05 17:16:37',NULL,NULL,NULL,1,'off','[Libur sebelum kerja] Libur Bekerja / Off Day',NULL,NULL,NULL,NULL,NULL,0),
(58,103,'2026-04-06','2026-04-05 18:15:51',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-05 18:15:51',NULL,NULL,NULL,1,'off','[Libur sebelum kerja] Libur Bekerja / Off Day',NULL,NULL,NULL,NULL,NULL,0),
(59,96,'2026-04-06','2026-04-05 18:37:04',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-05 18:37:04',NULL,NULL,NULL,1,'off','[Libur sebelum kerja] Libur Bekerja / Off Day',NULL,NULL,NULL,NULL,NULL,0),
(60,97,'2026-04-06','2026-04-05 19:45:54','1__uNfzo-1q2NoDyqqfzWoKptsoXvOkjx','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Shift 3',1,'present',NULL,NULL,NULL,NULL,NULL,-3,0),
(61,101,'2026-04-06','2026-04-05 21:06:03','1Z8ZYL36F-HLXqIVGsHMr32MjBnIn3fnC','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-06 00:06:56','1rdEtMSE0wUFq9r_0d1Qx5yWpV9A4M4yT','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,'Shift 2',1,'present',NULL,NULL,NULL,NULL,NULL,-2,0),
(62,90,'2026-04-06','2026-04-05 21:28:44','19ndIixvdf4Nc4j7fnA8NrK00c3tmDrcw','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-06 00:07:02','10aSvK7sX13TwTPzrfMFcqy8kcfBjQMs-','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,'Shift 2',1,'present',NULL,NULL,NULL,NULL,NULL,-2,0),
(63,99,'2026-04-06','2026-04-05 21:48:23','1M8p64tTbhV2tmK-aoQa5XKiIEBmvCl6K','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia','2026-04-06 00:05:54','1HsQ5-OaZhrw0UURGl6n34n7ZGdP5nLDO','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,'Shift 2',1,'present',NULL,NULL,NULL,NULL,NULL,-2,0),
(64,95,'2026-04-06','2026-04-05 23:50:28','1_6zn8MR5i7eC6BsErIG7E0GbjQsIlKmJ','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Shift 2',1,'late',NULL,'Maap Bu kasir shift 2 masuk nya jam 15:00',NULL,NULL,NULL,-2,0),
(65,92,'2026-04-06','2026-04-05 23:50:29','1_OWMCUxi1b9D1Uuqn-D7w8FOIVck63PH','Jalan Arief Rahman Hakim, Karawang Kulon, Karawang Barat, Karawang, Jawa Barat, Jawa, 41311, Indonesia',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Shift 3',1,'late',NULL,'Maaf bu untuk kasir shift2 masuknya jam tigaaa 🙏🏻',NULL,NULL,NULL,-3,0);
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_photos`
--

DROP TABLE IF EXISTS `complaint_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) NOT NULL,
  `photo_url` varchar(512) NOT NULL,
  `caption` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_photos`
--

LOCK TABLES `complaint_photos` WRITE;
/*!40000 ALTER TABLE `complaint_photos` DISABLE KEYS */;
INSERT INTO `complaint_photos` VALUES
(1,1,'/uploads/complaint-1773148678189-0-1000525018 (1).jpg','sadasd'),
(2,3,'/uploads/complaint-1773720044046-0-1000533856.jpg','Test'),
(3,4,'/uploads/complaint-1774595283082-0-1000539046.jpg','Test foto'),
(4,5,'/uploads/temp/temp-86-media-1774860743530-upload.jpg','Test');
/*!40000 ALTER TABLE `complaint_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('pending','reviewed','resolved') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_complaints_user_id` (`user_id`),
  KEY `idx_complaints_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
INSERT INTO `complaints` VALUES
(1,76,'sadasd','asdasdad','resolved','2026-03-10 13:17:58'),
(2,76,'test','tttt','resolved','2026-03-13 09:24:29'),
(3,76,'Test','Test','reviewed','2026-03-17 04:00:44'),
(4,80,'Test','Test','resolved','2026-03-27 07:08:03'),
(5,86,'Test','Test','resolved','2026-03-30 08:52:33');
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `selected_dates` text DEFAULT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_leave_request_user_id` (`user_id`),
  KEY `idx_leave_request_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
INSERT INTO `leave_requests` VALUES
(1,80,'2026-03-27','2026-03-28','2026-03-27,2026-03-28','Saudara Menikah ','rejected','2026-03-27 07:07:24'),
(2,80,'2026-03-28','2026-03-31','2026-03-28,2026-03-31','Saudara Menikah ','approved','2026-03-27 08:54:48'),
(3,80,'2026-03-28','2026-04-04','2026-03-28,2026-03-29,2026-03-30,2026-03-31,2026-04-01,2026-04-02,2026-04-03,2026-04-04','Test','approved','2026-03-27 08:55:08'),
(4,86,'2026-03-31','2026-04-02','2026-03-31,2026-04-01,2026-04-02','Cuti bulanan','rejected','2026-03-30 08:51:57'),
(5,84,'2026-03-31','2026-03-31','2026-03-31','Test','cancelled','2026-03-30 14:29:48'),
(6,87,'2026-04-01','2026-04-03','2026-04-01,2026-04-02,2026-04-03','Lebaran','cancelled','2026-03-31 07:28:45'),
(7,84,'2026-04-06','2026-04-08','2026-04-06,2026-04-07,2026-04-08','Keperluan Keluarga','approved','2026-04-01 13:19:06');
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `push_subscriptions`
--

DROP TABLE IF EXISTS `push_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `push_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_push_sub_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `push_subscriptions`
--

LOCK TABLES `push_subscriptions` WRITE;
/*!40000 ALTER TABLE `push_subscriptions` DISABLE KEYS */;
INSERT INTO `push_subscriptions` VALUES
(1,3,'https://fcm.googleapis.com/fcm/send/dNxzGi_dmEU:APA91bFbXC6A3QmSiyYZsqUu4kJrAyrRjlZylqx0ApZIu6CnHAAO6wEhroc2vePwQfqWwvIymklDeKHTsebQ6tfFHh0bUf7SmpmVR8Z2h8m3juSbwbalpI077qpX3fdMUCYvHpRRH1QZ','BHijAkbT20FZDtOWq1BmESs1_U6g1LwcJq0FEv74S2IgLHyN4kZnFtvzoWvDnrzATeLwoygBb2nYHvY4egx_B8I','i8MZQb32lEa6C1x6ufcHzw','2026-03-04 09:55:16'),
(2,3,'https://fcm.googleapis.com/fcm/send/eDn4OWeE4ts:APA91bFgoeQnB9rRd573GnzHKAsOhn042uAYBnI8E1B23Bo2qawheJ3Az9evq3DbTkEMGF3_0okzpGBuUkwC8F1IlObG6dzmbKiZ3LCpmoQdBzfOKsx0PW_n165IDJI0nvdHsnJEsxVQ','BAn4rNDzquXpU7JcnQ11yOnefB6t3OX9gDSHb1mfX8b41ehCQBB12dYwulJOu5i6eR61RFW4ysKh4pxEOyu9Occ','Fu6s0vckVAhNgUKHUN_MdQ','2026-03-06 18:38:48'),
(3,3,'https://fcm.googleapis.com/fcm/send/c7RDzmV8yhs:APA91bEEVNAxbs8KfB7zb85sNTo5AzxFm1ZjHbu-WRwhBu7WlvwTiRGtmQIfQmwqKqPMhdpIo4SeemaNZGhqHrONNaBKx27rNXARnZ8zPhLv9yngNKruQ9QCkPH2vX3dyTIAAKGSbVot','BM2aZhkkbS9asZyNzaSKc4dSv9l0SDNp7D3qNHHfVp1z3GuiiOtF-CgMLaZbrSh45z0dMtWHB7v43ZG8mhp5FWk','-DEAzVZZlocXp7Zwiq6jqg','2026-03-06 18:40:22'),
(4,3,'https://fcm.googleapis.com/fcm/send/c2_YEHZJM4Q:APA91bFxScWlVYErLZTLq9IUK_LHj9fH2A2c2d-y2wRg0MTBmFsiXqgS0ir7pqq73KOeRjo8BVcFrTjAnWbkL5SrS-OCnj_LH7ptXX9EUfsF-RTM7Fi_-3fUEnVYlENPniUOb1u0WHj_','BGLOEooanG4LD5UJxKgr_D5r1P7Y_KZOARPGO5ZPIOzB1wanbRzrHyJ0SDFXXUG8T3rZThdZasKP-DB7w73pE1Q','j_Lyl2Delp_zsMmSkfW1cg','2026-03-09 02:21:49'),
(5,3,'https://fcm.googleapis.com/fcm/send/dXeIzKDzxHo:APA91bECPtKNpaaWn7Ii7VeDx4VkYJahPVkhc3EepvFrN3NfIJXe18iG92hxAWQNrYt3RbpVHwQyFzyZ1p2w8DWH7Z2kxp3E7PPHAdSJf57BmxIm2v13sfLDBfZpuBxLaQlYlVWoU7s5','BPAtL8GHWXNFip4Dn1-S_d5Q86A0EdzkV-tfKkO4rq0KD-LvJFsF8Kucp2l3qb4e6bdIJlFemagmX1lYlNAiKrI','Yrvy1z1vSD8-YbVIqgtdbw','2026-03-09 02:21:49'),
(6,76,'https://fcm.googleapis.com/fcm/send/fle79e8xynw:APA91bH12_pMr2UycwSedOr4vYymNy5gTurb18QtPiGVeFb2hrEXct4fAM2-nKvK-Fe8R4GeCz2FTmjgqzPuNBJPeKBfUZPhX18gGwKOq61f1iwXv9Gybt9NbpDZ52ALmq__GcjBrZrg','BBnBoSNfnBIKHeZyvgn-9JFoUylATijScRFn56OxuOxzeGxcin6YM-s9S6Z-f-grS_tg5ybS7kwNKTgaRoGnSyQ','w4ypO7xyHbnunrEDJ9-awA','2026-03-13 08:51:40'),
(7,76,'https://fcm.googleapis.com/fcm/send/egO6nylaz8w:APA91bFSWRyPrde0tfOxPTtqau8PG-5UwkWe0ZfLUlRpWYTKz5ufTbdLDKYXojnnsM5TOmTdVEgdSsl0L_lK3Ph52uQYNpcJ-3mqChL30S3kVDNAWRFUEXRQziLyPGvphG5_RSHPc3xI','BJlKmsoKiwzazYL0EwKd9KBHrBb_hDkrjVhWkWGffl94lOsJeXU8HfJkjMb9rpwmTX1TQZdev-6wyb7ZC7EbbSA','EGkwUIz_RYNfqSOikuU62Q','2026-03-13 09:24:20'),
(8,76,'https://fcm.googleapis.com/fcm/send/dG2dQe7gzyc:APA91bE3UxaShIEtYXXkH7G2fLnaPWFoxnt4TFaA1aCugP4zgw_C1C5FFAuwQIsRCTC2NiBEpImTFLtchhS1APhWkax2DTd_mJFaGWBVah-k2cOtmwqNCTjbupEe2OLqqhcfUg3AxIKK','BEb5FEGJ65jyZQ9KeyKZptG1OEX00QSRMwGXtCP5STZ4E_NmwpH-8r6vGnZ8y1ygNn2mlOdhw-grrz5A4xAY6p0','brqjc5vHvUQHJwe25FIjZg','2026-03-17 03:56:36'),
(9,77,'https://fcm.googleapis.com/fcm/send/dePFCUZSPdA:APA91bEFuG8mwuIdDpHEjBoibM9zgSSWlh71SRfzovY0U0rdvH542tU_vgPvB9C_ygJnwUEZNqbPHlYiOYZeYquWU-J0ehZpHvtmKS-TSPgctNxUmv_rwa75BpAqh_jF9fqU2qqhMZc9','BILlDIsv8ca10LzN0yPLMbXhiqTEtfyAgRvw7T-BpRxsd1NqbG-o43HsiUY8ZsXe0JicSZduidPVGtHl_rt7iFA','VVMbgZdxRXk8Yrfbe2KUxQ','2026-03-25 07:01:25'),
(10,78,'https://fcm.googleapis.com/fcm/send/elpD5eFDTpY:APA91bEnvCa1M_aX0Ap4KdBjD8OSyE1KSMB5yCy3TV-V5sF8iVTbQgSMTOCecus5Sf2WB-JXJotdC4p9MgUgzFIlPKMiS4m9AZaSKEn0ffOhvbFEzHUooKrhlmmNlPSOhm_Fbt_OkxvD','BFmGhwrR_PE3O2fGJHNZAPZeqbTJYyQeu5Rt90uUWJR3XOm3QEzg-IG9WiAkjELPs4HqdNanbytzyPlzGQUkPtE','tn9Pf3kz_OjF3lKMC653JQ','2026-03-25 09:03:57'),
(11,78,'https://fcm.googleapis.com/fcm/send/e4HX3QqBKDw:APA91bHzzBAAOnvQDH_BwdIDQRvgBm_S0o-AJpsRAAapCFSpbzSkGnvBb5vdTOm02alguNNVw4JwRxEg9-jbrGuEwLBumQeXvrqAmvTRA2o_5bryn48NiDlPtAhRzhu7zDV5SVI8AVAv','BEKU9z6bJoGszL3FKenoUD_nQvKVJ8gwGfSiCY8eLhBAY_bMHh93fwf-xJm670IBkaajKf-Y1Dau0onX7KLVTYY','DsTerpo96kggW0aEEqjsLA','2026-03-25 09:24:14'),
(12,79,'https://fcm.googleapis.com/fcm/send/ebeaOCD2fE4:APA91bENcIea_fg6QBw0nF5EbeDxjY_Zu3ZHlzpVS-IjmfmCG7oD4uCpxOgD7IisQ4TupPhhOcWJgOG-Vc8X0JEE_iMqHIcYtkKHQKazikthvq9ir-oCMjuse5Kirr7qY0CCXc-bONt3','BP3Jn06PlXd9ujDo5shgVtjCxFtqsJwZQtjazNj0gkYCYk2aUjgM8hJFoPEu1GbxPY6yNjRhaTJZaUv-0CLYQ18','bheY2Z5HqlTTXkZK5ZNJ1A','2026-03-26 05:06:57'),
(13,80,'https://fcm.googleapis.com/fcm/send/dzxrJjIjryM:APA91bGu8OtYKcWuUrKVX1d2NREPZDBkiw2BtaoS0iRbbgV1YwB9dph8AzHpCnz9wzXndXisD6wFYAWSXhLshoQhLD-8UgRh7KY4TctTvNaso7uuBWcq_AwwxV0nddFjLFFkDEq0naCe','BDnIxtH_fu_IqsrCkiVBDRpMiWHriusNnG86z4lF1SsFTe9ilh4PjJI4L8wDUH79bvr8Yo0H8c7UXy6c784nM7M','1z5mjVgsunrW9ybIciD2pQ','2026-03-27 06:47:27'),
(14,83,'https://fcm.googleapis.com/fcm/send/eA_FGNofJr8:APA91bGV0ymF-dhzHHUhMRhhIAwcEstlY9gmH4d3sqLte8GsbiTi91Jx2NHdY3uiukkModmi7H_1m3P004eQw5RCuuahw2aG6DsLi_DtGFmuUWA8J7UGaIxlaIrV_ZQHCKzuyAEh0gCp','BEYDt44YRbfZ17Jf6aMhOHEAHNqbf2fR0jC-8kZZYYyZGYQMSuXtuDwI8njboZ4HPZ_FDRHmA0lPlQP3MJfSGfw','BU1USwCT03OdWNRWUixh4g','2026-03-28 10:20:45'),
(15,86,'https://fcm.googleapis.com/fcm/send/dbM_Jsweo6c:APA91bHVdJU1GG2sWGgRfw_3RA50K0qTc4lMbys0JATyT_kIMePDSkmn-978FY0eLSqo_tJckmJXqmQDuT7hx3AeKrCNT5N9fC8H4r0m3xZLWQhHbfpbvrA6i9Zn5M-AOu5KM0en1xRi','BIxOuryxRGVMrmU_Q49ifBlEGyOL3gmOjo8R43nQAPw-gkzM9HQY237hDdj7cSkO8_Psr3lqi2_ZMzbSUS8sc_Q','OAzc1P97CYD-KR3L8h7xjw','2026-03-30 06:21:08'),
(16,86,'https://fcm.googleapis.com/fcm/send/dWn9vC8Z_ck:APA91bERuGBC5r3aNEROuTQ3ikoE7_E96m29MGO9HZF7k9kW_PjBjeyn7WR93eyE8Bo3ctHu8h5tlkc7k58EtuKOxZgPvFaC9irveTbsfMaD8xUtYUWCfAAAlkQpdEE32fGAu5zv4i4I','BGybi9EHlIQyYTYd-BVrlDCMWZvz1TjPbTPwIb5l7st7HTc9PB5s2FiS2FqhJY7Q1IRhqVVyPz30BnpGUPQnmdE','oG0hRlc_e_BvePuLFUQn_A','2026-03-30 08:49:37'),
(17,87,'https://fcm.googleapis.com/fcm/send/d2tMKpxuDYE:APA91bHfVaipIU1n6gqxipcoqy7859yZZOCkz5uuxRmq2qhdZ26ZX-MzRvJ0n9FGhr7aaOqmy7er0ARiuttLZ_yWWjf3_TgAYffB_W0bxqlV0IKNmcIvTMG-CLGIwc7v8noP2Xyb5yRh','BPuV-7xgKyKGhYRcACyI105fo29Gz-v-NrPC8jdxYrrVztBgf_Bw1N0ajGHbhG5tZWlNxb2srbfpSz1m9g7wtfU','55Si96W9NdMLnXoxnhXG0w','2026-03-31 07:27:09'),
(18,90,'https://fcm.googleapis.com/fcm/send/eNtBFqW9sow:APA91bGH9vqEsLexc9ybU62mHcsTltFMN5TgrTqvAsll5MboRXmEEAERWSgeQT_EwvTIaZXDsDSEa31HETyapUjMBRalSBc8lx19GJz68p7vwHNBxaPfnvSmjERG1ox3rN9v92JlXBl6','BBw5J7W9KIM_FkfuXMzKMNnZqHikDfj3b_AtdMkkC2F-I32U5HMmXomqzlDMdMvvBbOiJMztjz64r0Fa3cWo3Tg','qKHF6abwl31ay9fZhnR78g','2026-04-04 23:40:32'),
(19,100,'https://fcm.googleapis.com/fcm/send/fOY92NJRUFA:APA91bFTQxfUMSCjMRewMjDn26k8_am18G-XQyc22OdD9W5i8OSLgGUQ6oH3TcHEmmFFtN42jgJ9nhx71sQ_fh8tiAX0FImYkxIa5kPuKZzuzE_Uxk40cxv7zIZV9F8GEJPtTfor3tSQ','BNg1gP_edmpkxIe5g7lBdIDQixfU4AnGhhE5gtf7tcv8zw6X9VDuRTKJjS3IVxdUox7afebL4jr8Ufm25kZerso','5Pz6SmIAEkFl91y-lcuh8A','2026-04-05 08:28:53'),
(20,103,'https://fcm.googleapis.com/fcm/send/dVYKYraIo28:APA91bFVwUS3FaS2QpyAC6GZBwYotc1jPQJIK4A4ZdO7PeobfJbvE9oNjAtJXeMxXXmBzqhLf-b4jOI0HZiMnrYZY1pF1rG1cw0hTmi-2Q1UnoFc7cDMcfxtTZIL_SjwtByYQvzQAR6F','BLx0t1zt6VHsWoWRQ8FQQL8TInnLONmOM5d0fXEC4MmrU8xkI-Om-2mWuq6hqq9TsWHWp142wqSUHe1ZZpLU5GY','R-Te3htvZShS4R8O7-H9GQ','2026-04-05 16:50:05'),
(21,94,'https://fcm.googleapis.com/fcm/send/d8K4jimnZWE:APA91bHApZ1FCYJK_jpbjx-7KPkiiAkL5LZwmx8ducS_VYAFpBR5Wr1fnMHmaCXUP62boer-IX_S29zkFj6qlIAJSCJWQr9z81UBFOrnL0cl6cWgZ8aAnWRFYdop5ZF_s1rn8BlaeazK','BIBf7ySsBY8ZkIEmIgntyhD8KT3q_AxuQKD74YjX5P051YYDJ-zEvemHEvkUjE4H6sd9AUZBriDbusVtUpbo3LU','Jrdi4u5nCy6s8PGuvvC9PA','2026-04-05 16:50:33');
/*!40000 ALTER TABLE `push_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) NOT NULL,
  `expires` int(11) NOT NULL,
  `data` text DEFAULT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES
('-oaw_bkB86SA0XZrTCiWNFhpe4zume5E',1777185720,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-25T13:35:09.674Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":2}}'),
('0g_eZ6g7RWlI-9dN1at0h-rbWpBeWkL4',1775988315,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-12T09:24:10.589Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":76}}'),
('16O4xGm4nY9r7tWHzkL5WPF_qpxccViY',1777980597,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-28T09:16:21.408Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":84}}'),
('2edDKj_C_aVo37uxkpv3Nmj8TY-lNQCj',1777443259,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-28T02:20:35.891Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":85}}'),
('3boBjqDDjqbbWK_yyqF1QxfjjUImhukW',1777535413,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-30T07:26:20.338Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":87}}'),
('3hIwnuUd2FFOGYJRsMJzdRRY3FPrRsSN',1778021741,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T22:55:40.301Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":104}}'),
('46BpmzrBvpiJKFpI8nuRZ11LIN92IFPi',1778051066,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-04T15:23:41.398Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":91}}'),
('6JI5nHxCPC-0jyOjKNchkIm0ZNral9yC',1778052868,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T05:22:12.397Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":93}}'),
('6ktnRbMtqLA_OP1LWix5HD4_0FjRckZJ',1778048303,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T07:46:30.674Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":102}}'),
('8Wq5bVwmwdWXKdLAvWaVWw4tQNCKYCoG',1777966650,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T07:37:30.419Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"}}'),
('8WVy4KaTYqshYxHcLVtax3vtc23a5aTi',1777993536,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T15:05:35.550Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":2}}'),
('a17rckiseEb1yQIlbLfc66fASOvKKnYA',1775707107,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-03T09:46:53.168Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":2}}'),
('ABJ6wcUK2yKVN8KKphcbPeGe8ijSXRmT',1777473277,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-29T14:26:15.963Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":1}}'),
('A_CBHTNSXOP9E8d2qWlJmmg7QtUYRjyb',1776331155,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-16T03:56:14.548Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":76}}'),
('BcwoRjYKOgbqx7-PYAKD5nLKAANPqpT2',1778053844,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-04T16:46:57.984Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":95}}'),
('BNjW21P4YY_oNNj3rbg4NXrGMx3jthrS',1777532368,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-29T08:49:26.244Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":86}}'),
('C2rH6LPdQdfjatOqpgLkz8OjRxjr0Fex',1777287033,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-27T10:20:15.200Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":83}}'),
('cDAMpzfWdTg8M4YlLFfT0uqfAVKd4c7t',1778030393,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-04T14:16:32.917Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":89}}'),
('cP2qKJaJvCiTt3mhVtJZiqntMmVuam5G',1776911072,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-17T06:47:47.268Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":76}}'),
('csSckczirpWY2SeWHeVvidkWylUva8NR',1777103475,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-25T07:44:04.960Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":1}}'),
('EXJAAHtuHFE9e54xH8LnOMf08y3W8I20',1775497095,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-03T09:55:07.327Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":3}}'),
('G47e_pm8ZDja6tCr_YzESsISK-8Xlbyq',1777967097,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T07:14:20.325Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":100}}'),
('gbWIBRSQ8y1dnhtxqz2zoZ_Keo805jI8',1776333319,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-09T13:15:56.787Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":76}}'),
('gJ60fU-UocJn2hliTswHyIKudQ5VpopP',1777342716,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-27T11:29:23.670Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":83}}'),
('GUwRjNa4NvcyUVFeIdxsWLmV4c-nnKJX',1778053936,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-04T15:10:26.767Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":92}}'),
('HBYR5zf9FqK_NoVcniw2h9q3i_ijjfWe',1775709067,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-08T02:42:47.531Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":76}}'),
('HC-VXisuS_1XNRJwPmWpPXUPnk2nVjRJ',1777265509,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-26T06:46:51.780Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":80}}'),
('hoxLrOSmnBfbWB7H-dSJrvl1yt7HocHs',1775987703,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-12T09:33:32.631Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":2}}'),
('I63OD6Lo5VsrEduwoFj5xuBWechNSTl8',1777698365,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-30T02:04:03.761Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":84}}'),
('J2ON0qUe1DN0j_-oRl_X4whahaukQnqB',1776929353,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-17T07:16:04.427Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":76}}'),
('JJysjYPn6OXGOmvv79-bG97qRi8tmxjL',1777997805,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-01T13:17:40.446Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":1}}'),
('JUYzIOYajgfjMJplzAWSbqkNIW3AslDW',1777517620,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-25T08:25:06.887Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{}}'),
('kBa04w6NFPlzXL8z3juMFViFBIz2lU1e',1777960989,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T03:47:20.178Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":98}}'),
('KbTw6k-i15GBsU2cFWyV-R9rRB4b8KWV',1777993646,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T15:06:07.450Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":1}}'),
('l4Cms3geLI9ugJklFf58nmGxipBXTWhK',1778024278,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T05:13:47.658Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":94}}'),
('Lir-jcj99FZ0fh9yhIdG15V2BFPInHnU',1778052534,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T08:28:43.997Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":100}}'),
('LyU2g6oA12F1wylV3tXeQeUju01x7CHd',1777265839,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-27T04:48:19.825Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":1}}'),
('nlcZwA4Cs1afMxLbiDdb-fyx15y-JuI1',1777958463,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-04T16:28:59.402Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":93}}'),
('nPauhire201o2q-HMG1f7aZ4tmnB6PSe',1778052337,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T07:49:48.214Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":103}}'),
('phzAiWpju8roeBcfD8y8OhNFUdvbOnrv',1777452519,'{\"cookie\":{\"originalMaxAge\":2591999999,\"expires\":\"2026-04-29T06:21:48.434Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":86}}'),
('Px3ExGTCnWqRbRLTDQ-IvIArKDX0tsHm',1778055474,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T10:39:01.083Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":101}}'),
('QH8D1j76CWmg09IK_pZNtpNK6cQqmXEm',1778035029,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-04T16:54:05.596Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":96}}'),
('rFQY3e4H6UX1fZmmMNCMXfqAYKUzcwWe',1778053385,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T06:09:20.275Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":98}}'),
('rtJX1Dmn5IL5WffwlPrG3CKVYjb0E9uX',1778054776,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T06:24:33.288Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":99}}'),
('rzx5fb3NTAw6dHdoVJR3TClmHIbS7plo',1777566947,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-29T08:47:53.847Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":86}}'),
('SO6HB4ybrAnlL2T7rTIq4yyDafDSxtwP',1777993518,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-05T15:05:11.431Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":2}}'),
('tOQrtuwInItOL7I8xH1uurCqPEKlofYg',1777965931,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-27T17:57:10.796Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":84}}'),
('tr7veFWIOsfTajUlXtfRRiI5y7DCg9Ol',1778041752,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-06T04:29:11.717Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"}}'),
('uRbruABWncGyy0gSYHI7xaafnh-JeOIT',1777089807,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-24T08:42:03.426Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":78}}'),
('vlCdmZxrtp-RFnidVBf1U0g40_Sm7nd2',1778043933,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-30T16:36:27.416Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":84}}'),
('vTkDWFJJhe-jJWb207VRclKvAdYT8OSK',1778055459,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-04T14:19:46.440Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":90}}'),
('vwgk_iP2yqYZZGN1t1_nY-RIf4mQzXrE',1775615083,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-08T02:23:03.314Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":3}}'),
('We5gCsOAbzOmVyzK6wUZ7ykOw_KLjJjd',1778039234,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-04T17:03:22.912Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":97}}'),
('xg8Wei6d8oKUGT7vv-7GqIQMTFXR5TI2',1778056245,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-06T05:05:47.688Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":104}}'),
('XkizfNdBhXXG48GSMe-8E7hZAGfM3AZm',1777014841,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-24T07:14:01.300Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":77}}'),
('xoHd9cErcuyaa_fN9mls4d-wtwzvnFk_',1778056577,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-05-06T04:29:20.650Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":2}}'),
('zBAbd4Jz3f3xn7Mn2cImnIGPAWvBy67Y',1775984007,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-12T08:51:26.052Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":76}}'),
('zhyn74H_Y63gMH6Wcrnzs6M4REGUj4G9',1777274690,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-27T07:08:52.917Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":82}}'),
('zlaLeNQBPQCrO99ZTxsVbyX2fddDCo1D',1776912994,'{\"cookie\":{\"originalMaxAge\":2592000000,\"expires\":\"2026-04-17T08:08:16.194Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":76}}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `check_in_time` varchar(255) NOT NULL,
  `check_out_time` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('admin','employee','superadmin') NOT NULL DEFAULT 'employee',
  `nik` varchar(50) DEFAULT NULL,
  `branch` varchar(100) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `shift` varchar(50) DEFAULT NULL,
  `photo_url` varchar(512) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT 0,
  `phone_number` varchar(20) DEFAULT NULL,
  `birth_place` varchar(255) DEFAULT NULL,
  `birth_date` varchar(255) DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `npwp` varchar(255) DEFAULT NULL,
  `bpjs` varchar(255) DEFAULT NULL,
  `bank_account` varchar(255) DEFAULT NULL,
  `ktp_photo_url` text DEFAULT NULL,
  `registration_status` enum('unregistered','pending','approved','rejected') DEFAULT 'unregistered',
  `join_date` varchar(255) DEFAULT NULL,
  `employment_status` varchar(255) DEFAULT NULL,
  `npwp_photo_url` varchar(512) DEFAULT NULL,
  `bpjs_photo_url` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_nik_unique` (`nik`)
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'admin@company.com','admin2@nh.com','8586cacdffd015693ca01fefec203c45a3ba465ce1f6b6dc9f1ce2e5c61799e791e262d33ddfa95fac0a4be97480f1b897faf9c80623d5670ccbc1848bab748d.a8fc483bcacdad17046b4ef0b4998a82','Admin Utama','admin',NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'unregistered',NULL,NULL,NULL,NULL),
(2,'admin@nh.com','admin@nh.com','2aa9d726b7ec5a693f8605ecedd168cf0bbf9a95e74fcf22891822d6fe25469e8dc23fcd9828c81efefffe5059e5ae73ccd3738a4f7494ed51d6516ae2e6dc36.3a344a3b8b968a0ca336bfe8bc3a51ba','Admin','superadmin',NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'unregistered',NULL,NULL,NULL,NULL),
(84,'saefulbahri6627@gmail.com','3216120512990007','c7cfb40c8eb31223375d9452ad6e0c6032f370611a578987ca3218d500df71a84b850aef8b15abdbc3d08db8fc8a115eddc815ae2a6b11144d56fc9cab06f834.7823daf4cdd40899d51790588c31116d','SAEFUL BAHRI','employee','3216120512990007','niaga','assist kepala toko','longshift','/uploads/profile/prof-84-1775387808230-bahri1.jpeg',0,'08881184421','Bekasi','2000-01-13','Laki-laki','Islam','kp. bolang, rt/rw.007/005, des. bantarsari, kec. pebayuran, kab.bekasi','851614065414000','0002135809541',NULL,'https://drive.google.com/file/d/1reLDK2G62ZSF3U6SZIEKgTkBnuq6SARO/view?usp=drivesdk','approved','2025','Kontrak','https://drive.google.com/file/d/1NqjI_uOqSB1lx0s9eo2bYDRFcNxwgn6K/view?usp=drivesdk','https://drive.google.com/file/d/1pGZ9-XeXRz2Ihit9Dxh3hhwwORKq1xCA/view?usp=drivesdk'),
(89,'yulianingrat0428@gmail.com','3215176812040002','a8174e87e9e8e57aaf683cfed3bdb0a186dbaaa646231566bd200ad5621983ce251f463a0579b302edc8854a68bd8987b2b18f0bcea88b155e84f8feb278ac15.236275dce29a24db4fe09ce613829474','Yulia Ningrat ','employee','3215176812040002','Niaga','Pramuniaga ','Shift 1','/uploads/profile/prof-3215176812040002-1775312192908-1000072024.jpg',0,'083893561665','Cilegon','2004-12-28','Perempuan','Islam','Kp.Linggarsari,RT.07/03\r\nKec.Telagasari\r\nKan.Karawang',NULL,NULL,NULL,'https://drive.google.com/file/d/1lWS9L68augUizW2jMevw8PyxXhswrJSn/view?usp=drivesdk','approved','2025','Kontrak',NULL,NULL),
(90,'artamefiaalipah06@gmail.com','3215064206030004','d151f64db12aac13de918e2db03eae938b312e33f83ba2459ea19dbc8d60df09d07156cd66894ffbb79366d30ad98b3ae58ef09c349f8b657e79aa86b5233159.d2a4aeb5e5be29c3b918d755e01025f3','Alipah Artamefia ','employee','3215064206030004','Niaga','Pramuniaga ','Shift 2','/uploads/profile/prof-3215064206030004-1775312381536-IMG_20260404_211145_619~2.jpg',0,'085717419774','Karawang ','2003-06-02','Perempuan','Islam','Dusun Bakanjati Desa karyasari RT 49 RW 21 Kecamatan Rengasdengklok Karawang 41352','427671078408000','-',NULL,'https://drive.google.com/file/d/1xe_yMRHuW_V12Q5JnObrvje5EVAU2MHc/view?usp=drivesdk','approved','2026','Kontrak','https://drive.google.com/file/d/1pDHqJ-8NZckjyb5q8s94W2fkV00Enr3i/view?usp=drivesdk',NULL),
(91,'joyosaputra706@gmail.com','3215132608980002','b7edc5e7f1894b11b99fabfedc17f827f579d93e632b8b47e0b86137043dea5450858e6b9833acbb72b1ac3ac3e5a9a995e4c0e1e5330f69564a8f088747f382.4d62330252018f90006dd2abf07fe661','JOYO','employee','3215132608980002','Cengkong','Pramuniaga','longshift','/uploads/profile/prof-3215132608980002-1775313940052-1000165754.jpg',0,'0859 5473 6107','KARAWANG ','1998-08-26','Laki-laki','Kristen Protestan','Pegadungan , Perum Princes blok b5\r\nKecamatan Purwasari desa Purwasari',NULL,NULL,NULL,'https://drive.google.com/file/d/1JrxFAar9K9GcAJz02xUmwJdz8yNfZuQU/view?usp=drivesdk','approved','2025','Kontrak',NULL,NULL),
(92,'virralaura9@gmail.com','3215014304040006','f38de76aae6c253cac53af7fbdf367cefaabcd5a735e5a4056b7f8efdf643b7ed68b11878cd68cf3f1864eb7b6125a015e1fbc61e6828f6bf743491bd2afa318.b1eb5798029828edd7a32f14b03f9b80','Virra Laura Jamaludin ','employee','3215014304040006','Niaga','Kasir','Shift 3','/uploads/profile/prof-3215014304040006-1775315422915-IMG_20250626_182838.jpg',0,'089530906321','Karawang ','2004-04-03','Perempuan','Islam','Jl. Ali Muchtar, Babakan Sananga. Adiarsa Barat, RT03/RW18. Karawang. Karawang Barat.',NULL,'0001868611781',NULL,'https://drive.google.com/file/d/1dyFhygfuS4KEa3sC839wuDMFVUeiW_yn/view?usp=drivesdk','approved','2025','Kontrak',NULL,'https://drive.google.com/file/d/1kEY4qP5TCLnVLMBqTh70NidSP_IhwWbc/view?usp=drivesdk'),
(93,'putrisindi280102@gmail.com','3215016801020006','35f6c50e4b16c5a6bd1733190df364a7287f546b3565e9965c80e4742c740fed54301cd93dfff4f57d3c2768c42d569d023a10711296e24c1683e062585163d1.0cf83a1b978a58dcadd87d80a09ed8a0','Putri sindi gunawan','employee','3215016801020006','Niaga','PRAMUNIAGA','Shift 1','/uploads/profile/prof-3215016801020006-1775320135715-IMG_20250529_123254_033.webp',0,'081399515960','Bekasi','2002-01-28','Perempuan','Islam','JATI ILIR I RT/RW:002/007 DES. TUNGGAK JATI KEC. KARAWANG BARAT','425933462408000',NULL,NULL,'https://drive.google.com/file/d/1cJk3FxkbNtyKNPIDQosAieL4coWqOeDD/view?usp=drivesdk','approved','2025','Kontrak','https://drive.google.com/file/d/1fdWDjAqxwc19P-wJjFi_fuoxA_nrzmBI/view?usp=drivesdk',NULL),
(94,'ryadhfitrayana56@gmail.com','3215260104930004','a73e039bd84c84b10e2f1b9733ffceed772979ca44b4686b9403286e3db671457053dc52a841a9b038e82ffdb567c27307285f1bdb378ff5791024792d4d3951.2c5434728a6e29cd35155805bbd4de98','Ryadh Fitrayana','employee','3215260104930004','Cengkong ','Pramuniaga ','longshift','/uploads/profile/prof-3215260104930004-1775320169449-IMG20231210102443.jpg',0,'089519012121','Karawang ','1993-04-01','Laki-laki','Islam','Dsn.talun asman ds.talun jaya RT/RW 001/001 kec.banyusari kab. Karawang ','541387734408000',NULL,NULL,'https://drive.google.com/file/d/1Nbty8ZYWSrB74JcyevQ18AwncneCM68m/view?usp=drivesdk','approved',NULL,'Kontrak','https://drive.google.com/file/d/1wVMVtQ4dvXK8cvuUudq4VZ1IW57WQBbc/view?usp=drivesdk',NULL),
(95,'lisahn007@gmail.com','3216125910060005','6b693dc6ffeff0eed6af1dbd1e54726af88ff8c8508bc8d8ec007badeac75d9829be0cf7cc0c3519b631eae6dd77b614da481e0fea665389dc247e8a692f2d0d.9a05eed15416841b418423676446d4aa','Nurholisah ','employee','3216125910060005','Niaga','Kasir ','Shift 2','/uploads/profile/prof-3216125910060005-1775321217980-61466.jpg',0,'0895343273273','Bekasi ','2006-10-19','Perempuan','Islam','Bekasi kp kamurang RT001/RW001 desa karang mekar kecamatan Kedung Waringin ',NULL,NULL,NULL,'https://drive.google.com/file/d/14paUGcYK1EcItXG7lBhICLm29-qH43wG/view?usp=drivesdk','approved','2025','Kontrak',NULL,NULL),
(96,'tutidita905@gmail.com','3215014412050002','f0ea9dfdeeb00ea1541e855a5e822b133661b74cb92803637c9bcffd8ab9488cd05e7b9de4d0aab51a847d76c75755833a8e224478471f17fecca27e6fef44c2.4def70074f4b0c525317a977d5ccbba8','Dita Astuti','employee','3215014412050002','Niaga','Pramuniaga','Shift 2','/uploads/profile/prof-3215014412050002-1775321645586-IMG_20260303_212701.jpg',0,'085863107296','Karawang','2005-12-04','Perempuan','Islam','Pasir Bangkuang RT 001 RW 024, Karangpawitan, Karawang',NULL,NULL,NULL,'https://drive.google.com/file/d/1IRz3BmeOskCDacm1bLYUOl_1Clzmy-if/view?usp=drivesdk','approved','2025','Kontrak',NULL,NULL),
(97,'agustianptrprtm01@gmail.com','3215010108040001','d8a090f024a9709e36937eec5d609a272de2baf02d290e54ae33c19b12d71867c5bcb861058db08c62cc895a76906607444f9727df2bf3f1855a6dd1284f1a62.defce8c4626a35fa16b1052ea8f359bd','AGUSTIAN PUTRA PRATAMA','employee','3215010108040001','Niaga','Pramuniaga','Shift 3','/uploads/profile/prof-3215010108040001-1775322195813-1000541635.jpg',0,'08388427574','Karawang','2004-08-01','Laki-laki','Islam','Gg jamika 2','3215010108040001','32150101080400001',NULL,'https://drive.google.com/file/d/1sgP2Gxsq0jgeHlgSPS8oMDbPsfYOAOkC/view?usp=drivesdk','approved','2026','Kontrak','https://drive.google.com/file/d/10bXONj-_ZJp9MPhaorXeqKUqsprNhBql/view?usp=drivesdk','https://drive.google.com/file/d/17HZA6V-04G8_ENFhNGYi2ZSefQtGaDOu/view?usp=drivesdk'),
(98,NULL,'3215200512970001','9c047d2083263994a74325b2647ea15f52d7bacd3fcaab5121ec56fb6c0abb0e03bbd8258d0e0051e5241459b9bfeaf6c3f02ad89c2263ae13a8d1023a5066c2.dc0ef2e7eb45de4ec888d17a5c671c44','Kusdi hidayat','employee','3215200512970001','Niaga','Pramuniaga','Shift 1','/uploads/profile/prof-3215200512970001-1775360840166-kusdi',0,'085883338826','Karawang','1997-12-05','Laki-laki','Islam','Dusun. Cikuntul barat desa.cikuntul  kec. Tempuran kab\r\n Karawang','Tidak ada','Tidak ada',NULL,'https://drive.google.com/file/d/1vsjfF-65gBJ4w0jWoqA74mZgEj2JbFQD/view?usp=drivesdk','approved','2025','Kontrak',NULL,NULL),
(99,'imbranyudistira903@gmail.com','2315013006960002','1b30597e307ca60af6d9090f86e23cdf25b018071345076786c10b9e7b84c40295e9ccaf747669386f29b5f3591fba8d945433d1f58aad8f526b185ad01cbb11.f41277444e9aa7ddd7c575c30ffa4410','IMBRAN YUDISTIRA','employee','2315013006960002','NIAGA','PRAMUNIAGA','Shift 2','/uploads/profile/prof-2315013006960002-1775370097568-IMBRAN3.jpeg',0,'089530942870','KARAWANG','1996-06-26','Laki-laki','Islam','Gang. JAMIKA 1 RT 013/RW 019 KEL KARAWANG KULON  KEC KARAWANG BARAT','741587737408000','0002797203464',NULL,'https://drive.google.com/file/d/1w6w-yajVu-AFa3YcmLw05i9vY53pRiiZ/view?usp=drivesdk','approved','2026','Kontrak','https://drive.google.com/file/d/1Lrw01l2d9YMSlvWt69u7d8TVKRxdZ_sG/view?usp=drivesdk','https://drive.google.com/file/d/1qjHu5eB_TSab1YJeeI2o3tMjVhZobzUd/view?usp=drivesdk'),
(100,'cristinework21@gmail.com','3215016112980001','c1241db51d59765665f05a3b20a379a30543fe6d78ee24804746c704633317dd301dc4a77ffc4666ecbc13920df6c8dd0dac23152b24b62de14e08d39f185186.92e5e6ed3c08b4f1c03cc53d30d70bb3','Cristine','employee','3215016112980001','Niaga','Pramuniaga','Shift 1','/uploads/profile/prof-3215016112980001-1775373253393-1000000219.jpg',0,'089676711027','Karawang','1998-12-21','Perempuan','Islam','Dusun teluk mungkal pintu rt.3 rw.13 kel.tanjungmekar kec.karawangbarat kab.karawang','80.861.762.5-408.000','0001803471186',NULL,'https://drive.google.com/file/d/10M9E1UYPCyeKx-V-QrRIifQ5sk8COPt9/view?usp=drivesdk','approved','2026','Kontrak','https://drive.google.com/file/d/1AnY6sO-aaz9IEx3tNscwwLY_C8BZVeE2/view?usp=drivesdk','https://drive.google.com/file/d/1gYG8jlxc3Zy69G-7cmiGwIixNJaivphy/view?usp=drivesdk'),
(101,'sathalimah0620@gmail.com','3216136006060004','ec7824758e888854d33ab526b27a5936f96321392dad86d104d63598b56a3217de7ed6c55d2b2b64c0576c67d17b72217eddf7e305c040e492fc15169c3604a2.f7591482f0313b0ec51ead7b859c8c20','SITI HALIMAH','employee','3216136006060004','niaga','pramuniaga','Shift 2','/uploads/profile/prof-3216136006060004-1775373922666-halimah1.jpeg',0,'085814502166','BEKASI','2006-06-20','Perempuan','Islam','kp.leweng gede, rt/rw.003/011, des.bantarjaya, kec. pebayuran, kab.bekasi','214001448414000',NULL,NULL,'https://drive.google.com/file/d/1bBrV-kon_YvGtkwXgm_MbqcibCYkCuUa/view?usp=drivesdk','approved','2026','Kontrak','https://drive.google.com/file/d/1wNlPS2ENBC1YckJ19j3CFJxu7UKFMTnf/view?usp=drivesdk',NULL),
(102,'iwdviya@gmail.com','3175096411020006','c0d6656672efd1ed3d1c95d37fb017d18de1679b0a4699e20374851302c38f5c6ce1f4b4de967c34ddb31351b1b0b6ba574b2e96c95c5fcdc06eda9b320ea0c1.592369f90f690d6f10718cdbc38a9181','Dwi Noviyanti','employee','3175096411020006','Niaga','Kasir','Shift 1','/uploads/profile/prof-3175096411020006-1775374584282-dwi.jpeg',0,'085162942502','Jakarta','2002-11-24','Perempuan','Islam','GG. H. Rafii Sarpin Rt 012 Rw 001 Kel. Rambutan Kec. Ciracas ','531933901009000',NULL,NULL,'https://drive.google.com/file/d/1mZ-MOBtb49VtHabizgMS5Wd3Nn8506NL/view?usp=drivesdk','approved','2025','Kontrak','https://drive.google.com/file/d/1ceXioE4T0zi_um6SKTJ2u9Vv8g9LIwV1/view?usp=drivesdk',NULL),
(103,'sucinovirar@gmail.com','3215 1967 1102 0005','e22fd9066549efda1a6d4739f3bd6c80c5b5bb4632b8c9ab7b3cfed0f3c700a8651b216437dd34018c5db35ff6b2a2ec21fe3b3e0a0196d2bb021e8e821baa97.dc3322818882f2c020e0ed4a8f870403','Suci Novira Ramadhani ','employee','3215 1967 1102 0005','Niaga','Kasir',NULL,'/uploads/profile/prof-3215 1967 1102 0005-1775375381015-1000875620.jpg',0,'081219611497','Karawang ','2002-11-27','Perempuan','Islam','DUSUN KRAJAN III RT RW 018/005 DESA LEMAHABANG KECAMATAN LEMAHABANG ','61.853.125.5-408.000','0002395117607',NULL,'https://drive.google.com/file/d/1fr7T1cBUG1lN-qlh4DQ1v5f6h4X_P8rE/view?usp=drivesdk','approved','2024','Kontrak','https://drive.google.com/file/d/1tsBLUYSESmdzmBd74FIwThooMeHnsvtX/view?usp=drivesdk','https://drive.google.com/file/d/1jToWaY-AhORES8mqy6qMZS_azHXsrk5h/view?usp=drivesdk'),
(104,'nadyaalisyaputriannda18@gmail.com','3215045810060002','609e7b24c85e2ab99556c3e68269c62fea51fe5babd95c95d2ec8a34192cb6a8cd9993b57db15638e715026fc483105f02ca83e54a148a03422b29234d3d0673.0ea4b4f9a67c5c594e93e8781c4ded59','Nadya Alisya Putri Ananda','employee','3215045810060002','EJA FRESH','pramuniaga',NULL,'/uploads/profile/prof-3215045810060002-1775429740294-Photoroom_20241005_092349.jpeg',0,'089671429266','karawang','2006-10-18','Perempuan','Islam','DUSUN II kp sukasari desa kutamekar kec ciampel kab karawang',NULL,NULL,NULL,'https://drive.google.com/file/d/11JNVtqyKs0i17ZmVD330rpdAKdqYo22R/view?usp=drivesdk','approved','2025','Kontrak',NULL,NULL);
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

-- Dump completed on 2026-04-06 16:36:18
