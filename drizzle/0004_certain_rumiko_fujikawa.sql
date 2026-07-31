CREATE TABLE `classroom_controls` (
	`room_code` text PRIMARY KEY NOT NULL,
	`state` text DEFAULT 'waiting' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `student_presence` (
	`player_id` integer PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `student_presence_room_idx` ON `student_presence` (`room_code`);