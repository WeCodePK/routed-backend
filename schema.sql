CREATE TABLE IF NOT EXISTS `admins` (
	`id`			INT				NOT NULL	AUTO_INCREMENT,
	`name`			VARCHAR(255)	NOT NULL,
	`email`			VARCHAR(255)	NOT NULL,
	`hash`			VARCHAR(255)	NOT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `email` (`email`)
);

CREATE TABLE IF NOT EXISTS `drivers` (
	`id`	INT				NOT NULL	AUTO_INCREMENT,
	`name`	VARCHAR(255)	NOT NULL,
	`phone`	VARCHAR(255)	NOT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `phone` (`phone`)
);

CREATE TABLE IF NOT EXISTS `routes` (
	`id`			INT				NOT NULL	AUTO_INCREMENT,
	`name`			VARCHAR(255) 	NOT NULL,
	`points`		JSON			NOT NULL,
	`description`	TEXT			NOT NULL,
	`totalDistance`	DECIMAL(10,2)	NOT NULL,
	`createdAt`		DATETIME		NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `assignments` (
	`id`		INT	NOT NULL	AUTO_INCREMENT,
	`routeId`	INT	NOT NULL,
	`driverId`	INT	NOT NULL,
	PRIMARY KEY (`id`),
	KEY `routeId` (`routeId`),
	KEY `driverId` (`driverId`),
	CONSTRAINT `assignments_fk_1` FOREIGN KEY (`routeId`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
	CONSTRAINT `assignments_fk_2` FOREIGN KEY (`driverId`) REFERENCES `drivers` (`id`) ON DELETE CASCADE
);

INSERT IGNORE INTO `admins` (`name`, `email`, `hash`) VALUES (
	'Demo Admin',
	'demo.admin@example.com',
	'$2a$12$L5J8FmkjVM8FDycN85N6b.6DEwPCiUBLPOmvxIqA6MJ6u9a3rPxRO'
);

INSERT IGNORE INTO `admins` (`name`, `email`, `hash`) VALUES (
	'Abdul Ahad',
	'ahad19n@gmail.com',
	'$2a$12$7a8u1dKuY5dfZmTmrfbQEOkTV3KrWlz.kCQ5bY1qpKzwfSKhdu.j.'
);