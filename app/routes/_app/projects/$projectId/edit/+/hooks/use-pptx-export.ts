import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiKey } from '~/lib/api-settings.client'
import { extractAllGraphicRegions } from '~/lib/graphic-extractor.client'
import {
  downloadPptx,
  generatePptx,
  type GeneratePptxResult,
} from '~/lib/pptx-generator.client'
import type { ExtractedGraphic, SlideAnalysis } from '~/lib/slide-analysis'
import {
  analyzeSlide,
  DEFAULT_MODEL,
  type AnalysisModelId,
  type UsageInfo,
} from '~/lib/slide-analyzer.client'

type ExportState = 'idle' | 'analyzing' | 'extracting' | 'generating' | 'ready'

interface UsePptxExportOptions {
  imageBlob: Blob | null
  projectName: string
  slideNumber: number
  open: boolean
  onApiKeyRequired: () => void
}

export function usePptxExport({
  imageBlob,
  projectName,
  slideNumber,
  open,
  onApiKeyRequired,
}: UsePptxExportOptions) {
  const [state, setState] = useState<ExportState>('idle')
  const [selectedModel, setSelectedModel] =
    useState<AnalysisModelId>(DEFAULT_MODEL)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<SlideAnalysis | null>(null)
  const [graphics, setGraphics] = useState<ExtractedGraphic[]>([])
  const [pptxResult, setPptxResult] = useState<GeneratePptxResult | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  // ダイアログが閉じられたときのクリーンアップ
  useEffect(() => {
    if (!open) {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null

      setState('idle')
      setError(null)
      setAnalysis(null)
      setGraphics([])
      setPptxResult(null)
      setUsage(null)
    }
  }, [open])

  const handleAnalyze = useCallback(async () => {
    const apiKey = getApiKey()
    if (!apiKey) {
      onApiKeyRequired()
      return
    }

    if (!imageBlob) {
      setError('画像が読み込まれていません')
      return
    }

    setError(null)
    setState('analyzing')

    abortControllerRef.current = new AbortController()

    try {
      // スライド解析
      const result = await analyzeSlide({
        apiKey,
        imageBlob,
        model: selectedModel,
        signal: abortControllerRef.current.signal,
      })

      setAnalysis(result.analysis)
      setUsage(result.usage)

      // グラフィック切り出し
      setState('extracting')
      const extractedGraphics = await extractAllGraphicRegions(
        imageBlob,
        result.analysis.graphicRegions,
      )
      setGraphics(extractedGraphics)

      // PPTX生成
      setState('generating')
      const pptx = await generatePptx({
        analysis: result.analysis,
        graphics: extractedGraphics,
        fileName: `${projectName}_${slideNumber}.pptx`,
      })
      setPptxResult(pptx)

      setState('ready')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }

      console.error('PPTXエクスポートエラー:', err)
      setError(
        err instanceof Error ? err.message : 'エクスポートに失敗しました',
      )
      setState('idle')
    }
  }, [imageBlob, selectedModel, projectName, slideNumber, onApiKeyRequired])

  const handleDownload = useCallback(() => {
    if (pptxResult) {
      downloadPptx(pptxResult)
    }
  }, [pptxResult])

  const isProcessing = state !== 'idle' && state !== 'ready'

  return {
    // 状態
    state,
    selectedModel,
    error,
    analysis,
    graphics,
    pptxResult,
    usage,
    isProcessing,

    // アクション
    setSelectedModel,
    handleAnalyze,
    handleDownload,
  }
}
