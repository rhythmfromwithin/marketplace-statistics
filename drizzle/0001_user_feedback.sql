CREATE TABLE `user_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text(64),
	`email` text(320),
	`category` text DEFAULT 'general' NOT NULL,
	`message` text NOT NULL,
	`createdAt` integer NOT NULL
);
