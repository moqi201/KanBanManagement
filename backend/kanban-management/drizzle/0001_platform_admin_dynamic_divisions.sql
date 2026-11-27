ALTER TABLE `users` MODIFY COLUMN `division_id` varchar(36);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('platform_admin','division_admin','member') NOT NULL DEFAULT 'member';--> statement-breakpoint
ALTER TABLE `divisions` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_role_division_check` CHECK (
        (
          `users`.`role` = 'platform_admin'
          AND `users`.`division_id` IS NULL
        )
        OR
        (
          `users`.`role` IN ('division_admin', 'member')
          AND `users`.`division_id` IS NOT NULL
        )
      );