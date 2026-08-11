CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`due_at` text,
	`status` text DEFAULT 'not_started' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `assignments_user_course_idx` ON `assignments` (`user_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `course_files` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`file_name` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`search_text` text DEFAULT '' NOT NULL,
	`uploaded_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `course_files_user_course_idx` ON `course_files` (`user_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`term_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`instructor` text,
	`color` text DEFAULT '#36bde8' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `courses_user_term_idx` ON `courses` (`user_id`,`term_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`pronouns` text,
	`timezone` text DEFAULT 'America/Chicago' NOT NULL,
	`dark_mode` integer DEFAULT 0 NOT NULL,
	`high_contrast` integer DEFAULT 0 NOT NULL,
	`reduced_motion` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `terms` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `terms_user_sort_idx` ON `terms` (`user_id`,`sort_order`);