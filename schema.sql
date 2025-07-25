CREATE TABLE IF NOT EXISTS `admin_profiles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `drivers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'available',
  `email` VARCHAR(255) NOT NULL,
  `contact` VARCHAR(255) NOT NULL,
  `cnic` VARCHAR(255) NOT NULL,
  `passport` VARCHAR(255) NOT NULL,
  `address` TEXT NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `assignedRoutes` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `contact` (`contact`),
  UNIQUE KEY `cnic` (`cnic`),
  UNIQUE KEY `passport` (`passport`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `routes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `points` JSON NOT NULL,
  `description` TEXT NOT NULL,
  `totalDistance` DECIMAL(10,2) NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `assignments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `routeId` INT NOT NULL,
  `driverId` INT NOT NULL,
  `assignmentDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `routeId` (`routeId`),
  KEY `driverId` (`driverId`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`routeId`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`driverId`) REFERENCES `drivers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `tracking` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `driverId` INT NOT NULL,
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `driverId` (`driverId`),
  CONSTRAINT `tracking_ibfk_1` FOREIGN KEY (`driverId`) REFERENCES `drivers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `violations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `driverId` INT NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `driverId` (`driverId`),
  CONSTRAINT `violations_ibfk_1` FOREIGN KEY (`driverId`) REFERENCES `drivers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `userId` INT NOT NULL,
    `token` VARCHAR(255) NOT NULL UNIQUE,
    `expiresAt` DATETIME NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`userId`) REFERENCES `admin_profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `driver_otps` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `driverId` INT NOT NULL,
    `otp` VARCHAR(6) NOT NULL,
    `expiresAt` DATETIME NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `driverId` (`driverId`),
    FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


INSERT IGNORE INTO `admin_profiles` (`name`, `email`, `password_hash`) VALUES
('Admin User', 'admin@example.com', 'hello');

INSERT IGNORE INTO `admin_profiles` (`name`, `email`, `password_hash`) VALUES
('Admin User2', 'admin2@example.com', 'hello');

INSERT IGNORE INTO `admin_profiles` (`name`, `email`, `password_hash`) VALUES
('Admin User4', 'admin4@example.com', '$2b$10$5C20Ea6Y7UFI0SswX02W9e0RyAwfRKDtWk.6dqrkg1gwfkfHCH0je');