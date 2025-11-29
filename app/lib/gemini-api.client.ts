/**
 * Google Gemini API呼び出しユーティリティ
 *
 * このファイルは .client.ts 拡張子を使用しており、クライアントサイドでのみバンドルされる。
 * Google Gemini APIを直接呼び出して画像生成を行う。
 */

import { GoogleGenAI } from '@google/genai'
import { logApiUsage } from './api-usage-logger'
import { calculateTokenCost, getExchangeRate } from './cost-calculator'

/**
 * Data URLからBase64部分のみを抽出
 */
function getBase64FromDataUrl(dataUrl: string): string {
  return dataUrl.split(',')[1]
}

/**
 * BlobをData URLに変換
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 生成された画像
 */
export interface GeneratedImageData {
  id: string
  dataUrl: string
  prompt: string
  timestamp: number
}

const MODEL_NAME = 'gemini-3-pro-image-preview'

/**
 * スライドのバリエーションを生成
 *
 * @param apiKey Google Gemini APIキー
 * @param originalImage 元画像のBlob
 * @param prompt 生成プロンプト
 * @param count 生成枚数
 * @returns 生成された画像の配列
 */
export async function generateSlideVariations(
  apiKey: string,
  originalImage: Blob,
  prompt: string,
  count: number,
): Promise<GeneratedImageData[]> {
  if (!apiKey) {
    throw new Error('APIキーが設定されていません')
  }

  if (!originalImage) {
    throw new Error('元画像が指定されていません')
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('プロンプトが入力されていません')
  }

  try {
    // 画像をData URLに変換
    const originalImageDataUrl = await blobToDataUrl(originalImage)
    const cleanBase64 = getBase64FromDataUrl(originalImageDataUrl)

    // Gemini APIクライアントを初期化
    const ai = new GoogleGenAI({ apiKey })

    // 各リクエストの結果（画像とトークン数を含む）
    interface RequestResult {
      image: GeneratedImageData | null
      inputTokens: number
      outputTokens: number
    }

    // 複数の画像を並列生成（各リクエストがトークン数を個別に返す）
    const requests = Array.from({ length: count }).map(
      async (_, index): Promise<RequestResult> => {
        try {
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
              parts: [
                {
                  text: `${prompt}. Maintain the general layout and aspect ratio of the original slide if possible, but apply the requested changes creatively. High quality presentation slide.`,
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: cleanBase64,
                  },
                },
              ],
            },
            config: {
              // 16:9のアスペクト比でスライドサイズで生成
              imageConfig: {
                aspectRatio: '16:9',
                imageSize: '2K',
              },
            },
          })

          // 使用量を取得
          const usageMetadata = response.usageMetadata
          const inputTokens = usageMetadata?.promptTokenCount ?? 0
          const outputTokens = usageMetadata?.candidatesTokenCount ?? 0

          // レスポンスから画像を抽出
          const candidates = response.candidates
          if (!candidates || candidates.length === 0) {
            return { image: null, inputTokens, outputTokens }
          }

          const parts = candidates[0]?.content?.parts
          const imagePart = parts?.find((p) => p.inlineData)

          if (imagePart?.inlineData) {
            return {
              image: {
                id: crypto.randomUUID(),
                dataUrl: `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`,
                prompt,
                timestamp: Date.now() + index,
              },
              inputTokens,
              outputTokens,
            }
          }

          return { image: null, inputTokens, outputTokens }
        } catch (error: unknown) {
          console.error(`画像生成エラー (${index + 1}/${count}):`, error)
          return { image: null, inputTokens: 0, outputTokens: 0 }
        }
      },
    )

    const results = await Promise.all(requests)

    // トークン数を集計（並列処理完了後に安全に集計）
    const totalInputTokens = results.reduce((sum, r) => sum + r.inputTokens, 0)
    const totalOutputTokens = results.reduce(
      (sum, r) => sum + r.outputTokens,
      0,
    )

    const validResults = results
      .map((r) => r.image)
      .filter((img): img is GeneratedImageData => img !== null)

    if (validResults.length === 0) {
      throw new Error('画像の生成に失敗しました')
    }

    // API利用ログを記録（fire-and-forget）
    // cost-calculator.ts の統一料金定義を使用
    const costUsd = calculateTokenCost(
      MODEL_NAME,
      totalInputTokens,
      totalOutputTokens,
    )
    const exchangeRate = await getExchangeRate()
    logApiUsage({
      operation: 'image_generation',
      model: MODEL_NAME,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      costUsd,
      costJpy: costUsd * exchangeRate,
      exchangeRate,
      metadata: {
        promptLength: prompt.length,
        requestedCount: count,
        generatedCount: validResults.length,
        originalImageSize: originalImage.size,
      },
    })

    return validResults
  } catch (error) {
    console.error('画像生成エラー:', error)

    if (error instanceof Error) {
      // APIキーエラー
      if (
        error.message.includes('API_KEY_INVALID') ||
        error.message.includes('Requested entity was not found')
      ) {
        throw new Error(
          'APIキーが無効です。設定画面で正しいAPIキーを設定してください。',
        )
      }

      // レート制限エラー
      if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error(
          'APIの利用制限に達しました。しばらく待ってから再度お試しください。',
        )
      }

      // ネットワークエラー
      if (error.message.includes('fetch')) {
        throw new Error(
          'ネットワークエラーが発生しました。インターネット接続を確認してください。',
        )
      }

      throw error
    }

    throw new Error('画像生成中に予期しないエラーが発生しました')
  }
}

/**
 * Data URLをBlobに変換
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}
