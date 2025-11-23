import { RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  loadCurrentSlideImage,
  saveSlides,
} from '~/lib/slides-repository.client'
import type { Slide } from '~/lib/types'

interface MainPreviewProps {
  projectId: string
  slide: Slide
  slideNumber: number
  totalSlides: number
  onSlideUpdate: () => void
  allSlides: Slide[]
}

export function MainPreview({
  projectId,
  slide,
  slideNumber,
  totalSlides,
  onSlideUpdate,
  allSlides,
}: MainPreviewProps) {
  const [imageSrc, setImageSrc] = useState<string>('')

  // 元に戻すボタンのクリックハンドラー
  const handleResetToOriginal = async () => {
    try {
      const updatedSlide: Slide = {
        ...slide,
        currentGeneratedId: undefined,
      }

      const updatedSlides = allSlides.map((s) =>
        s.id === slide.id ? updatedSlide : s,
      )
      await saveSlides(projectId, updatedSlides)

      onSlideUpdate()
    } catch (error) {
      console.error('元画像への復元に失敗しました:', error)
    }
  }

  // 画像データをロードしてdata URLに変換
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

  const isEdited = slide.currentGeneratedId !== undefined

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      {/* ツールバー */}
      <div className="flex h-8 items-center justify-between border-b border-slate-200 bg-white px-4">
        <h1 className="text-xs font-semibold text-slate-800">
          スライド {slideNumber} / {totalSlides}
        </h1>

        <div className="flex items-center gap-2">
          {isEdited && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToOriginal}
              className="text-sm font-medium"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              元に戻す
            </Button>
          )}
        </div>
      </div>

      {/* メインプレビューエリア */}
      <div className="relative flex flex-1 items-center justify-center overflow-auto bg-slate-100/50 p-8">
        <div className="relative w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-900/5">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={`Slide ${slideNumber}`}
              className="h-auto w-full object-contain"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center">
              <span className="text-slate-400">読込中...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
