import { useCallback, useEffect, useRef, useState } from 'react'
import { loadSlideImage } from '~/lib/slides-repository.client'
import type { Slide } from '~/lib/types'

/**
 * スライド画像の読み込みと管理を行うカスタムフック
 *
 * - オリジナル画像と生成候補画像のキャッシュ管理
 * - スライド切り替え時の自動クリーンアップとプリロード
 * - Object URLのライフサイクル管理（メモリリーク防止）
 */
export function useSlideImages(projectId: string, slide: Slide) {
  // 画像URLのキャッシュ
  const [candidateImages, setCandidateImages] = useState<
    Map<string, string | null>
  >(new Map())
  const [originalImage, setOriginalImage] = useState<string | null>(null)

  // スライドID追跡用（変更検知）
  const prevSlideIdRef = useRef<string>(slide.id)

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

  /**
   * オリジナル画像を読み込む（遅延ロード用）
   * マウスオーバー時など、必要に応じて呼び出される
   */
  const loadOriginalImage = useCallback(async () => {
    if (originalImage) return

    try {
      const blob = await loadSlideImage(projectId, slide.id, 'original')
      const url = URL.createObjectURL(blob)
      setOriginalImage(url)
    } catch (err) {
      console.error('オリジナル画像の読み込みエラー:', err)
    }
  }, [projectId, slide.id, originalImage])

  /**
   * 候補画像を読み込む（遅延ロード）
   * 候補画像リストに表示される際に呼び出される
   */
  const loadCandidateImage = useCallback(
    async (generatedId: string) => {
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
    },
    [projectId, slide.id, candidateImages],
  )

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

  return {
    originalImage,
    candidateImages,
    loadOriginalImage,
    loadCandidateImage,
  }
}
