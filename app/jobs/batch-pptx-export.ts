/**
 * 全スライド一括 PPTX エクスポートジョブ
 *
 * 複数スライドを順番に解析し、1つの PPTX ファイルにまとめる
 * Durably による中断再開対応
 */
import { defineJob } from '@coji/durably'
import { z } from 'zod'

/**
 * 生成画像候補のスキーマ
 */
const GeneratedImageSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  timestamp: z.string(),
})

/**
 * スライド情報の入力スキーマ（Slide 型と同じ構造）
 */
const SlideInputSchema = z.object({
  id: z.string(),
  pageIndex: z.number(),
  lastPrompt: z.string().optional(),
  generatedCandidates: z.array(GeneratedImageSchema),
  currentGeneratedId: z.string().optional(),
})

/**
 * ジョブ入力スキーマ
 */
const BatchPptxExportInputSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  slides: z.array(SlideInputSchema),
  apiKey: z.string(),
})

/**
 * ジョブ出力スキーマ
 */
const BatchPptxExportOutputSchema = z.object({
  opfsPath: z.string(), // OPFS 内のファイルパス
  fileName: z.string(),
  totalSlides: z.number(),
  completedAt: z.string(),
})

export const batchPptxExportJob = defineJob({
  name: 'batch-pptx-export',
  input: BatchPptxExportInputSchema,
  output: BatchPptxExportOutputSchema,
  run: async (step, payload) => {
    const { projectId, projectName, slides, apiKey } = payload

    step.progress(0, 2, 'スライドを解析中...')

    // 全スライドを並列で解析（1つのステップで実行）
    const processedSlides = await step.run('analyze-all-slides', async () => {
      const { loadCurrentSlideImage } =
        await import('~/lib/slides-repository.client')
      const { analyzeSlide } = await import('~/lib/slide-analyzer.client')
      const { extractAllGraphicRegions } =
        await import('~/lib/graphic-extractor.client')

      // 全スライドを並列処理
      const results = await Promise.all(
        slides.map(async (slide, i) => {
          const slideNumber = i + 1

          // 1. スライド画像を取得
          const imageBlob = await loadCurrentSlideImage(projectId, slide)

          // 2. AI 解析
          const analysisResult = await analyzeSlide({
            apiKey,
            imageBlob,
          })

          // 3. グラフィック抽出
          const graphics = await extractAllGraphicRegions(
            imageBlob,
            analysisResult.analysis.graphicRegions,
          )

          // 4. 結果をシリアライズ可能な形式に変換
          const graphicsBase64 = await Promise.all(
            graphics.map(async (g) => ({
              regionJson: JSON.stringify(g.region),
              imageBase64: await blobToBase64(g.imageBlob),
            })),
          )

          return {
            slideId: slide.id,
            slideNumber,
            analysisJson: JSON.stringify(analysisResult.analysis),
            graphicsBase64,
          }
        }),
      )

      // スライド番号順にソート（並列実行で順番が保証されないため）
      return results.sort((a, b) => a.slideNumber - b.slideNumber)
    })

    step.progress(1, 2, 'PPTX を生成中...')

    // PPTX 生成・保存ステップ
    const pptxResult = await step.run('generate-pptx', async () => {
      const { generateMultiSlidePptx } =
        await import('~/lib/pptx-generator.client')
      const { SlideAnalysisSchema } = await import('~/lib/slide-analysis')
      const { writeFile } = await import('~/lib/storage.client')

      // シリアライズされたデータを復元
      const slideDataList = processedSlides.map((processed) => {
        const analysis = SlideAnalysisSchema.parse(
          JSON.parse(processed.analysisJson),
        )
        const graphics = processed.graphicsBase64.map((g) => ({
          region: JSON.parse(g.regionJson),
          imageBlob: base64ToBlob(g.imageBase64, 'image/png'),
        }))
        return { analysis, graphics }
      })

      const timestamp = new Date().toISOString().split('T')[0]
      const fileName = `${projectName}-${timestamp}.pptx`

      const result = await generateMultiSlidePptx({
        slides: slideDataList,
        fileName,
        title: projectName,
      })

      // OPFS に保存
      const opfsPath = `exports/${projectId}/${fileName}`
      await writeFile(opfsPath, result.blob)

      return {
        opfsPath,
        fileName: result.fileName,
      }
    })

    step.progress(2, 2, '完了')

    return {
      opfsPath: pptxResult.opfsPath,
      fileName: pptxResult.fileName,
      totalSlides: slides.length,
      completedAt: new Date().toISOString(),
    }
  },
})

/**
 * Blob を Base64 文字列に変換
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // data:image/png;base64, の部分を除去
      const base64 = result.split(',')[1] || ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Base64 文字列を Blob に変換
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

export type BatchPptxExportInput = z.infer<typeof BatchPptxExportInputSchema>
export type BatchPptxExportOutput = z.infer<typeof BatchPptxExportOutputSchema>
