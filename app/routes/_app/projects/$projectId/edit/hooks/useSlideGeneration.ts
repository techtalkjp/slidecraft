import { useRef, useState } from 'react'
import {
  trackFirstGenerationCompleted,
  trackGenerationCompleted,
  trackGenerationFailed,
  trackGenerationStarted,
} from '~/lib/analytics'
import { getApiKey, hasApiKey } from '~/lib/api-settings.client'
import { dataUrlToBlob, generateSlideVariations } from '~/lib/gemini-api.client'
import {
  loadCurrentSlideImage,
  saveSlideImage,
  saveSlides,
} from '~/lib/slides-repository.client'
import type { Slide } from '~/lib/types'

interface UseSlideGenerationParams {
  projectId: string
  slide: Slide
  allSlides: Slide[]
  onSlideUpdate: () => void
  prompt: string
  generationCount: number
  loadCandidateImage: (generatedId: string) => Promise<void>
  recordGenerationCost: () => void
  resetGenerationCost: () => void
}

/**
 * スライド生成処理を管理するカスタムフック
 *
 * - プロンプト入力とバリデーション
 * - AI生成処理の実行と進捗管理
 * - 生成された画像の保存とメタデータ更新
 * - 候補画像の選択と適用
 * - エラーハンドリングとアナリティクス追跡
 */
export function useSlideGeneration({
  projectId,
  slide,
  allSlides,
  onSlideUpdate,
  prompt,
  generationCount,
  loadCandidateImage,
  recordGenerationCost,
  resetGenerationCost,
}: UseSlideGenerationParams) {
  // 生成処理の状態
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)

  // プロンプト入力欄への参照
  const promptRef = useRef<HTMLTextAreaElement>(null)

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

  /**
   * 生成ボタンクリック処理
   * AI生成を実行し、結果を保存する
   */
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
    resetGenerationCost()

    // GA4: 生成開始イベント
    const startTime = Date.now()
    trackGenerationStarted(generationCount)

    try {
      // コスト計算と記録
      recordGenerationCost()

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

  return {
    // 状態
    isGenerating,
    generationProgress,
    validationError,
    setValidationError,
    generationError,
    showApiKeyDialog,
    setShowApiKeyDialog,
    promptRef,
    // 関数
    handleGenerate,
    handleSelectCandidate,
  }
}
