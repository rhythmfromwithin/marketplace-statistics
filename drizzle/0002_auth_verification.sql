ALTER TABLE `users` ADD `phone` text(32);
--> statement-breakpoint
CREATE TABLE `auth_verification_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`targetType` text NOT NULL,
	`targetValue` text(320) NOT NULL,
	`verificationCode` text(16) NOT NULL,
	`purpose` text DEFAULT 'login' NOT NULL,
	`expiresAt` integer NOT NULL,
	`consumedAt` integer,
	`createdAt` integer NOT NULL
);
