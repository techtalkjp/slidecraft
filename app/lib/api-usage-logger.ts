/**
 * API利用ログをサーバーに送信するクライアント側ユーティリティ
 *
 * クライアントサイドからGemini APIを呼び出した際のコスト情報を
 * サーバーに記録するためのfire-and-forget型ロガー。
 */

/**
 * API利用ログのデータ構造
 */
export interface ApiUsageLogData {
  /** 操作種別 */
  operation: 'slide_analysis' | 'image_generation'
  /** 使用したモデルID */
  model: string
  /** 入力トークン数 */
  inputTokens: number
  /** 出力トークン数 */
  outputTokens: number
  /** コスト（USD） */
  costUsd: number
  /** コスト（JPY） */
  costJpy: number
  /** 使用した為替レート（USD/JPY） */
  exchangeRate: number
  /** 追加メタデータ（画像サイズ、生成枚数など） */
  metadata?: Record<string, unknown>
}

/**
 * API利用ログをサーバーに送信
 *
 * fire-and-forget パターンで非同期送信し、失敗してもユーザー操作をブロックしない。
 * 送信先: POST /api/usage-log
 *
 * @param data ログデータ
 *
 * @example
 * ```ts
 * logApiUsage({
 *   operation: 'slide_analysis',
 *   model: 'gemini-3-pro-preview',
 *   inputTokens: 5000,
 *   outputTokens: 1000,
 *   costUsd: 0.02,
 *   costJpy: 3.0,
 *   exchangeRate: 150,
 * })
 * ```
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
