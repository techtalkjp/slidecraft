/**
 * PPTX生成ユーティリティ
 *
 * このファイルは .client.ts 拡張子を使用しており、クライアントサイドでのみバンドルされる。
 * PptxGenJSを使用してスライド解析結果からPowerPointファイルを生成する。
 */

import PptxGenJS from 'pptxgenjs'
import type {
  ExtractedGraphic,
  SlideAnalysis,
  TextElement,
} from './slide-analysis'

// スライドサイズ（インチ）- 16:9フォーマット
const SLIDE_WIDTH = 10
const SLIDE_HEIGHT = 5.625

/**
 * パーセンテージをインチに変換
 */
function pctToInches(pct: number, dimension: 'width' | 'height'): number {
  const base = dimension === 'width' ? SLIDE_WIDTH : SLIDE_HEIGHT
  return (pct / 100) * base
}

/**
 * フォントサイズをパーセンテージからptに変換
 *
 * LLMが出力するfontSizeはスライド高さに対するパーセンテージ。
 * これをPPTXスライドの高さ（405pt）に対するptに変換。
 */
function fontSizePctToPt(fontSizePct: number): number {
  // PPTXスライドの高さ（pt）: 5.625インチ * 72pt/インチ = 405pt
  const slideHeightPt = SLIDE_HEIGHT * 72
  return Math.round((fontSizePct / 100) * slideHeightPt)
}

/**
 * フォントスタイルとウェイトに基づいてフォントファミリーを選択
 *
 * フォールバック順:
 * 1. Noto Sans/Serif JP（Windows 2025年4月〜標準搭載、Mac要インストール）
 * 2. 游ゴシック/游明朝（Windows/Mac標準）
 * 3. メイリオ/ヒラギノ（OS標準）
 * 4. Arial（最終フォールバック）
 *
 * 注: PptxGenJSは単一フォント指定のため、優先度最高のNotoを指定
 * PowerPointが未インストールフォントを代替フォントで表示する
 */
function selectFontFace(
  fontStyle: TextElement['fontStyle'],
  fontWeight: TextElement['fontWeight'],
  role: TextElement['role'],
): { fontFace: string; bold: boolean } {
  // ロゴは常にArialを使用（ブランドフォントの代替として）
  if (role === 'logo') {
    return {
      fontFace: 'Arial',
      bold: fontWeight === 'bold' || fontWeight === 'black',
    }
  }

  // Noto フォントを優先使用
  const baseFont = fontStyle === 'serif' ? 'Noto Serif JP' : 'Noto Sans JP'
  const isBold = fontWeight === 'bold' || fontWeight === 'black'

  return { fontFace: baseFont, bold: isBold }
}

/**
 * Data URLからBase64データ部分を抽出
 */
function extractBase64FromDataUrl(dataUrl: string): string {
  const parts = dataUrl.split(',')
  return parts[1] || ''
}

export interface GeneratePptxOptions {
  analysis: SlideAnalysis
  graphics: ExtractedGraphic[]
  fileName?: string
}

export interface GeneratePptxResult {
  blob: Blob
  fileName: string
}

/**
 * スライド解析結果からPPTXを生成
 */
export async function generatePptx(
  options: GeneratePptxOptions,
): Promise<GeneratePptxResult> {
  const {
    analysis,
    graphics,
    fileName = `${analysis.slideTitle || 'slide'}.pptx`,
  } = options

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'
  pptx.title = analysis.slideTitle

  const slide = pptx.addSlide()

  // 背景色を設定
  slide.background = { color: analysis.backgroundColor }

  // グラフィック要素を追加（テキストの下に配置するため先に追加）
  for (const graphic of graphics) {
    const { region, dataUrl } = graphic
    const base64Data = extractBase64FromDataUrl(dataUrl)

    if (base64Data) {
      slide.addImage({
        data: `image/png;base64,${base64Data}`,
        x: pctToInches(region.x, 'width'),
        y: pctToInches(region.y, 'height'),
        w: pctToInches(region.width, 'width'),
        h: pctToInches(region.height, 'height'),
      })
    }
  }

  // テキスト要素を追加
  for (const textEl of analysis.textElements) {
    const fontSize = fontSizePctToPt(textEl.fontSize)

    // フォントを選択（スタイルとウェイトを考慮）
    const { fontFace, bold } = selectFontFace(
      textEl.fontStyle,
      textEl.fontWeight,
      textEl.role,
    )

    slide.addText(textEl.content, {
      x: pctToInches(textEl.x, 'width'),
      y: pctToInches(textEl.y, 'height'),
      w: pctToInches(textEl.width, 'width'),
      h: pctToInches(textEl.height, 'height'),
      fontSize,
      fontFace,
      bold,
      color: textEl.color,
      align: textEl.align,
      valign: 'top',
    })
  }

  // Blobとして出力（ブラウザ環境）
  const blob = (await pptx.write({ outputType: 'blob' })) as Blob

  return {
    blob,
    fileName,
  }
}

/**
 * PPTXをダウンロード
 */
export function downloadPptx(result: GeneratePptxResult): void {
  const url = URL.createObjectURL(result.blob)
  const link = document.createElement('a')
  link.href = url
  link.download = result.fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
