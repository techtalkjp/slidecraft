/**
 * スライド画像解析ユーティリティ
 *
 * このファイルは .client.ts 拡張子を使用しており、クライアントサイドでのみバンドルされる。
 * Google Gemini APIを直接呼び出してスライド画像を解析し、構造化データを抽出する。
 */

import { GoogleGenAI, PartMediaResolutionLevel } from '@google/genai'
import * as z from 'zod'
import { logApiUsage } from './api-usage-logger'
import { calculateTokenCost, getExchangeRate } from './cost-calculator'
import { SlideAnalysisSchema, type SlideAnalysis } from './slide-analysis'

// 利用可能なモデル
export const ANALYSIS_MODELS = {
  'gemini-3-pro-preview': {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    estimatedCostJpy: 6, // 概算コスト（円、実際はトークン数で変動）
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    estimatedCostJpy: 1.5, // 概算コスト（円、実際はトークン数で変動）
  },
} as const

export type AnalysisModelId = keyof typeof ANALYSIS_MODELS

export const DEFAULT_MODEL: AnalysisModelId = 'gemini-3-pro-preview'

/**
 * トークン数からコストを計算（USD）
 * cost-calculator.ts の統一料金定義を使用
 */
export function calculateCost(
  model: AnalysisModelId,
  inputTokens: number,
  outputTokens: number,
): number {
  return calculateTokenCost(model, inputTokens, outputTokens)
}

/**
 * 使用量情報
 */
export interface UsageInfo {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number // USD
  costJpy: number // 円換算
}

// システムプロンプト（XMLタグ構造化、Gemini 3 Pro向けに最適化）
const SYSTEM_PROMPT = `<role>
スライド画像を解析し、pptxgenjs用のJSON構造に変換する専門家です。
</role>

<elements>
1. textElements: すべてのテキスト要素
   - 位置(x,y)、サイズ(width,height)は画像全体に対する0-100%で指定
   - fontSizeはスライド高さに対する%（例：高さの8%を占めるテキストなら8）
   - fontStyle: serif（明朝体）またはsans-serif（ゴシック体）
     * serif: 文字の端に小さな装飾がある。縦線が太く横線が細い
     * sans-serif: 文字の端に装飾がない。線の太さが均一
   - fontWeight: light/normal/medium/bold/black（スライド内で相対的に判断）
     * light: 非常に細い線
     * normal: 標準的な太さ。本文やフッターに多い
     * medium: やや太め
     * bold: 太い。サブタイトルや強調テキストに使用
     * black: 極太。メインタイトルで使用されることが多い
   - role: title/subtitle/body/footer/logo
   - indentLevel: 箇条書きの階層（0=親項目、1=子項目、2=孫項目）。インデントされた項目には必ず指定

2. shapeElements: 単純な図形（PPTXネイティブ図形として再現）
   - type: rect, roundRect, ellipse, triangle, line, arrow, rightArrow, leftArrow, upArrow, downArrow
   - 図形内にテキストがある場合はtext, textColor, fontSizeを指定
   - fontSizeの目安：シェイプのheightの50-70%

3. tableElements: 表形式のデータ
   - rowsJson: セルデータのJSON文字列（例: [[{"text":"A1"},{"text":"B1"}],[{"text":"A2"},{"text":"B2"}]]）
   - rowHeights: 各行の高さ（レイアウト用途のテーブルでは必須）
   - fillColor: "transparent"でセル背景を透過

4. graphicRegions: シェイプやテーブルで再現できない要素のみ
   - 写真、イラスト、複雑なチャート、アイコン
   - テキストと重複しない領域のみ

5. backgroundColor: スライドの背景色（hex形式、#なし）
</elements>

<constraints>
- 各要素は1つのカテゴリにのみ含める（重複禁止）
- graphicRegionの範囲内にテキストを含めない
- テキストと重なる背景グラフィックは分割するか省略してテキストを優先
- テキストボックスのwidthは実際の幅より10-15%余裕を持たせる
- グラフィカルなロゴ→graphicRegions、テキストのみのロゴ→textElements(role="logo")
</constraints>

<verification>
出力前に確認：
1. すべてのテキストを抽出したか
2. 座標とサイズは0-100%の範囲内か
3. graphicRegionがテキストと重複していないか
4. 同じ要素を複数カテゴリに含めていないか
</verification>`

// 構造化出力用のJSONスキーマ
const slideAnalysisJsonSchema = z.toJSONSchema(SlideAnalysisSchema)

/**
 * BlobをBase64文字列に変換
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      // data:image/png;base64, の部分を除去してBase64部分のみ取得
      const parts = dataUrl.split(',')
      if (parts.length !== 2 || !parts[1]) {
        reject(new Error('無効なData URL形式です'))
        return
      }
      resolve(parts[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * JSONレスポンスからSlideAnalysisをパース
 */
export function parseJsonResponse(text: string): SlideAnalysis {
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
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    throw new Error(
      `JSONパースエラー: ${e instanceof Error ? e.message : '不明なエラー'}`,
    )
  }

  // Zodでバリデーション
  try {
    return SlideAnalysisSchema.parse(parsed)
  } catch (e) {
    throw new Error(
      `スキーマバリデーションエラー: ${e instanceof Error ? e.message : '不明なエラー'}`,
    )
  }
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

      // Gemini APIクライアントを初期化（v1alpha APIでmediaResolutionを有効化）
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { apiVersion: 'v1alpha' },
      })

      // API呼び出し（構造化出力を使用、画像を先に配置）
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: imageBlob.type || 'image/png',
                data: base64Image,
              },
              mediaResolution: {
                level: PartMediaResolutionLevel.MEDIA_RESOLUTION_HIGH,
              },
            },
            {
              text: SYSTEM_PROMPT,
            },
          ],
        },
        config: {
          abortSignal: signal,
          responseMimeType: 'application/json',
          responseJsonSchema: slideAnalysisJsonSchema,
        },
      })

      // キャンセルチェック
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      // レスポンスからテキストを抽出
      const responseText = response.text
      if (!responseText) {
        throw new Error('解析結果が取得できませんでした')
      }

      // 構造化出力なのでJSONは構文的に正しいことが保証されている
      // Zodでバリデーション（値の意味的な検証）
      const analysis = SlideAnalysisSchema.parse(JSON.parse(responseText))

      // 使用量情報を取得
      const usageMetadata = response.usageMetadata
      const inputTokens = usageMetadata?.promptTokenCount ?? 0
      const outputTokens = usageMetadata?.candidatesTokenCount ?? 0
      const totalTokens = usageMetadata?.totalTokenCount ?? 0
      const cost = calculateCost(model, inputTokens, outputTokens)
      const exchangeRate = await getExchangeRate()
      const costJpy = cost * exchangeRate

      // API利用ログを記録（fire-and-forget）
      const roleBreakdown = analysis.textElements.reduce(
        (acc, el) => {
          acc[el.role] = (acc[el.role] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )
      logApiUsage({
        operation: 'slide_analysis',
        model,
        inputTokens,
        outputTokens,
        costUsd: cost,
        costJpy,
        exchangeRate,
        metadata: {
          imageSize: imageBlob.size,
          textElementCount: analysis.textElements.length,
          graphicRegionCount: analysis.graphicRegions.length,
          roleBreakdown,
        },
      })

      return {
        analysis,
        model,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          cost,
          costJpy,
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
