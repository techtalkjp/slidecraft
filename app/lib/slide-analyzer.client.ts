/**
 * スライド画像解析ユーティリティ
 *
 * このファイルは .client.ts 拡張子を使用しており、クライアントサイドでのみバンドルされる。
 * Google Gemini APIを直接呼び出してスライド画像を解析し、構造化データを抽出する。
 */

import { GoogleGenAI } from '@google/genai'
import { SlideAnalysisSchema, type SlideAnalysis } from './slide-analysis'

// 為替レート（USD → JPY）
const USD_TO_JPY = 150

// モデルごとの料金（per million tokens, USD）
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
  'gemini-3-pro-preview': { input: 2, output: 12 },
}

/**
 * USDを円に変換
 */
export function usdToJpy(usd: number): number {
  return usd * USD_TO_JPY
}

// 利用可能なモデル
export const ANALYSIS_MODELS = {
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    estimatedCostJpy: 0.5, // 概算コスト（円、実際はトークン数で変動）
  },
  'gemini-3-pro-preview': {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    estimatedCostJpy: 3, // 概算コスト（円、実際はトークン数で変動）
  },
} as const

export type AnalysisModelId = keyof typeof ANALYSIS_MODELS

export const DEFAULT_MODEL: AnalysisModelId = 'gemini-2.5-flash'

/**
 * トークン数からコストを計算（USD）
 */
export function calculateCost(
  model: AnalysisModelId,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model] ?? { input: 0.15, output: 0.6 }
  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output
  return inputCost + outputCost
}

/**
 * 使用量情報
 */
export interface UsageInfo {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number // USD
}

// システムプロンプト（slide-extractorから移植）
const SYSTEM_PROMPT = `あなたはスライド画像を解析して、編集可能なPowerPointに変換するためのデータを抽出する専門家です。

画像を分析し、以下の情報を正確に抽出してください：

1. テキスト要素
   - 画像内のすべてのテキストを識別
   - 各テキストの位置（x, y）、サイズ（width, height）を画像全体に対するパーセンテージで推定
   - フォントサイズは**スライド高さに対するパーセンテージ**で推定（例：高さの10%を占めるテキストなら fontSize: 10）
   - 色、配置を推定
   - フォントスタイルを判別：
     * serif（明朝体）: 文字の端に小さな装飾（セリフ）がある。縦線が太く横線が細い。伝統的・フォーマルな印象
     * sans-serif（ゴシック体）: 文字の端に装飾がない。線の太さが均一。モダン・カジュアルな印象
   - フォントの太さ（fontWeight）を判別（同じスライド内の他のテキストと比較して相対的に判断）：
     * light: 非常に細い線。繊細で軽やかな印象
     * normal: 標準的な太さ。本文やフッターに多い
     * medium: やや太め。normalとboldの中間
     * bold: 太い。サブタイトルや強調テキストに使用
     * black: 極太。メインタイトルで使用されることが多い。文字の画（ストローク）が非常に太く、文字の内側の空間が狭く見える。スライド内で最も太いテキストはblackの可能性が高い
   - テキストの役割（タイトル、サブタイトル、本文、フッター、ロゴ）を分類

2. グラフィック領域
   - イラスト、図形、チャート、写真などの非テキスト要素を識別
   - それぞれの位置とサイズをパーセンテージで指定
   - テキストが重なっていない純粋なグラフィック領域を特定

【重要】ロゴの扱い：
- ロゴは「テキスト要素」か「グラフィック領域」の**どちらか一方のみ**に含めてください（両方に入れない）
- グラフィカルなロゴ（アイコン、装飾、ストライプ模様など視覚的デザインがあるもの）→ graphicRegions に含める
- プレーンテキストのロゴ（単純な文字のみ）→ textElements に role="logo" として含める
- 例：IBMの横縞ロゴ → graphicRegions、"NotebookLM" の文字 → textElements

3. 背景色
   - スライドの主要な背景色を抽出

【重要】テキストボックスのサイズ指定について：
- テキストが1文字でも溢れて改行されないよう、widthは実際のテキスト幅より10-15%程度余裕を持たせてください
- 特に日本語テキストは文字幅の推定が難しいため、余裕を持った幅を指定してください
- heightも同様に、フォントサイズに対して十分な高さを確保してください

位置とサイズの指定では、テキストがグラフィックと重ならないよう注意してください。
グラフィック領域は、後で画像として切り出すため、テキストを含まない領域を指定してください。

【出力形式】
必ず以下のJSON形式で出力してください。説明文は含めず、JSONのみを返してください。

{
  "backgroundColor": "FFFFFF",
  "textElements": [
    {
      "content": "テキスト内容",
      "x": 10,
      "y": 5,
      "width": 80,
      "height": 15,
      "fontSize": 8,
      "fontWeight": "bold",
      "fontStyle": "sans-serif",
      "color": "333333",
      "align": "center",
      "role": "title"
    }
  ],
  "graphicRegions": [
    {
      "description": "グラフィックの説明",
      "x": 20,
      "y": 30,
      "width": 60,
      "height": 50
    }
  ],
  "slideTitle": "スライドタイトル"
}`

/**
 * BlobをBase64文字列に変換
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      // data:image/png;base64, の部分を除去してBase64部分のみ取得
      const base64 = dataUrl.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * JSONレスポンスからSlideAnalysisをパース
 */
function parseJsonResponse(text: string): SlideAnalysis {
  // JSONブロックを抽出（```json ... ``` または { ... }）
  let jsonStr = text.trim()

  // ```json で囲まれている場合は抽出
  const jsonBlockMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonBlockMatch) {
    jsonStr = jsonBlockMatch[1]
  } else {
    // { で始まって } で終わる部分を抽出
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }
  }

  // JSONパース
  const parsed = JSON.parse(jsonStr)

  // Zodでバリデーション
  return SlideAnalysisSchema.parse(parsed)
}

export interface AnalyzeSlideOptions {
  apiKey: string
  imageBlob: Blob
  model?: AnalysisModelId
  signal?: AbortSignal
}

export interface AnalyzeSlideResult {
  analysis: SlideAnalysis
  model: AnalysisModelId
  usage: UsageInfo
}

/**
 * スライド画像を解析して構造化データを抽出
 *
 * @param options 解析オプション
 * @returns 解析結果
 */
export async function analyzeSlide(
  options: AnalyzeSlideOptions,
): Promise<AnalyzeSlideResult> {
  const { apiKey, imageBlob, model = DEFAULT_MODEL, signal } = options

  if (!apiKey) {
    throw new Error('APIキーが設定されていません')
  }

  if (!imageBlob) {
    throw new Error('画像が指定されていません')
  }

  // 最大リトライ回数
  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // キャンセルチェック
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    try {
      // 画像をBase64に変換
      const base64Image = await blobToBase64(imageBlob)

      // Gemini APIクライアントを初期化
      const ai = new GoogleGenAI({ apiKey })

      // API呼び出し
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              text: SYSTEM_PROMPT,
            },
            {
              inlineData: {
                mimeType: imageBlob.type || 'image/png',
                data: base64Image,
              },
            },
          ],
        },
      })

      // キャンセルチェック
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      // レスポンスからテキストを抽出
      const candidates = response.candidates
      if (!candidates || candidates.length === 0) {
        throw new Error('解析結果が取得できませんでした')
      }

      const parts = candidates[0]?.content?.parts
      const textPart = parts?.find((p) => p.text)

      if (!textPart?.text) {
        throw new Error('解析結果のテキストが取得できませんでした')
      }

      // JSONパースとバリデーション
      const analysis = parseJsonResponse(textPart.text)

      // 使用量情報を取得
      const usageMetadata = response.usageMetadata
      const inputTokens = usageMetadata?.promptTokenCount ?? 0
      const outputTokens = usageMetadata?.candidatesTokenCount ?? 0
      const totalTokens = usageMetadata?.totalTokenCount ?? 0
      const cost = calculateCost(model, inputTokens, outputTokens)

      return {
        analysis,
        model,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          cost,
        },
      }
    } catch (error) {
      // AbortErrorはリトライしない
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }

      lastError = error instanceof Error ? error : new Error(String(error))

      // 最後のリトライでなければ続行
      if (attempt < maxRetries) {
        console.warn(
          `解析リトライ (${attempt + 1}/${maxRetries}):`,
          lastError.message,
        )
      }
    }
  }

  // すべてのリトライが失敗
  if (lastError) {
    // エラーメッセージを整形
    if (
      lastError.message.includes('API_KEY_INVALID') ||
      lastError.message.includes('Requested entity was not found')
    ) {
      throw new Error(
        'APIキーが無効です。設定画面で正しいAPIキーを設定してください。',
      )
    }

    if (lastError.message.includes('RATE_LIMIT_EXCEEDED')) {
      throw new Error(
        'APIの利用制限に達しました。しばらく待ってから再度お試しください。',
      )
    }

    if (lastError.message.includes('fetch')) {
      throw new Error(
        'ネットワークエラーが発生しました。インターネット接続を確認してください。',
      )
    }

    throw lastError
  }

  throw new Error('解析に失敗しました')
}
