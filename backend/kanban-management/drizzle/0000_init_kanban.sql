CREATE TABLE `divisions` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `divisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `divisions_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`division_id` varchar(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(191) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('admin','member') NOT NULL DEFAULT 'member',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_id_division_unique` UNIQUE(`id`,`division_id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` varchar(36) NOT NULL,
	`division_id` varchar(36) NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text,
	`status` enum('todo','in_progress','done') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`due_date` date,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tasks_id_division_unique` UNIQUE(`id`,`division_id`)
);
--> statement-breakpoint
CREATE TABLE `task_assignees` (
	`task_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`division_id` varchar(36) NOT NULL,
	`assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `task_assignees_pk` PRIMARY KEY(`task_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` char(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_division_id_divisions_id_fk` FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_division_id_divisions_id_fk` FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_creator_division_fk` FOREIGN KEY (`created_by`,`division_id`) REFERENCES `users`(`id`,`division_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `task_assignees` ADD CONSTRAINT `task_assignees_task_division_fk` FOREIGN KEY (`task_id`,`division_id`) REFERENCES `tasks`(`id`,`division_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `task_assignees` ADD CONSTRAINT `task_assignees_user_division_fk` FOREIGN KEY (`user_id`,`division_id`) REFERENCES `users`(`id`,`division_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `users_division_idx` ON `users` (`division_id`);--> statement-breakpoint
CREATE INDEX `users_division_role_active_idx` ON `users` (`division_id`,`role`,`is_active`);--> statement-breakpoint
CREATE INDEX `tasks_division_status_idx` ON `tasks` (`division_id`,`status`);--> statement-breakpoint
CREATE INDEX `tasks_division_priority_idx` ON `tasks` (`division_id`,`priority`);--> statement-breakpoint
CREATE INDEX `tasks_division_created_at_idx` ON `tasks` (`division_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `tasks_division_creator_idx` ON `tasks` (`division_id`,`created_by`);--> statement-breakpoint
CREATE INDEX `task_assignees_task_division_idx` ON `task_assignees` (`task_id`,`division_id`);--> statement-breakpoint
CREATE INDEX `task_assignees_user_division_idx` ON `task_assignees` (`user_id`,`division_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);