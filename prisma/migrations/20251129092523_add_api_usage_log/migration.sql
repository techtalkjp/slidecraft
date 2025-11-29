-- CreateTable
CREATE TABLE "api_usage_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "cost_usd" REAL NOT NULL,
    "cost_jpy" REAL NOT NULL,
    "exchange_rate" REAL NOT NULL,
    "metadata" TEXT
);

-- CreateIndex
CREATE INDEX "api_usage_log_created_at_idx" ON "api_usage_log"("created_at");

-- CreateIndex
CREATE INDEX "api_usage_log_operation_idx" ON "api_usage_log"("operation");
