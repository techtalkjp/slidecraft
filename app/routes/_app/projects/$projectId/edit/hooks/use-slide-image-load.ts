import { useEffect, useState } from 'react'
import { loadCurrentSlideImage } from '~/lib/slides-repository.client'
import type { Slide } from '~/lib/types'

/**
 * スライド画像の読み込みを管理するカスタムフック
 *
 * - 現在のスライド画像（オリジナルまたは生成済み）を読み込む
 * - Object URLのライフサイクル管理（メモリリーク防止）
 * - スライド切り替え時の自動クリーンアップ
 *
 * External system: OPFS (Origin Private File System)
 */
export function useSlideImageLoad(projectId: string, slide: Slide) {
  const [imageSrc, setImageSrc] = useState<string>('')

  /**
   * 画像データをロードしてObject URLに変換
   * スライドが変わるたびに実行され、前の画像URLはクリーンアップされる
   */
  useEffect(() => {
    let mounted = true
    let objectUrl: string | null = null

    const loadImage = async () => {
      try {
        const blob = await loadCurrentSlideImage(projectId, slide)
        if (mounted) {
          const url = URL.createObjectURL(blob)
          objectUrl = url
          setImageSrc(url)
        }
      } catch (error) {
        console.error('スライド画像の読み込みに失敗しました:', error)
      }
    }

    loadImage()

    return () => {
      mounted = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [projectId, slide])

  return imageSrc
}
