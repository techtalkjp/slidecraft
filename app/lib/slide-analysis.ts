import { z } from 'zod'

/**
 * スライド解析結果の型定義とZodスキーマ
 * slide-extractorのtypes.tsをベースに必要な部分を移植
 */

// テキスト要素のスキーマ
export const TextElementSchema = z.object({
  content: z.string().describe('テキストの内容'),
  x: z.number().describe('左からの位置（0-100%）'),
  y: z.number().describe('上からの位置（0-100%）'),
  width: z.number().describe('幅（0-100%）'),
  height: z.number().describe('高さ（0-100%）'),
  fontSize: z
    .number()
    .describe(
      'フォントサイズ（スライド高さに対する割合%、例：高さの8%を占めるテキストなら8）',
    ),
  fontWeight: z
    .enum(['light', 'normal', 'medium', 'bold', 'black'])
    .describe(
      'フォントの太さ（light=細い、normal=標準、medium=やや太い、bold=太い、black=極太）',
    ),
  fontStyle: z
    .enum(['serif', 'sans-serif'])
    .describe('フォントスタイル（serif=明朝体、sans-serif=ゴシック体）'),
  color: z.string().describe('テキストの色（hex形式、#なし）'),
  align: z.enum(['left', 'center', 'right']).describe('テキストの配置'),
  role: z
    .enum(['title', 'subtitle', 'body', 'footer', 'logo'])
    .describe('テキストの役割'),
  backgroundColor: z
    .string()
    .optional()
    .describe(
      'テキストボックスの背景色（hex形式、#なし）。graphicRegionと重なる場合に視認性向上のため指定',
    ),
  indentLevel: z
    .number()
    .optional()
    .describe(
      'インデントレベル（0=なし、1=1段階、2=2段階）。箇条書きの子項目で使用',
    ),
})

// グラフィック領域のスキーマ
export const GraphicRegionSchema = z.object({
  description: z.string().describe('グラフィックの説明'),
  x: z.number().describe('左からの位置（0-100%）'),
  y: z.number().describe('上からの位置（0-100%）'),
  width: z.number().describe('幅（0-100%）'),
  height: z.number().describe('高さ（0-100%）'),
})

// シェイプ要素のスキーマ（PPTXネイティブの図形として描画）
export const ShapeElementSchema = z.object({
  type: z
    .enum([
      'rect',
      'roundRect',
      'ellipse',
      'triangle',
      'line',
      'arrow',
      'rightArrow',
      'leftArrow',
      'upArrow',
      'downArrow',
    ])
    .describe(
      'シェイプの種類（rect=矩形、roundRect=角丸矩形、ellipse=楕円/円、triangle=三角形、line=線、arrow=矢印線、rightArrow/leftArrow/upArrow/downArrow=矢印図形）',
    ),
  x: z.number().describe('左からの位置（0-100%）'),
  y: z.number().describe('上からの位置（0-100%）'),
  width: z.number().describe('幅（0-100%）'),
  height: z.number().describe('高さ（0-100%）'),
  fillColor: z
    .string()
    .optional()
    .describe('塗りつぶし色（hex形式、#なし）。透明の場合は省略'),
  lineColor: z.string().optional().describe('線の色（hex形式、#なし）'),
  lineWidth: z.number().optional().describe('線の太さ（pt）'),
  rotate: z.number().optional().describe('回転角度（度）'),
  cornerRadius: z
    .number()
    .optional()
    .describe('角丸の半径（roundRectの場合のみ、インチ単位）'),
  // シェイプ内テキスト
  text: z.string().optional().describe('シェイプ内に表示するテキスト'),
  textColor: z.string().optional().describe('テキストの色（hex形式、#なし）'),
  fontSize: z
    .number()
    .optional()
    .describe('フォントサイズ（スライド高さに対する割合%）'),
  fontWeight: z
    .enum(['light', 'normal', 'medium', 'bold', 'black'])
    .optional()
    .describe('フォントの太さ'),
  textAlign: z
    .enum(['left', 'center', 'right'])
    .optional()
    .describe('テキストの水平配置'),
  textValign: z
    .enum(['top', 'middle', 'bottom'])
    .optional()
    .describe('テキストの垂直配置'),
})

// テーブルセルのスキーマ
export const TableCellSchema = z.object({
  text: z.string().describe('セルのテキスト'),
  colspan: z.number().optional().describe('列の結合数'),
  rowspan: z.number().optional().describe('行の結合数'),
  bold: z.boolean().optional().describe('太字かどうか'),
  fillColor: z
    .string()
    .optional()
    .describe('セルの背景色（hex形式、#なし。透過の場合は"transparent"）'),
  color: z.string().optional().describe('テキストの色（hex形式、#なし）'),
  align: z
    .enum(['left', 'center', 'right'])
    .optional()
    .describe('テキストの配置'),
})

// テーブル要素のスキーマ（rowsJsonでネストを浅くしてGemini API制限を回避）
export const TableElementSchema = z.object({
  x: z.number().describe('左からの位置（0-100%）'),
  y: z.number().describe('上からの位置（0-100%）'),
  width: z.number().describe('幅（0-100%）'),
  rowsJson: z
    .string()
    .describe(
      'セルデータのJSON文字列。形式: [[{"text":"セル1"}, {"text":"セル2"}], ...]。各セルはtext(必須), colspan?, rowspan?, bold?, fillColor?, color?, align?を持つ',
    ),
  rowHeights: z
    .array(z.number())
    .optional()
    .describe('各行の高さ（スライド高さに対する割合%）'),
  headerRows: z
    .number()
    .optional()
    .describe('ヘッダー行の数（0の場合はヘッダーなし）'),
  fontSize: z
    .number()
    .optional()
    .describe('フォントサイズ（スライド高さに対する割合%）'),
  borderColor: z.string().optional().describe('枠線の色（hex形式、#なし）'),
})

// スライド解析結果のスキーマ
export const SlideAnalysisSchema = z.object({
  backgroundColor: z.string().describe('背景色（hex形式、#なし）'),
  textElements: z.array(TextElementSchema).describe('テキスト要素の配列'),
  shapeElements: z
    .array(ShapeElementSchema)
    .optional()
    .describe(
      'シェイプ要素の配列（矩形、円、線、矢印など。単純な図形はここに含め、graphicRegionsには含めない）',
    ),
  tableElements: z
    .array(TableElementSchema)
    .optional()
    .describe('テーブル要素の配列（表形式のデータ）'),
  graphicRegions: z
    .array(GraphicRegionSchema)
    .describe(
      'グラフィック領域の配列（写真、イラスト、複雑なチャートなど、シェイプやテーブルで再現できないもののみ）',
    ),
  slideTitle: z.string().describe('スライドのタイトル（ファイル名用）'),
})

// 型エクスポート
export type TextElement = z.infer<typeof TextElementSchema>
export type GraphicRegion = z.infer<typeof GraphicRegionSchema>
export type ShapeElement = z.infer<typeof ShapeElementSchema>
export type TableCell = z.infer<typeof TableCellSchema>
export type TableElement = z.infer<typeof TableElementSchema>
export type SlideAnalysis = z.infer<typeof SlideAnalysisSchema>

// 抽出されたグラフィックパーツ（ブラウザ用にBlobを使用）
export interface ExtractedGraphic {
  region: GraphicRegion
  imageBlob: Blob
}

// 画像サイズ
export interface ImageDimensions {
  width: number
  height: number
}
