CREATE TABLE `analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sessionId` text NOT NULL,
	`difficulty` text NOT NULL,
	`completed` integer NOT NULL,
	`playTimeMs` integer NOT NULL,
	`moveCount` integer NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `puzzles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`difficulty` text NOT NULL,
	`gridJson` text NOT NULL,
	`gridHash` text NOT NULL,
	`created` integer NOT NULL,
	`completions` integer DEFAULT 0,
	`avgPlayTimeMs` real DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `puzzles_gridHash_unique` ON `puzzles` (`gridHash`);