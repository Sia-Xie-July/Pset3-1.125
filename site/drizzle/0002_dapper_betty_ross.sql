CREATE TABLE `adviser_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`tool_calls` integer DEFAULT 0 NOT NULL,
	`error_code` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "adviser_requests_check_1" CHECK(status IN ('pending','succeeded','failed')),
	CONSTRAINT "adviser_requests_check_2" CHECK(input_tokens >= 0),
	CONSTRAINT "adviser_requests_check_3" CHECK(output_tokens >= 0),
	CONSTRAINT "adviser_requests_check_4" CHECK(tool_calls >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_adviser_time` ON `adviser_requests` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_adviser_user_time` ON `adviser_requests` (`user_id`,`created_at`);