-- MySQL dump 10.13  Distrib 8.0.19, for osx10.15 (x86_64)
--
-- Host: localhost    Database: FOLLOWUAH
-- ------------------------------------------------------
-- Server version	8.0.19

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `RATES`
--

DROP TABLE IF EXISTS `RATES`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RATES` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `currency` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `point_date` timestamp NOT NULL,
  `type` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `ask` decimal(12,4) NOT NULL,
  `bid` decimal(12,4) NOT NULL,
  `trend_ask` decimal(12,4) NOT NULL,
  `trend_bid` decimal(12,4) NOT NULL,
  `max_ask` decimal(12,4) NOT NULL,
  `min_bid` decimal(12,4) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_date_type_currency` (`date`,`type`,`currency`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RATES`
--

LOCK TABLES `RATES` WRITE;
/*!40000 ALTER TABLE `RATES` DISABLE KEYS */;
INSERT INTO `RATES` VALUES (1,'2020-04-15','usd','2020-04-15 14:14:32','MB',27.2900,27.2600,-0.0800,-0.0800,27.2900,27.1800),(2,'2020-04-15','eur','2020-04-15 14:31:01','MB',29.6642,29.6316,0.0437,0.0463,29.7079,29.6043),(4,'2020-04-14','usd','2020-04-14 14:16:23','MB',27.2400,27.2000,0.2800,0.2700,27.2400,26.9300),(5,'2020-04-14','eur','2020-04-14 14:15:08','MB',29.8577,29.8139,0.3932,0.3822,29.8577,29.4317),(6,'2020-04-13','usd','2020-04-13 14:31:01','MB',27.0200,26.9800,-0.1500,-0.1400,27.1700,26.9800),(7,'2020-04-13','eur','2020-04-13 14:17:10','MB',29.4761,29.4351,-0.3076,-0.2965,29.7837,29.4351),(8,'2020-04-16','usd','2020-04-16 14:31:01','MB',27.1500,27.1100,0.0500,0.0600,27.2000,27.1100),(9,'2020-04-16','eur','2020-04-16 14:23:41','MB',29.5283,29.4875,0.0734,0.0816,29.6017,29.4875),(10,'2020-04-17','usd','2020-04-17 14:18:32','MB',27.0900,27.0600,0.0150,0.0150,27.1050,27.0600),(11,'2020-04-17','eur','2020-04-17 14:18:43','MB',29.4901,29.4602,-0.0948,-0.0920,29.4901,29.3682);
/*!40000 ALTER TABLE `RATES` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-04-20 22:42:03
