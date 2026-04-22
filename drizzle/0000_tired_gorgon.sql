CREATE TABLE `alert_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`alertRuleId` integer NOT NULL,
	`trackedProductId` integer NOT NULL,
	`platform` text NOT NULL,
	`previousPrice` text NOT NULL,
	`currentPrice` text NOT NULL,
	`changePct` text NOT NULL,
	`direction` text NOT NULL,
	`isRead` integer DEFAULT false NOT NULL,
	`triggeredAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `alert_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trackedProductId` integer NOT NULL,
	`thresholdPct` text DEFAULT '5' NOT NULL,
	`direction` text DEFAULT 'any' NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `margin_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trackedProductId` integer NOT NULL,
	`targetMarginPct` text DEFAULT '30' NOT NULL,
	`minPrice` text,
	`maxPrice` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `margin_rules_trackedProductId_unique` ON `margin_rules` (`trackedProductId`);--> statement-breakpoint
CREATE TABLE `price_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trackedProductId` integer NOT NULL,
	`platform` text NOT NULL,
	`current_price` text NOT NULL,
	`shipping_price` text DEFAULT '0' NOT NULL,
	`landed_price` text NOT NULL,
	`availability` text DEFAULT 'in_stock' NOT NULL,
	`seller_id` text(255),
	`currency` text(8) DEFAULT 'USD' NOT NULL,
	`captured_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tracked_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`platformProductId` text(255) NOT NULL,
	`platform` text NOT NULL,
	`productUrl` text,
	`category` text(128),
	`isOwn` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text(64) NOT NULL,
	`name` text,
	`email` text(320),
	`loginMethod` text(64),
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastSignedIn` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);