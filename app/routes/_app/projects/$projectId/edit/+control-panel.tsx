import {
  AlertCircle,
  Check,
  DollarSign,
  HelpCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiKeyDialog } from '~/components/api-key-dialog'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/hover-card'
import { Textarea } from '~/components/ui/textarea'
import {
  trackFirstGenerationCompleted,
  trackGenerationCompleted,
  trackGenerationFailed,
  trackGenerationStarted,
} from '~/lib/analytics'
import { getApiKey, hasApiKey } from '~/lib/api-settings.client'
import {
  calculateGenerationCost,
  formatCost,
  formatCostJPY,
  getExchangeRate,
} from '~/lib/cost-calculator'
import { dataUrlToBlob, generateSlideVariations } from '~/lib/gemini-api.client'
import {
  loadCurrentSlideImage,
  loadSlideImage,
  saveSlideImage,
  saveSlides,
} from '~/lib/slides-repository.client'
import type { Slide } from '~/lib/types'

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
  // 生成処理の状態
  const [prompt, setPrompt] = useState(slide.lastPrompt || '')
  const [generationCount, setGenerationCount] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // 画像管理の状態
  const [candidateImages, setCandidateImages] = useState<
    Map<string, string | null>
  >(new Map())
  const [originalImage, setOriginalImage] = useState<string | null>(null)

  // コスト管理の状態
  const [lastGenerationCost, setLastGenerationCost] = useState<number | null>(
    null,
  )
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)

  // その他の状態
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const prevSlideIdRef = useRef<string>(slide.id)

  // ========================================
  // 画像管理: Object URLのクリーンアップとプリロード
  // ========================================

  /**
   * 既存の画像Object URLをクリーンアップする
   * メモリリークを防ぐため、スライド切り替え時に実行
   */
  const cleanupImageUrls = useCallback(() => {
    if (originalImage) {
      URL.revokeObjectURL(originalImage)
    }
    candidateImages.forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url)
      }
    })
  }, [originalImage, candidateImages])

  /**
   * オリジナル画像をプリロードする
   * 候補画像がある場合にスライド切り替え時に実行
   */
  const preloadOriginalImage = useCallback(async () => {
    try {
      const blob = await loadSlideImage(projectId, slide.id, 'original')
      const url = URL.createObjectURL(blob)
      setOriginalImage(url)
    } catch (err) {
      console.error('オリジナル画像の読み込みエラー:', err)
    }
  }, [projectId, slide.id])

  // ========================================
  // コスト計算: 為替レート取得
  // ========================================

  /**
   * USD/JPY為替レートを取得（初回のみ）
   * 外部システム: exchangerate-api.comのREST API
   * 24時間キャッシュされるため、頻繁なリクエストは発生しない
   */
  useEffect(() => {
    getExchangeRate().then(setExchangeRate)
  }, [])

  // ========================================
  // スライド切り替え時の画像リセット
  // ========================================

  // スライドが変わったら画像状態をリセットして再読み込み
  useEffect(() => {
    if (prevSlideIdRef.current !== slide.id) {
      // 既存のObject URLをクリーンアップ
      cleanupImageUrls()

      // 状態をリセット
      setOriginalImage(null)
      setCandidateImages(new Map())

      // 現在のスライドIDを記憶
      prevSlideIdRef.current = slide.id

      // 候補がある場合はオリジナル画像をプリロード
      if (slide.generatedCandidates.length > 0) {
        preloadOriginalImage()
      }
    }
  }, [
    slide.id,
    slide.generatedCandidates.length,
    cleanupImageUrls,
    preloadOriginalImage,
  ])

  // ========================================
  // 画像読み込み関数
  // ========================================

  /**
   * オリジナル画像を読み込む（遅延ロード用）
   * マウスオーバー時など、必要に応じて呼び出される
   */
  const loadOriginalImage = async () => {
    if (originalImage) return

    try {
      const blob = await loadSlideImage(projectId, slide.id, 'original')
      const url = URL.createObjectURL(blob)
      setOriginalImage(url)
    } catch (err) {
      console.error('オリジナル画像の読み込みエラー:', err)
    }
  }

  /**
   * 候補画像を読み込む（遅延ロード）
   * 候補画像リストに表示される際に呼び出される
   */
  const loadCandidateImage = async (generatedId: string) => {
    if (candidateImages.has(generatedId)) {
      return
    }

    try {
      const blob = await loadSlideImage(
        projectId,
        slide.id,
        'generated',
        generatedId,
      )
      if (blob) {
        const url = URL.createObjectURL(blob)
        setCandidateImages((prev) => new Map(prev).set(generatedId, url))
      }
    } catch (err) {
      console.error(`候補画像の読み込みエラー (${generatedId}):`, err)
      setCandidateImages((prev) => new Map(prev).set(generatedId, null))
    }
  }

  // ========================================
  // 生成処理
  // ========================================

  /**
   * プロンプト入力のバリデーション
   * @returns バリデーション成功時true、失敗時false
   */
  const validatePrompt = (): boolean => {
    // APIキーがない場合はダイアログを表示
    if (!hasApiKey()) {
      setShowApiKeyDialog(true)
      return false
    }

    // プロンプトが空の場合はエラー表示
    if (!prompt.trim()) {
      setValidationError('修正内容を入力してください')
      promptRef.current?.focus()
      return false
    }

    return true
  }

  /**
   * 生成された画像を保存してメタデータを更新
   */
  const saveGeneratedImages = async (
    generatedImages: Array<{
      id: string
      dataUrl: string
      timestamp: number
    }>,
  ) => {
    const newCandidates = []

    for (let i = 0; i < generatedImages.length; i++) {
      const generated = generatedImages[i]
      setGenerationProgress({ current: i + 2, total: generationCount + 1 })

      // Data URLをBlobに変換
      const generatedBlob = await dataUrlToBlob(generated.dataUrl)

      // 生成画像を保存
      await saveSlideImage(
        projectId,
        slide.id,
        'generated',
        generatedBlob,
        generated.id,
      )

      // 候補リストに追加
      newCandidates.push({
        id: generated.id,
        prompt,
        timestamp: new Date(generated.timestamp).toISOString(),
      })

      // 候補画像をプリロード
      await loadCandidateImage(generated.id)
    }

    // スライドメタデータを更新
    const updatedSlide: Slide = {
      ...slide,
      lastPrompt: prompt,
      generatedCandidates: [...newCandidates, ...slide.generatedCandidates],
    }

    const updatedSlides = allSlides.map((s) =>
      s.id === slide.id ? updatedSlide : s,
    )
    await saveSlides(projectId, updatedSlides)

    // 更新を通知
    onSlideUpdate()
  }

  // 生成ボタンクリック
  const handleGenerate = async () => {
    // バリデーション
    if (!validatePrompt()) {
      return
    }

    // 状態をリセット
    setValidationError(null)
    setGenerationError(null)
    setIsGenerating(true)
    setGenerationProgress({ current: 0, total: generationCount })
    setLastGenerationCost(null)

    // GA4: 生成開始イベント
    const startTime = Date.now()
    trackGenerationStarted(generationCount)

    try {
      // コスト計算
      const costEstimate = calculateGenerationCost(prompt, generationCount)
      setLastGenerationCost(costEstimate.totalCost)

      // APIキー取得
      const apiKey = getApiKey()
      if (!apiKey) {
        throw new Error('APIキーが設定されていません')
      }

      // 元画像を読み込む
      const originalImage = await loadCurrentSlideImage(projectId, slide)
      if (!originalImage) {
        throw new Error('元画像の読み込みに失敗しました')
      }

      // 複数の画像を一度に生成
      setGenerationProgress({ current: 1, total: generationCount })
      const generatedImages = await generateSlideVariations(
        apiKey,
        originalImage,
        prompt,
        generationCount,
      )

      // 生成された画像を保存してメタデータ更新
      await saveGeneratedImages(generatedImages)

      // GA4: 生成完了イベント
      const duration = Date.now() - startTime
      trackGenerationCompleted(generationCount, duration)
      trackFirstGenerationCompleted(generationCount, duration)
    } catch (err) {
      console.error('スライド修正エラー:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'スライドの修正に失敗しました'
      setGenerationError(errorMessage)

      // GA4: 生成失敗イベント
      trackGenerationFailed(errorMessage)
    } finally {
      setIsGenerating(false)
      setGenerationProgress(null)
    }
  }

  /**
   * 候補画像を選択してスライドに適用する
   * @param generatedId 生成画像ID（nullの場合はオリジナルに戻す）
   */
  const handleSelectCandidate = async (generatedId: string | null) => {
    try {
      const updatedSlide: Slide = {
        ...slide,
        currentGeneratedId: generatedId === null ? undefined : generatedId,
      }

      const updatedSlides = allSlides.map((s) =>
        s.id === slide.id ? updatedSlide : s,
      )
      await saveSlides(projectId, updatedSlides)

      onSlideUpdate()
    } catch (err) {
      console.error('候補適用エラー:', err)
      setGenerationError('候補の適用に失敗しました')
    }
  }

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
                          {formatCostJPY(
                            calculateGenerationCost(
                              prompt || 'スライドを修正',
                              generationCount,
                            ).totalCost,
                            exchangeRate,
                          )}
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
                              calculateGenerationCost(prompt, generationCount)
                                .inputCost,
                              exchangeRate,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>出力 (×{generationCount}):</span>
                          <span>
                            {formatCostJPY(
                              calculateGenerationCost(prompt, generationCount)
                                .outputCost,
                              exchangeRate,
                            )}
                          </span>
                        </div>
                        <div className="mt-2 flex justify-between border-t border-slate-200 pt-1 font-medium">
                          <span>合計:</span>
                          <span>
                            {formatCostJPY(
                              calculateGenerationCost(prompt, generationCount)
                                .totalCost,
                              exchangeRate,
                            )}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {formatCost(
                            calculateGenerationCost(prompt, generationCount)
                              .totalCost,
                          )}{' '}
                          × ¥{exchangeRate.toFixed(2)}
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
