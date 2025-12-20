-- Create "user" table
CREATE TABLE `user` (
  `id` text NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `email_verified` integer NOT NULL DEFAULT 0,
  `image` text NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now')),
  `is_anonymous` integer NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);
-- Create index "user_email" to table: "user"
CREATE UNIQUE INDEX `user_email` ON `user` (`email`);
-- Create "session" table
CREATE TABLE `session` (
  `id` text NOT NULL,
  `expires_at` text NOT NULL,
  `token` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now')),
  `ip_address` text NULL,
  `user_agent` text NULL,
  `user_id` text NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `0` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "session_token" to table: "session"
CREATE UNIQUE INDEX `session_token` ON `session` (`token`);
-- Create index "session_user_id_idx" to table: "session"
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);
-- Create "account" table
CREATE TABLE `account` (
  `id` text NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` text NOT NULL,
  `access_token` text NULL,
  `refresh_token` text NULL,
  `id_token` text NULL,
  `access_token_expires_at` text NULL,
  `refresh_token_expires_at` text NULL,
  `scope` text NULL,
  `password` text NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (`id`),
  CONSTRAINT `0` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "account_user_id_idx" to table: "account"
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);
-- Create "verification" table
CREATE TABLE `verification` (
  `id` text NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (`id`)
);
-- Create index "verification_identifier_idx" to table: "verification"
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);
-- Create "api_usage_log" table
CREATE TABLE `api_usage_log` (
  `id` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `user_id` text NULL,
  `operation` text NOT NULL,
  `model` text NOT NULL,
  `input_tokens` integer NOT NULL,
  `output_tokens` integer NOT NULL,
  `cost_usd` real NOT NULL,
  `cost_jpy` real NOT NULL,
  `exchange_rate` real NOT NULL,
  `metadata` text NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `0` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "api_usage_log_created_at_idx" to table: "api_usage_log"
CREATE INDEX `api_usage_log_created_at_idx` ON `api_usage_log` (`created_at`);
-- Create index "api_usage_log_operation_idx" to table: "api_usage_log"
CREATE INDEX `api_usage_log_operation_idx` ON `api_usage_log` (`operation`);
-- Create index "api_usage_log_user_id_idx" to table: "api_usage_log"
CREATE INDEX `api_usage_log_user_id_idx` ON `api_usage_log` (`user_id`);
