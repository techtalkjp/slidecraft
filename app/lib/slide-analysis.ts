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
  fontSize: z.number().describe('フォントサイズ（スライド高さに対する割合%）'),
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
})

// グラフィック領域のスキーマ
export const GraphicRegionSchema = z.object({
  description: z.string().describe('グラフィックの説明'),
  x: z.number().describe('左からの位置（0-100%）'),
  y: z.number().describe('上からの位置（0-100%）'),
  width: z.number().describe('幅（0-100%）'),
  height: z.number().describe('高さ（0-100%）'),
})

// スライド解析結果のスキーマ
export const SlideAnalysisSchema = z.object({
  backgroundColor: z.string().describe('背景色（hex形式、#なし）'),
  textElements: z.array(TextElementSchema).describe('テキスト要素の配列'),
  graphicRegions: z
    .array(GraphicRegionSchema)
    .describe('グラフィック領域の配列'),
  slideTitle: z.string().describe('スライドのタイトル（ファイル名用）'),
})

// 型エクスポート
export type TextElement = z.infer<typeof TextElementSchema>
export type GraphicRegion = z.infer<typeof GraphicRegionSchema>
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
