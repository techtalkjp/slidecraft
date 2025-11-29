import { data } from 'react-router'
import * as z from 'zod'
import { auth } from '~/lib/auth/auth'
import { prisma } from '~/lib/db/prisma'
import { checkRateLimit } from '~/lib/rate-limiter'
import type { Route } from './+types'

// メタデータの最大サイズ（10KB）
const MAX_METADATA_SIZE = 10 * 1024

// 入力スキーマ
const ApiUsageLogSchema = z.object({
  operation: z.enum(['slide_analysis', 'image_generation']),
  model: z.string().min(1).max(100),
  inputTokens: z.number().int().nonnegative().max(10_000_000),
  outputTokens: z.number().int().nonnegative().max(10_000_000),
  costUsd: z.number().nonnegative().max(1000),
  costJpy: z.number().nonnegative().max(150_000),
  exchangeRate: z.number().positive().max(500),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * API利用ログを記録するエンドポイント
 * POST /api/usage-log
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    // セッションからユーザーIDを取得（認証必須）
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) {
      return data({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // レート制限チェック（ユーザーIDベース）
    const rateLimit = await checkRateLimit(`usage-log:${userId}`)
    if (!rateLimit.success) {
      // リセットまでの秒数を計算（最小1秒）
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.reset - Date.now()) / 1000),
      )
      return data(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.reset),
            'Retry-After': String(retryAfterSeconds),
          },
        },
      )
    }

    const body = await request.json()

    // Zodでバリデーション
    const parseResult = ApiUsageLogSchema.safeParse(body)
    if (!parseResult.success) {
      return data({ error: 'Invalid request body' }, { status: 400 })
    }

    const {
      operation,
      model,
      inputTokens,
      outputTokens,
      costUsd,
      costJpy,
      exchangeRate,
      metadata,
    } = parseResult.data

    // メタデータのサイズチェック
    let metadataJson: string | null = null
    if (metadata) {
      metadataJson = JSON.stringify(metadata)
      if (metadataJson.length > MAX_METADATA_SIZE) {
        return data({ error: 'Metadata too large' }, { status: 400 })
      }
    }

    await prisma.apiUsageLog.create({
      data: {
        userId,
        operation,
        model,
        inputTokens,
        outputTokens,
        costUsd,
        costJpy,
        exchangeRate,
        metadata: metadataJson,
      },
    })

    return data({ success: true })
  } catch (error) {
    console.error('Failed to log API usage:', error)
    return data({ error: 'Internal server error' }, { status: 500 })
  }
}
