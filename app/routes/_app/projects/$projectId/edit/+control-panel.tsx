import {
  AlertCircle,
  Check,
  DollarSign,
  HelpCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { ApiKeyDialog } from '~/components/api-key-dialog'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/hover-card'
import { Textarea } from '~/components/ui/textarea'
import { formatCost, formatCostJPY } from '~/lib/cost-calculator'
import type { Slide } from '~/lib/types'
import { useCostEstimate } from './hooks/useCostEstimate'
import { useSlideGeneration } from './hooks/useSlideGeneration'
import { useSlideImages } from './hooks/useSlideImages'

interface ControlPanelProps {
  projectId: string
  slide: Slide
  allSlides: Slide[]
  onSlideUpdate: () => void
}

export function ControlPanel({
  projectId,
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
    handleSelectCandidate,
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

  // 生成処理はuseSlideGenerationフックに移行

  return (
    <>
      <ApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        onSaved={handleGenerate}
      />

      <div className="flex h-full flex-col border-l bg-white">
        <div className="flex h-8 items-center border-b px-3">
          <h2 className="text-xs font-semibold text-slate-700">スライド修正</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* プロンプト入力 */}
            <div className="space-y-2">
              <label
                htmlFor="prompt"
                className="text-sm font-medium text-slate-700"
              >
                修正内容
              </label>
              <Textarea
                ref={promptRef}
                id="prompt"
                placeholder="例: 背景色を青から白に変更、文字化けを修正、タイトルを大きく"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                rows={4}
                disabled={isGenerating}
                className={`resize-none ${validationError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {validationError && (
                <p className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {validationError}
                </p>
              )}
            </div>

            {/* 生成枚数選択とコスト */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700">
                  生成候補数
                </div>
                {exchangeRate && (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="flex cursor-help items-center gap-1 text-xs text-slate-500">
                        <span>
                          コスト推定{' '}
                          {formatCostJPY(costEstimate.totalCost, exchangeRate)}
                        </span>
                        <HelpCircle className="h-3.5 w-3.5" />
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64" align="end">
                      <div className="mb-2 font-medium text-slate-700">
                        コスト見積もり
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>入力:</span>
                          <span>
                            {formatCostJPY(
                              costEstimate.inputCost,
                              exchangeRate,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>出力 (×{generationCount}):</span>
                          <span>
                            {formatCostJPY(
                              costEstimate.outputCost,
                              exchangeRate,
                            )}
                          </span>
                        </div>
                        <div className="mt-2 flex justify-between border-t border-slate-200 pt-1 font-medium">
                          <span>合計:</span>
                          <span>
                            {formatCostJPY(
                              costEstimate.totalCost,
                              exchangeRate,
                            )}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {formatCost(costEstimate.totalCost)} × ¥
                          {exchangeRate.toFixed(2)}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <Button
                    key={count}
                    variant={generationCount === count ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGenerationCount(count)}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {count}案
                  </Button>
                ))}
              </div>
            </div>

            {/* 修正コスト */}
            {lastGenerationCost !== null && !isGenerating && (
              <div className="rounded-md bg-green-50 p-3">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    修正コスト: {formatCost(lastGenerationCost)}
                    {exchangeRate && (
                      <span className="ml-1 text-green-600">
                        ({formatCostJPY(lastGenerationCost, exchangeRate)})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* 生成ボタン */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  修正中 {generationProgress?.current}/
                  {generationProgress?.total}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  修正案を生成
                </>
              )}
            </Button>

            {/* 生成エラーメッセージ */}
            {generationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generationError}</AlertDescription>
              </Alert>
            )}

            {/* 生成候補リスト */}
            {slide.generatedCandidates.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">
                  修正候補を選択
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* オリジナル画像 */}
                  <button
                    type="button"
                    onClick={() => handleSelectCandidate(null)}
                    disabled={isGenerating}
                    onMouseEnter={loadOriginalImage}
                    className={`relative aspect-video overflow-hidden rounded-md border-2 transition-all ${
                      !slide.currentGeneratedId
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {originalImage ? (
                      <img
                        src={originalImage}
                        alt="オリジナル"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      </div>
                    )}

                    <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      オリジナル
                    </div>

                    {!slide.currentGeneratedId && (
                      <div className="absolute top-1 right-1 rounded-full bg-blue-500 p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>

                  {/* 生成された候補 */}
                  {slide.generatedCandidates.map((candidate) => {
                    const isApplied = slide.currentGeneratedId === candidate.id
                    const imageUrl = candidateImages.get(candidate.id)

                    // 画像を遅延読み込み
                    if (!candidateImages.has(candidate.id)) {
                      loadCandidateImage(candidate.id)
                    }

                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => handleSelectCandidate(candidate.id)}
                        disabled={isGenerating}
                        className={`relative aspect-video overflow-hidden rounded-md border-2 transition-all ${
                          isApplied
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`候補 ${candidate.id}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          </div>
                        )}

                        {isApplied && (
                          <div className="absolute top-1 right-1 rounded-full bg-blue-500 p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
