import { data } from 'react-router'
import {
  ApiUsageLogSchema,
  MAX_METADATA_SIZE,
} from '~/lib/api-usage-log-schema'
import { auth } from '~/lib/auth/auth'
import { db } from '~/lib/db/kysely'
import { checkRateLimit } from '~/lib/rate-limiter'
import type { Route } from './+types'

/**
 * API利用ログを記録するエンドポイント
 * POST /api/usage-log
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  // エラーログ用のコンテキスト
  let userId: string | undefined
  let operation: string | undefined

  try {
    // セッションからユーザーIDを取得（認証必須）
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) {
      return data({ error: 'Unauthorized' }, { status: 401 })
    }
    userId = session.user.id

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

    const validatedData = parseResult.data
    operation = validatedData.operation

    // メタデータのサイズチェック
    let metadataJson: string | null = null
    if (validatedData.metadata) {
      metadataJson = JSON.stringify(validatedData.metadata)
      if (metadataJson.length > MAX_METADATA_SIZE) {
        return data({ error: 'Metadata too large' }, { status: 400 })
      }
    }

    await db
      .insertInto('apiUsageLog')
      .values({
        id: crypto.randomUUID(),
        userId,
        operation: validatedData.operation,
        model: validatedData.model,
        inputTokens: validatedData.inputTokens,
        outputTokens: validatedData.outputTokens,
        costUsd: validatedData.costUsd,
        costJpy: validatedData.costJpy,
        exchangeRate: validatedData.exchangeRate,
        metadata: metadataJson,
      })
      .execute()

    return data({ success: true })
  } catch (error) {
    console.error('Failed to log API usage:', error, { userId, operation })
    return data({ error: 'Internal server error' }, { status: 500 })
  }
}
