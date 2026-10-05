CREATE TABLE `auth_limits` (
	`bucket_key` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL,
	CONSTRAINT "auth_limits_check_1" CHECK(attempts > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_limits_bucket_key_unique` ON `auth_limits` (`bucket_key`);--> statement-breakpoint
CREATE INDEX `idx_auth_limits_expiry` ON `auth_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_hash` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_hash_unique` ON `sessions` (`session_hash`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expiry` ON `sessions` (`expires_at`);--> statement-breakpoint
PRAGMA defer_foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`authenticated_user_id` text NOT NULL,
	`email` text,
	`display_name` text,
	`password_hash` text,
	`team_id` integer,
	`role` text DEFAULT 'viewer' NOT NULL,
	`registered_at` text NOT NULL,
	CONSTRAINT "users_check_1" CHECK(role IN ('viewer', 'editor', 'team_admin')),
	CONSTRAINT "users_check_2" CHECK(password_hash IS NULL OR email IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "authenticated_user_id", "email", "display_name", "password_hash", "team_id", "role", "registered_at") SELECT "id", "authenticated_user_id", "email", NULL, NULL, "team_id", "role", "registered_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA defer_foreign_keys=OFF;--> statement-breakpoint
CREATE UNIQUE INDEX `users_authenticated_user_id_unique` ON `users` (`authenticated_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);