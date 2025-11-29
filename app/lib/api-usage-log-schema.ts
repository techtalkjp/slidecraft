import * as z from 'zod'

/**
 * メタデータの最大サイズ（10KB）
 */
export const MAX_METADATA_SIZE = 10 * 1024

/**
 * API利用ログの入力スキーマ
 */
export const ApiUsageLogSchema = z.object({
  operation: z.enum(['slide_analysis', 'image_generation']),
  model: z.string().min(1).max(100),
  inputTokens: z.number().int().nonnegative().max(10_000_000),
  outputTokens: z.number().int().nonnegative().max(10_000_000),
  costUsd: z.number().nonnegative().max(1000),
  costJpy: z.number().nonnegative().max(150_000),
  exchangeRate: z.number().positive().max(500),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
