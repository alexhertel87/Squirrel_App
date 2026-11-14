CREATE TABLE `acorn_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`acorn_id` text,
	`event_type` text NOT NULL,
	`reason` text,
	`metadata` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `acorn_events_user_created_idx` ON `acorn_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `body_double_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`share_code` text NOT NULL,
	`task_label` text,
	`share_task_details` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `body_double_sessions_share_code_unique` ON `body_double_sessions` (`share_code`);--> statement-breakpoint
CREATE INDEX `body_double_sessions_user_status_idx` ON `body_double_sessions` (`user_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `daily_calibrations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`local_date` text NOT NULL,
	`energy` text DEFAULT 'medium' NOT NULL,
	`available_minutes` integer DEFAULT 30 NOT NULL,
	`location` text DEFAULT 'anywhere' NOT NULL,
	`immovable_obligation` text,
	`minimum_day` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_calibrations_user_date_idx` ON `daily_calibrations` (`user_id`,`local_date`);--> statement-breakpoint
CREATE TABLE `medication_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`medication_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`logged_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `medication_logs_user_time_idx` ON `medication_logs` (`user_id`,`logged_at`);--> statement-breakpoint
CREATE TABLE `medications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`formulation` text,
	`dose` text NOT NULL,
	`instructions` text,
	`schedule_label` text,
	`refill_due_at` text,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `medications_user_active_idx` ON `medications` (`user_id`,`active`,`updated_at`);--> statement-breakpoint
ALTER TABLE `acorns` ADD `due_at` text;--> statement-breakpoint
ALTER TABLE `acorns` ADD `location` text;--> statement-breakpoint
ALTER TABLE `acorns` ADD `first_step` text;--> statement-breakpoint
ALTER TABLE `acorns` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `acorns` ADD `priority` integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `acorns` ADD `avoid_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `acorns` ADD `last_suggested_at` integer;--> statement-breakpoint
ALTER TABLE `acorns` ADD `completed_at` integer;--> statement-breakpoint
ALTER TABLE `acorns` ADD `delegated_to` text;--> statement-breakpoint
ALTER TABLE `acorns` ADD `context` text DEFAULT 'anywhere' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `density` text DEFAULT 'comfortable' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `text_scale` text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `color_intensity` text DEFAULT 'soft' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `notification_mode` text DEFAULT 'gentle' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `humor_level` text DEFAULT 'full' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `timer_direction` text DEFAULT 'down' NOT NULL;