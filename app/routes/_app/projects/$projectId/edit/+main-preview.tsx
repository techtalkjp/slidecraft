import { Maximize2, Minus, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

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

  // ズームとパンをリセット
  const handleResetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // ズームイン
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  // ズームアウト
  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  // マウスホイールでズーム
  // External system: マウスホイールイベント
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)))
    }
  }

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  // ドラッグ中
  // External system: マウス移動イベント
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  // ドラッグ終了
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const isEdited = slide.currentGeneratedId !== undefined

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      {/* ヘッダー */}
      <div className="flex h-8 items-center justify-between border-b border-slate-200 bg-white px-4">
        <h1 className="text-xs font-semibold text-slate-800">
          スライド {slideNumber} / {totalSlides}
        </h1>

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

      {/* メインプレビューエリア */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: 画像ビューアとしてズーム・パン操作が必要 */}
      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-100/50 p-8"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <div
          className="relative w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-900/5"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={`Slide ${slideNumber}`}
              className="h-auto w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center">
              <span className="text-slate-400">読込中...</span>
            </div>
          )}
        </div>

        {/* ズームコントロール（オーバーレイ） */}
        <div className="absolute right-6 bottom-6 flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="h-8 w-8 p-0"
            title="ズームアウト"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs text-slate-600">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="h-8 w-8 p-0"
            title="ズームイン"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetView}
            disabled={scale === 1 && position.x === 0 && position.y === 0}
            className="h-8 w-8 p-0"
            title="ビューをリセット"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
