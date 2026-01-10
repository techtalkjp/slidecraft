-- User table
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  isAnonymous INTEGER NOT NULL DEFAULT 0,
  UNIQUE (email)
);

-- Session table
CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY NOT NULL,
  expiresAt TEXT NOT NULL,
  token TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL,
  UNIQUE (token),
  FOREIGN KEY (userId) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS session_userId_idx ON "session" (userId);

-- Account table
CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  password TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS account_userId_idx ON "account" (userId);

-- Verification table
CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS verification_identifier_idx ON "verification" (identifier);

-- API Usage Log table
CREATE TABLE IF NOT EXISTS "apiUsageLog" (
  id TEXT PRIMARY KEY NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  userId TEXT,
  operation TEXT NOT NULL,
  model TEXT NOT NULL,
  inputTokens INTEGER NOT NULL,
  outputTokens INTEGER NOT NULL,
  costUsd REAL NOT NULL,
  costJpy REAL NOT NULL,
  exchangeRate REAL NOT NULL,
  metadata TEXT,
  FOREIGN KEY (userId) REFERENCES "user" (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS apiUsageLog_createdAt_idx ON "apiUsageLog" (createdAt);
CREATE INDEX IF NOT EXISTS apiUsageLog_operation_idx ON "apiUsageLog" (operation);
CREATE INDEX IF NOT EXISTS apiUsageLog_userId_idx ON "apiUsageLog" (userId);
