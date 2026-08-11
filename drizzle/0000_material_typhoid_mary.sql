CREATE TABLE `google_calendar_connections` (
	`user_id` text PRIMARY KEY NOT NULL,
	`encrypted_tokens` text NOT NULL,
	`encryption_iv` text NOT NULL,
	`granted_scope` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `google_oauth_states` (
	`state` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
