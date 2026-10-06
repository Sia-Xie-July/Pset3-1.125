CREATE TABLE `model_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inputs_json` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "model_settings_check_1" CHECK(id = 1)
);
--> statement-breakpoint
CREATE TABLE `project_audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`action` text NOT NULL,
	`details` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_audit_time` ON `project_audit` (`created_at`);