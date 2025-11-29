-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_api_usage_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "operation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "cost_usd" REAL NOT NULL,
    "cost_jpy" REAL NOT NULL,
    "exchange_rate" REAL NOT NULL,
    "metadata" TEXT,
    CONSTRAINT "api_usage_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_api_usage_log" ("cost_jpy", "cost_usd", "created_at", "exchange_rate", "id", "input_tokens", "metadata", "model", "operation", "output_tokens") SELECT "cost_jpy", "cost_usd", "created_at", "exchange_rate", "id", "input_tokens", "metadata", "model", "operation", "output_tokens" FROM "api_usage_log";
DROP TABLE "api_usage_log";
ALTER TABLE "new_api_usage_log" RENAME TO "api_usage_log";
CREATE INDEX "api_usage_log_created_at_idx" ON "api_usage_log"("created_at");
CREATE INDEX "api_usage_log_operation_idx" ON "api_usage_log"("operation");
CREATE INDEX "api_usage_log_user_id_idx" ON "api_usage_log"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
