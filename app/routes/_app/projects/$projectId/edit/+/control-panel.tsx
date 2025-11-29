import { FileSpreadsheet } from 'lucide-react'
import { useCallback, useState } from 'react'
import { ApiKeyDialog } from '~/components/api-key-dialog'
import { Button } from '~/components/ui/button'
import { loadCurrentSlideImage } from '~/lib/slides-repository.client'
import type { Slide } from '~/lib/types'
import { CandidateImagesGrid } from './components/candidate-images-grid'
import { GenerationControlForm } from './components/generation-control-form'
import { PptxExportDialog } from './components/pptx-export-dialog'
import { useCostEstimate } from './hooks/use-cost-estimate'
import { useSlideGeneration } from './hooks/use-slide-generation'
import { useSlideImages } from './hooks/use-slide-images'

interface ControlPanelProps {
  projectId: string
  projectName: string
  slide: Slide
  slideNumber: number
  allSlides: Slide[]
  onSlideUpdate: () => void
}

export function ControlPanel({
  projectId,
  projectName,
  slide,
  slideNumber,
  allSlides,
  onSlideUpdate,
}: ControlPanelProps) {
  // ========================================
  // ローカル状態: プロンプトと生成数
  // ========================================

  const [prompt, setPrompt] = useState(slide.lastPrompt || '')
  const [generationCount, setGenerationCount] = useState(1)

  // ========================================
  // カスタムフック: 画像管理
  // ========================================

  const {
    originalImage,
    candidateImages,
    loadOriginalImage,
    loadCandidateImage,
  } = useSlideImages(projectId, slide)

  // ========================================
  // カスタムフック: コスト計算
  // ========================================

  const {
    exchangeRate,
    costEstimate,
    lastGenerationCost,
    recordGenerationCost,
    resetGenerationCost,
  } = useCostEstimate(prompt, generationCount)

  // ========================================
  // カスタムフック: 生成処理
  // ========================================

  const {
    isGenerating,
    generationProgress,
    validationError,
    setValidationError,
    generationError,
    showApiKeyDialog,
    setShowApiKeyDialog,
    promptRef,
    handleGenerate,
  } = useSlideGeneration({
    projectId,
    slide,
    allSlides,
    onSlideUpdate,
    prompt,
    generationCount,
    loadCandidateImage,
    recordGenerationCost,
    resetGenerationCost,
  })

  // ========================================
  // PPTXエクスポート関連の状態
  // ========================================

  const [showPptxDialog, setShowPptxDialog] = useState(false)
  const [showPptxApiKeyDialog, setShowPptxApiKeyDialog] = useState(false)
  const [currentSlideBlob, setCurrentSlideBlob] = useState<Blob | null>(null)

  const handleOpenPptxDialog = useCallback(async () => {
    try {
      const blob = await loadCurrentSlideImage(projectId, slide)
      setCurrentSlideBlob(blob)
      setShowPptxDialog(true)
    } catch (error) {
      console.error('スライド画像の読み込みに失敗:', error)
    }
  }, [projectId, slide])

  const handlePptxApiKeyRequired = useCallback(() => {
    setShowPptxDialog(false)
    setShowPptxApiKeyDialog(true)
  }, [])

  const handlePptxApiKeySaved = useCallback(() => {
    setShowPptxApiKeyDialog(false)
    setShowPptxDialog(true)
  }, [])

  return (
    <>
      <ApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        onSaved={handleGenerate}
      />

      <ApiKeyDialog
        open={showPptxApiKeyDialog}
        onOpenChange={setShowPptxApiKeyDialog}
        onSaved={handlePptxApiKeySaved}
      />

      <PptxExportDialog
        open={showPptxDialog}
        onOpenChange={setShowPptxDialog}
        imageBlob={currentSlideBlob}
        projectName={projectName}
        slideNumber={slideNumber}
        onApiKeyRequired={handlePptxApiKeyRequired}
      />

      <div className="flex h-full flex-col bg-white">
        {/* スライド修正ヘッダー */}
        <div className="flex h-8 shrink-0 items-center border-b border-slate-200 bg-white px-3">
          <h2 className="text-xs font-semibold text-slate-700">スライド修正</h2>
        </div>

        {/* スライド修正コンテンツ（スクロール可能） */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* 生成制御フォーム */}
            <GenerationControlForm
              prompt={prompt}
              setPrompt={setPrompt}
              generationCount={generationCount}
              setGenerationCount={setGenerationCount}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
              validationError={validationError}
              setValidationError={setValidationError}
              generationError={generationError}
              promptRef={promptRef}
              exchangeRate={exchangeRate}
              costEstimate={costEstimate}
              lastGenerationCost={lastGenerationCost}
              onGenerate={handleGenerate}
            />

            {/* 候補画像グリッド */}
            <CandidateImagesGrid
              slide={slide}
              candidateImages={candidateImages}
              originalImage={originalImage}
              isGenerating={isGenerating}
              loadOriginalImage={loadOriginalImage}
              loadCandidateImage={loadCandidateImage}
            />
          </div>
        </div>

        {/* スライドエクスポート（下部固定） */}
        <div className="shrink-0 border-t border-slate-200">
          <div className="flex h-8 items-center border-b border-slate-200 bg-white px-3">
            <h3 className="text-xs font-semibold text-slate-700">
              スライドエクスポート
            </h3>
          </div>
          <div className="space-y-3 p-4">
            <Button
              onClick={handleOpenPptxDialog}
              size="sm"
              className="w-full"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              PPTXエクスポート
            </Button>
            <p className="text-xs text-slate-500">
              現在のスライドを編集可能なPowerPoint形式でダウンロード
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
