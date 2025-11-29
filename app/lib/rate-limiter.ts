/**
 * Upstash Redisを使用したレート制限
 *
 * 環境変数:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST Token
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// 環境変数がない場合はnullを返す（開発環境でのスキップ用）
function createRateLimiter() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    // 開発環境では警告を出さない
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        'Upstash Redis credentials not found. Rate limiting is disabled.',
      )
    }
    return null
  }

  const redis = new Redis({ url, token })

  return new Ratelimit({
    redis,
    // 1分間に30リクエストまで（スライディングウィンドウ）
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:usage-log',
  })
}

const rateLimiter = createRateLimiter()

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * レート制限をチェック
 * @param identifier ユーザーIDまたはIPアドレス
 * @returns レート制限結果（環境変数未設定時は常にsuccess: true）
 */
export async function checkRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  if (!rateLimiter) {
    // レート制限が無効な場合は常に許可
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    }
  }

  const result = await rateLimiter.limit(identifier)
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}
