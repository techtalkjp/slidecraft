/**
 * Gemini API コスト計算ユーティリティ
 *
 * 料金体系（Gemini 3 Pro Image - Standard Tier）:
 * - テキスト入力: $2.00/1M tokens (≤200k tokens)
 * - テキスト出力: $12.00/1M tokens
 * - 画像入力: $2.00/1M tokens → 約 $0.0011/image
 * - 画像出力: $120.00/1M tokens
 *   - 1K/2K解像度 (1024-2048px): $0.134/image (1,120 tokens)
 *   - 4K解像度 (up to 4096px): $0.24/image (2,000 tokens)
 *
 * 参考: https://ai.google.dev/gemini-api/docs/pricing
 */

// 現在使用しているモデルの料金（USD）
const MODEL_PRICING = {
  textInputPerMillion: 2.0, // テキスト入力単価 (≤200k tokens)
  textOutputPerMillion: 12.0, // テキスト出力単価
  imageInputPerImage: 0.0011, // 画像入力単価 ($2.00/1M tokens)
  imageOutput1K2K: 0.134, // 1K/2K解像度画像の出力単価 ($120.00/1M tokens, 1,120 tokens/image)
  imageOutput4K: 0.24, // 4K解像度画像の出力単価 ($120.00/1M tokens, 2,000 tokens/image)
}

export interface CostEstimate {
  /** 入力コスト（USD） */
  inputCost: number
  /** 出力コスト（USD） */
  outputCost: number
  /** 合計コスト（USD） */
  totalCost: number
  /** 入力トークン数 */
  inputTokens: number
  /** 出力トークン数 */
  outputTokens: number
}

/**
 * USD/JPY為替レートをキャッシュ（24時間有効）
 */
let exchangeRateCache: {
  rate: number
  timestamp: number
} | null = null

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24時間

/**
 * USD/JPY為替レートを取得（キャッシュ付き）
 */
export async function getExchangeRate(): Promise<number> {
  // キャッシュが有効ならそれを返す
  if (
    exchangeRateCache &&
    Date.now() - exchangeRateCache.timestamp < CACHE_DURATION
  ) {
    return exchangeRateCache.rate
  }

  try {
    // exchangerate-apiの無料エンドポイントを使用
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
    )
    const data = await response.json()
    const rate = data.rates.JPY

    if (typeof rate === 'number' && rate > 0) {
      // キャッシュを更新
      exchangeRateCache = {
        rate,
        timestamp: Date.now(),
      }
      return rate
    }

    // レートが取得できない場合はデフォルト値
    return 150 // 大体の値
  } catch (error) {
    console.error('為替レート取得エラー:', error)
    // エラー時はデフォルト値
    return 150
  }
}

/**
 * プロンプトのトークン数を推定
 * 英語: 約4文字/token、日本語: 約2文字/token
 */
function estimatePromptTokens(prompt: string): number {
  // 簡易的な推定: 日本語多めと仮定して文字数 / 2
  return Math.ceil(prompt.length / 2)
}

/**
 * AI画像生成のコストを計算
 *
 * @param prompt プロンプトテキスト
 * @param imageCount 生成枚数
 * @returns コスト見積もり
 */
export function calculateGenerationCost(
  prompt: string,
  imageCount: number,
): CostEstimate {
  // テキスト入力コスト（プロンプト）
  const promptTokens = estimatePromptTokens(prompt)
  const textInputCost =
    (promptTokens / 1_000_000) * MODEL_PRICING.textInputPerMillion

  // 画像入力コスト（元画像 1枚）
  const imageInputCost = MODEL_PRICING.imageInputPerImage

  // 入力コスト合計
  const inputCost = textInputCost + imageInputCost

  // 画像出力コスト（生成画像 × 枚数、2K解像度を想定）
  const outputCost = MODEL_PRICING.imageOutput1K2K * imageCount

  // 合計コスト
  const totalCost = inputCost + outputCost

  return {
    inputCost,
    outputCost,
    totalCost,
    inputTokens: promptTokens,
    outputTokens: 0, // 画像出力はトークンではなく画像単位で課金
  }
}

/**
 * コストをフォーマット（USD）
 *
 * @param cost コスト（USD）
 * @returns フォーマット済み文字列（例: "$0.0035"）
 */
export function formatCost(cost: number): string {
  if (cost < 0.0001) {
    return '$0.0000'
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  }
  if (cost < 1) {
    return `$${cost.toFixed(3)}`
  }
  return `$${cost.toFixed(2)}`
}

/**
 * コストをフォーマット（JPY）
 *
 * @param cost コスト（USD）
 * @param exchangeRate 為替レート（USD/JPY）
 * @returns フォーマット済み文字列（例: "¥0.5"）
 */
export function formatCostJPY(cost: number, exchangeRate: number): string {
  const jpy = cost * exchangeRate
  if (jpy < 0.1) {
    return `¥${jpy.toFixed(2)}`
  }
  if (jpy < 1) {
    return `¥${jpy.toFixed(1)}`
  }
  return `¥${Math.round(jpy)}`
}

/**
 * コスト見積もりの詳細メッセージを生成（USD）
 */
export function getCostMessage(estimate: CostEstimate): string {
  return `入力: ${formatCost(estimate.inputCost)} / 出力: ${formatCost(estimate.outputCost)} / 合計: ${formatCost(estimate.totalCost)}`
}

/**
 * コスト見積もりの詳細メッセージを生成（JPY）
 */
export function getCostMessageJPY(
  estimate: CostEstimate,
  exchangeRate: number,
): string {
  return `入力: ${formatCostJPY(estimate.inputCost, exchangeRate)} / 出力: ${formatCostJPY(estimate.outputCost, exchangeRate)} / 合計: ${formatCostJPY(estimate.totalCost, exchangeRate)}`
}
