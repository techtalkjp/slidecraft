/**
 * API利用ログをサーバーに送信するクライアント側ユーティリティ
 */

export interface ApiUsageLogData {
  operation: 'slide_analysis' | 'image_generation'
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  costJpy: number
  exchangeRate: number
  metadata?: Record<string, unknown>
}

/**
 * API利用ログを記録
 * fire-and-forget で送信し、失敗してもユーザー操作をブロックしない
 */
export function logApiUsage(data: ApiUsageLogData): void {
  fetch('/api/usage-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch((error) => {
    // ログ記録の失敗は静かに無視（ユーザー体験を妨げない）
    console.warn('Failed to log API usage:', error)
  })
}
