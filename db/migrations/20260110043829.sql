-- Disable the enforcement of foreign-keys constraints
PRAGMA foreign_keys = off;
-- Create "new_user" table
CREATE TABLE `new_user` (
  `id` text NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `emailVerified` integer NOT NULL DEFAULT 0,
  `image` text NULL,
  `createdAt` text NOT NULL DEFAULT (datetime('now')),
  `updatedAt` text NOT NULL DEFAULT (datetime('now')),
  `isAnonymous` integer NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);
-- Copy rows from old table "user" to new temporary table "new_user"
INSERT INTO `new_user` (`id`, `name`, `email`, `image`) SELECT `id`, `name`, `email`, `image` FROM `user`;
-- Drop "user" table after copying rows
DROP TABLE `user`;
-- Rename temporary table "new_user" to "user"
ALTER TABLE `new_user` RENAME TO `user`;
-- Create index "user_email" to table: "user"
CREATE UNIQUE INDEX `user_email` ON `user` (`email`);
-- Create "new_session" table
CREATE TABLE `new_session` (
  `id` text NOT NULL,
  `expiresAt` text NOT NULL,
  `token` text NOT NULL,
  `createdAt` text NOT NULL DEFAULT (datetime('now')),
  `updatedAt` text NOT NULL DEFAULT (datetime('now')),
  `ipAddress` text NULL,
  `userAgent` text NULL,
  `userId` text NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `0` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Copy rows from old table "session" to new temporary table "new_session"
INSERT INTO `new_session` (`id`, `token`) SELECT `id`, `token` FROM `session`;
-- Drop "session" table after copying rows
DROP TABLE `session`;
-- Rename temporary table "new_session" to "session"
ALTER TABLE `new_session` RENAME TO `session`;
-- Create index "session_token" to table: "session"
CREATE UNIQUE INDEX `session_token` ON `session` (`token`);
-- Create index "session_userId_idx" to table: "session"
CREATE INDEX `session_userId_idx` ON `session` (`userId`);
-- Create "new_account" table
CREATE TABLE `new_account` (
  `id` text NOT NULL,
  `accountId` text NOT NULL,
  `providerId` text NOT NULL,
  `userId` text NOT NULL,
  `accessToken` text NULL,
  `refreshToken` text NULL,
  `idToken` text NULL,
  `accessTokenExpiresAt` text NULL,
  `refreshTokenExpiresAt` text NULL,
  `scope` text NULL,
  `password` text NULL,
  `createdAt` text NOT NULL DEFAULT (datetime('now')),
  `updatedAt` text NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (`id`),
  CONSTRAINT `0` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Copy rows from old table "account" to new temporary table "new_account"
INSERT INTO `new_account` (`id`, `scope`, `password`) SELECT `id`, `scope`, `password` FROM `account`;
-- Drop "account" table after copying rows
DROP TABLE `account`;
-- Rename temporary table "new_account" to "account"
ALTER TABLE `new_account` RENAME TO `account`;
-- Create index "account_userId_idx" to table: "account"
CREATE INDEX `account_userId_idx` ON `account` (`userId`);
-- Create "new_verification" table
CREATE TABLE `new_verification` (
  `id` text NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expiresAt` text NOT NULL,
  `createdAt` text NOT NULL DEFAULT (datetime('now')),
  `updatedAt` text NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (`id`)
);
-- Copy rows from old table "verification" to new temporary table "new_verification"
INSERT INTO `new_verification` (`id`, `identifier`, `value`) SELECT `id`, `identifier`, `value` FROM `verification`;
-- Drop "verification" table after copying rows
DROP TABLE `verification`;
-- Rename temporary table "new_verification" to "verification"
ALTER TABLE `new_verification` RENAME TO `verification`;
-- Create index "verification_identifier_idx" to table: "verification"
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);
-- Drop "api_usage_log" table
DROP TABLE `api_usage_log`;
-- Create "apiUsageLog" table
CREATE TABLE `apiUsageLog` (
  `id` text NOT NULL,
  `createdAt` text NOT NULL DEFAULT (datetime('now')),
  `userId` text NULL,
  `operation` text NOT NULL,
  `model` text NOT NULL,
  `inputTokens` integer NOT NULL,
  `outputTokens` integer NOT NULL,
  `costUsd` real NOT NULL,
  `costJpy` real NOT NULL,
  `exchangeRate` real NOT NULL,
  `metadata` text NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `0` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "apiUsageLog_createdAt_idx" to table: "apiUsageLog"
CREATE INDEX `apiUsageLog_createdAt_idx` ON `apiUsageLog` (`createdAt`);
-- Create index "apiUsageLog_operation_idx" to table: "apiUsageLog"
CREATE INDEX `apiUsageLog_operation_idx` ON `apiUsageLog` (`operation`);
-- Create index "apiUsageLog_userId_idx" to table: "apiUsageLog"
CREATE INDEX `apiUsageLog_userId_idx` ON `apiUsageLog` (`userId`);
-- Enable back the enforcement of foreign-keys constraints
PRAGMA foreign_keys = on;
