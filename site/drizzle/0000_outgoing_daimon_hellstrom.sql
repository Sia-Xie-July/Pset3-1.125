CREATE TABLE `countries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`region` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `countries_name_unique` ON `countries` (`name`);--> statement-breakpoint
CREATE TABLE `design_claims` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`design_id` integer NOT NULL,
	`claim_text` text NOT NULL,
	`claim_type` text NOT NULL,
	`source_id` integer,
	`status` text NOT NULL,
	`notes` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "design_claims_check_1" CHECK(claim_type IN (
            'evidence', 'assumption', 'calculation', 'design_decision', 'unknown'
        )),
	CONSTRAINT "design_claims_check_2" CHECK(status IN ('draft', 'verified', 'proposed', 'calculated', 'unresolved')),
	CONSTRAINT "design_claims_check_3" CHECK(claim_type <> 'evidence' OR source_id IS NOT NULL),
	CONSTRAINT "design_claims_check_4" CHECK(status <> 'verified' OR claim_type = 'evidence')
);
--> statement-breakpoint
CREATE INDEX `idx_claims_design` ON `design_claims` (`design_id`);--> statement-breakpoint
CREATE TABLE `designs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`selected_country_id` integer,
	`it_load_mw` real NOT NULL,
	`pue` real NOT NULL,
	`annual_operating_hours` real NOT NULL,
	`cooling_strategy` text,
	`backup_strategy` text,
	`design_summary` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`selected_country_id`) REFERENCES `countries`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "designs_check_1" CHECK(typeof(it_load_mw) IN ('integer', 'real') AND it_load_mw > 0),
	CONSTRAINT "designs_check_2" CHECK(typeof(pue) IN ('integer', 'real') AND pue >= 1),
	CONSTRAINT "designs_check_3" CHECK(typeof(annual_operating_hours) IN ('integer', 'real')
            AND annual_operating_hours > 0 AND annual_operating_hours <= 8784)
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`country_id` integer NOT NULL,
	`metric_name` text NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`value` real,
	`value_kind` text NOT NULL,
	`unit` text NOT NULL,
	`geographic_scope` text NOT NULL,
	`reporting_period` text,
	`source_timestamp` text,
	`source_timezone` text,
	`source_record_id` text,
	`source_id` integer NOT NULL,
	`retrieved_at` text NOT NULL,
	`confidence` text NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "metrics_check_1" CHECK(value IS NULL OR typeof(value) IN ('integer', 'real')),
	CONSTRAINT "metrics_check_2" CHECK(value_kind IN ('reported', 'estimate', 'forecast', 'calculated')),
	CONSTRAINT "metrics_check_3" CHECK(confidence IN ('high', 'medium', 'low', 'unassessed')),
	CONSTRAINT "metrics_check_4" CHECK(length(trim(notes)) > 0)
);
--> statement-breakpoint
CREATE INDEX `idx_metrics_country_metric` ON `metrics` (`country_id`,`metric_name`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`publisher` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`source_type` text NOT NULL,
	`publication_date` text,
	`accessed_at` text NOT NULL,
	`documentation_url` text,
	`dataset_id` text,
	`endpoint_url` text,
	`auth_type` text DEFAULT 'unknown' NOT NULL,
	`auth_header` text,
	`license` text,
	`verification_status` text DEFAULT 'unverified' NOT NULL,
	`verified_at` text,
	`last_refresh_at` text,
	`last_refresh_status` text DEFAULT 'never' NOT NULL,
	`last_refresh_error` text,
	`notes` text,
	CONSTRAINT "sources_check_1" CHECK(source_type IN ('webpage', 'report', 'dataset', 'api')),
	CONSTRAINT "sources_check_2" CHECK(auth_type IN ('none', 'api_key', 'unknown')),
	CONSTRAINT "sources_check_3" CHECK(verification_status IN ('unverified', 'documented', 'tested', 'needs_key')),
	CONSTRAINT "sources_check_4" CHECK(last_refresh_status IN ('never', 'succeeded', 'failed')),
	CONSTRAINT "sources_check_5" CHECK(auth_type <> 'api_key' OR (auth_header IS NOT NULL AND length(trim(auth_header)) > 0)),
	CONSTRAINT "sources_check_6" CHECK(verification_status <> 'tested' OR (endpoint_url IS NOT NULL AND verified_at IS NOT NULL)),
	CONSTRAINT "sources_check_7" CHECK(last_refresh_status = 'never' OR last_refresh_at IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`authenticated_user_id` text NOT NULL,
	`email` text,
	`team_id` integer,
	`role` text DEFAULT 'viewer' NOT NULL,
	`registered_at` text NOT NULL,
	CONSTRAINT "users_check_1" CHECK(role IN ('viewer', 'editor', 'team_admin'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_authenticated_user_id_unique` ON `users` (`authenticated_user_id`);