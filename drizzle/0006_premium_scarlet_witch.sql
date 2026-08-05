CREATE TABLE `lesson_controls` (
	`room_code` text PRIMARY KEY NOT NULL,
	`grade_band` text DEFAULT '1-2' NOT NULL,
	`page` integer DEFAULT 1 NOT NULL,
	`source_slide` integer DEFAULT 1 NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lesson_responses` (
	`player_id` integer NOT NULL,
	`room_code` text NOT NULL,
	`grade_band` text NOT NULL,
	`source_slide` integer NOT NULL,
	`answer` text NOT NULL,
	`is_correct` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_responses_player_slide_unique` ON `lesson_responses` (`player_id`,`source_slide`);--> statement-breakpoint
CREATE INDEX `lesson_responses_room_slide_idx` ON `lesson_responses` (`room_code`,`grade_band`,`source_slide`);