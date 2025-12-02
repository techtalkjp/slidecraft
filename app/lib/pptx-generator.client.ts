/**
 * PPTX生成ユーティリティ
 *
 * このファイルは .client.ts 拡張子を使用しており、クライアントサイドでのみバンドルされる。
 * PptxGenJSを使用してスライド解析結果からPowerPointファイルを生成する。
 */

import PptxGenJS from 'pptxgenjs'
import { blobToDataUrl } from './graphic-extractor.client'
import type {
  ExtractedGraphic,
  ShapeElement,
  SlideAnalysis,
  TableCell,
  TableElement,
  TextElement,
} from './slide-analysis'

// スライドサイズ（インチ）- 16:9フォーマット
const SLIDE_WIDTH = 10
const SLIDE_HEIGHT = 5.625

// インデント1レベルあたりのオフセット（%）- PowerPointの標準箇条書きインデントに相当
const INDENT_OFFSET_PCT = 3

// シェイプ内テキストのデフォルトサイズ比率 - シェイプ高さに対する割合（視認性と余白のバランス）
const DEFAULT_SHAPE_TEXT_SIZE_RATIO = 0.6

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
 *
 * 構造化出力により精度が向上したため、補正係数は1.0（補正なし）。
 */
function fontSizePctToPt(fontSizePct: number): number {
  // PPTXスライドの高さ（pt）: 5.625インチ * 72pt/インチ = 405pt
  const slideHeightPt = SLIDE_HEIGHT * 72
  const scaleFactor = 1.2 // 補正なし（構造化出力により精度向上）
  return Math.round((fontSizePct / 100) * slideHeightPt * scaleFactor)
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
 * シェイプタイプをPptxGenJSのShapeTypeにマッピング
 */
function getShapeType(
  pptx: PptxGenJS,
  type: ShapeElement['type'],
): PptxGenJS.ShapeType {
  const shapeMap: Record<ShapeElement['type'], keyof typeof pptx.ShapeType> = {
    rect: 'rect',
    roundRect: 'roundRect',
    ellipse: 'ellipse',
    triangle: 'triangle',
    line: 'line',
    arrow: 'line', // 矢印線はlineにbeginArrowType/endArrowTypeを付ける
    rightArrow: 'rightArrow',
    leftArrow: 'leftArrow',
    upArrow: 'upArrow',
    downArrow: 'downArrow',
  }
  return pptx.ShapeType[shapeMap[type]]
}

/**
 * シェイプ要素を追加
 */
function addShapeElements(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  shapes: ShapeElement[] | undefined,
): void {
  if (!shapes) return

  for (const shape of shapes) {
    const shapeType = getShapeType(pptx, shape.type)

    // テキストがある場合は addText + shape オプションを使用
    if (shape.text) {
      const isBold = shape.fontWeight === 'bold' || shape.fontWeight === 'black'

      const textOptions: PptxGenJS.TextPropsOptions = {
        x: pctToInches(shape.x, 'width'),
        y: pctToInches(shape.y, 'height'),
        w: pctToInches(shape.width, 'width'),
        h: pctToInches(shape.height, 'height'),
        shape: shapeType,
        align: shape.textAlign || 'center',
        valign: shape.textValign || 'middle',
        fontFace: 'Noto Sans JP',
        bold: isBold,
      }

      // フォントサイズ（未指定時はシェイプ高さの60%から自動計算）
      if (shape.fontSize) {
        textOptions.fontSize = fontSizePctToPt(shape.fontSize)
      } else {
        textOptions.fontSize = fontSizePctToPt(
          shape.height * DEFAULT_SHAPE_TEXT_SIZE_RATIO,
        )
      }

      // テキスト色
      if (shape.textColor) {
        textOptions.color = shape.textColor
      }

      // 塗りつぶし色
      if (shape.fillColor) {
        textOptions.fill = { color: shape.fillColor }
      }

      // 線の色と太さ
      if (shape.lineColor || shape.lineWidth) {
        textOptions.line = {
          color: shape.lineColor || '000000',
          width: shape.lineWidth || 1,
        }
      }

      // 回転
      if (shape.rotate) {
        textOptions.rotate = shape.rotate
      }

      // 角丸の半径
      if (shape.type === 'roundRect' && shape.cornerRadius) {
        textOptions.rectRadius = shape.cornerRadius
      }

      slide.addText(shape.text, textOptions)
    } else {
      // テキストなしの場合は通常の addShape
      const options: PptxGenJS.ShapeProps = {
        x: pctToInches(shape.x, 'width'),
        y: pctToInches(shape.y, 'height'),
        w: pctToInches(shape.width, 'width'),
        h: pctToInches(shape.height, 'height'),
      }

      // 塗りつぶし色
      if (shape.fillColor) {
        options.fill = { color: shape.fillColor }
      }

      // 線の色と太さ
      if (shape.lineColor || shape.lineWidth) {
        options.line = {
          color: shape.lineColor || '000000',
          width: shape.lineWidth || 1,
        }

        // 矢印線の場合
        if (shape.type === 'arrow') {
          options.line.endArrowType = 'arrow'
        }
      }

      // 回転
      if (shape.rotate) {
        options.rotate = shape.rotate
      }

      // 角丸の半径
      if (shape.type === 'roundRect' && shape.cornerRadius) {
        options.rectRadius = shape.cornerRadius
      }

      slide.addShape(shapeType, options)
    }
  }
}

/**
 * rowsJsonのパース結果を検証し、安全なTableCell配列に変換
 */
export function validateAndParseRowsJson(
  rowsJson: string,
): { valid: true; rows: TableCell[][] } | { valid: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(rowsJson)
  } catch {
    return { valid: false, error: 'Invalid JSON' }
  }

  if (!Array.isArray(parsed)) {
    return { valid: false, error: 'Root is not an array' }
  }

  const validatedRows: TableCell[][] = []
  for (let rowIdx = 0; rowIdx < parsed.length; rowIdx++) {
    const row = parsed[rowIdx]
    if (!Array.isArray(row)) {
      return { valid: false, error: `Row ${rowIdx} is not an array` }
    }

    const validatedCells: TableCell[] = []
    for (let cellIdx = 0; cellIdx < row.length; cellIdx++) {
      const cell = row[cellIdx] as Record<string, unknown>
      if (typeof cell !== 'object' || cell === null) {
        return {
          valid: false,
          error: `Cell at [${rowIdx}][${cellIdx}] is not an object`,
        }
      }

      // textは必須、存在しない場合は空文字にフォールバック
      const text = typeof cell.text === 'string' ? cell.text : ''

      // オプションフィールドの型検証とフォールバック
      const colspan =
        typeof cell.colspan === 'number' ? cell.colspan : undefined
      const rowspan =
        typeof cell.rowspan === 'number' ? cell.rowspan : undefined
      const bold = typeof cell.bold === 'boolean' ? cell.bold : undefined
      const fillColor =
        typeof cell.fillColor === 'string' ? cell.fillColor : undefined
      const color = typeof cell.color === 'string' ? cell.color : undefined
      const align =
        cell.align === 'left' ||
        cell.align === 'center' ||
        cell.align === 'right'
          ? cell.align
          : undefined

      validatedCells.push({
        text,
        colspan,
        rowspan,
        bold,
        fillColor,
        color,
        align,
      })
    }
    validatedRows.push(validatedCells)
  }

  return { valid: true, rows: validatedRows }
}

/**
 * テーブル要素を追加
 */
function addTableElements(
  slide: PptxGenJS.Slide,
  tables: TableElement[] | undefined,
): void {
  if (!tables) return

  for (const table of tables) {
    // rowsJsonをパースして検証
    const parseResult = validateAndParseRowsJson(table.rowsJson)
    if (!parseResult.valid) {
      console.warn(
        `Failed to parse rowsJson (${parseResult.error}), skipping table:`,
        table.rowsJson,
      )
      continue
    }

    const parsedRows = parseResult.rows

    // 行データを変換
    const rows: PptxGenJS.TableRow[] = parsedRows.map((row, rowIdx) => {
      return row.map((cell): PptxGenJS.TableCell => {
        const cellOptions: PptxGenJS.TableCellProps = {}

        if (cell.colspan) cellOptions.colspan = cell.colspan
        if (cell.rowspan) cellOptions.rowspan = cell.rowspan
        if (cell.bold) cellOptions.bold = cell.bold
        // fillColorが"transparent"以外の場合のみ背景色を設定
        if (cell.fillColor && cell.fillColor !== 'transparent') {
          cellOptions.fill = { color: cell.fillColor }
        }
        if (cell.color) cellOptions.color = cell.color
        if (cell.align) cellOptions.align = cell.align

        // ヘッダー行のスタイル
        if (table.headerRows && rowIdx < table.headerRows) {
          cellOptions.bold = true
        }

        return {
          text: cell.text,
          options: cellOptions,
        }
      })
    })

    const tableOptions: PptxGenJS.TableProps = {
      x: pctToInches(table.x, 'width'),
      y: pctToInches(table.y, 'height'),
      w: pctToInches(table.width, 'width'),
      border: table.borderColor
        ? { type: 'solid', pt: 1, color: table.borderColor }
        : { type: 'solid', pt: 1, color: '000000' },
      fontFace: 'Noto Sans JP',
      valign: 'middle',
    }

    if (table.fontSize) {
      tableOptions.fontSize = fontSizePctToPt(table.fontSize)
    }

    // rowHeightsが指定されている場合は行高さを設定
    if (table.rowHeights && table.rowHeights.length > 0) {
      tableOptions.rowH = table.rowHeights.map((h) => pctToInches(h, 'height'))
    }

    slide.addTable(rows, tableOptions)
  }
}

/**
 * Data URLからBase64データ部分を抽出
 */
function extractBase64FromDataUrl(dataUrl: string): string {
  if (!dataUrl.startsWith('data:')) {
    throw new Error('無効なData URL形式です')
  }
  const parts = dataUrl.split(',')
  if (parts.length !== 2 || !parts[1]) {
    throw new Error('Base64データの抽出に失敗しました')
  }
  return parts[1]
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

  // 1. グラフィック要素を追加（最背面に配置）
  for (const graphic of graphics) {
    const { region, imageBlob } = graphic
    // Blob から Data URL に遅延変換（メモリ効率向上）
    const dataUrl = await blobToDataUrl(imageBlob)
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

  // 2. シェイプ要素を追加（graphicRegionsの上）
  addShapeElements(pptx, slide, analysis.shapeElements)

  // 3. テキスト要素を追加（シェイプの上）
  for (const textEl of analysis.textElements) {
    const fontSize = fontSizePctToPt(textEl.fontSize)

    // フォントを選択（スタイルとウェイトを考慮）
    const { fontFace, bold } = selectFontFace(
      textEl.fontStyle,
      textEl.fontWeight,
      textEl.role,
    )

    // インデントレベルに応じてx座標をオフセット（1レベルあたり3%）
    // 幅が負にならないよう最小値を保証し、スライド範囲内に収める
    const indentOffset = (textEl.indentLevel ?? 0) * INDENT_OFFSET_PCT
    const minWidthPct = 1
    const finalWidthPct = Math.max(textEl.width - indentOffset, minWidthPct)
    const xPct = Math.min(textEl.x + indentOffset, 100 - finalWidthPct)

    const textOptions: PptxGenJS.TextPropsOptions = {
      x: pctToInches(xPct, 'width'),
      y: pctToInches(textEl.y, 'height'),
      w: pctToInches(finalWidthPct, 'width'),
      h: pctToInches(textEl.height, 'height'),
      fontSize,
      fontFace,
      bold,
      color: textEl.color,
      align: textEl.align,
      valign: 'top',
    }

    // 背景色が指定されている場合は設定
    if (textEl.backgroundColor) {
      textOptions.fill = { color: textEl.backgroundColor }
    }

    slide.addText(textEl.content, textOptions)
  }

  // 4. テーブル要素を追加（テキストの後）
  addTableElements(slide, analysis.tableElements)

  // Blobとして出力（ブラウザ環境）
  const result = await pptx.write({ outputType: 'blob' })
  if (!(result instanceof Blob)) {
    throw new Error('PPTX生成に失敗しました: 出力がBlobではありません')
  }

  return {
    blob: result,
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
