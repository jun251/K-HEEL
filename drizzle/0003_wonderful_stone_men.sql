CREATE TABLE `student_access_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code_hash` text NOT NULL,
	`code_hint` text NOT NULL,
	`student_name` text NOT NULL,
	`grade_band` text NOT NULL,
	`room_code` text NOT NULL,
	`player_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_access_codes_hash_unique` ON `student_access_codes` (`code_hash`);--> statement-breakpoint
CREATE INDEX `student_access_codes_room_idx` ON `student_access_codes` (`room_code`);