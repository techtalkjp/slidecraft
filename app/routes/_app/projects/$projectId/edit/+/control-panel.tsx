import { useState } from 'react'
import { ApiKeyDialog } from '~/components/api-key-dialog'
import type { Slide } from '~/lib/types'
import { CandidateImagesGrid } from './components/candidate-images-grid'
import { GenerationControlForm } from './components/generation-control-form'
import { PptxBatchExportPanel } from './components/pptx-batch-export-panel'
import { useCostEstimate } from './hooks/use-cost-estimate'
import { useSlideGeneration } from './hooks/use-slide-generation'
import { useSlideImages } from './hooks/use-slide-images'

interface ControlPanelProps {
  projectId: string
  projectName: string
  slide: Slide
  allSlides: Slide[]
  onSlideUpdate: () => void
}

export function ControlPanel({
  projectId,
  projectName,
  slide,
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

  return (
    <>
      <ApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        onSaved={handleGenerate}
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

        {/* PPTX一括エクスポート（下部固定） */}
        <div className="shrink-0 border-t border-slate-200">
          <PptxBatchExportPanel
            projectId={projectId}
            projectName={projectName}
            slides={allSlides}
          />
        </div>
      </div>
    </>
  )
}
