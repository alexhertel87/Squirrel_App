CREATE TABLE `acorns` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`kind` text DEFAULT 'note' NOT NULL,
	`status` text DEFAULT 'loose' NOT NULL,
	`energy` text DEFAULT 'medium' NOT NULL,
	`estimated_minutes` integer DEFAULT 15 NOT NULL,
	`brain_load` text DEFAULT 'some' NOT NULL,
	`source` text DEFAULT 'capture' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `acorns_user_status_idx` ON `acorns` (`user_id`,`status`,`updated_at`);