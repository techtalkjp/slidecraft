import type { Slide } from '~/lib/types'
import { ImageCanvas } from './components/image-canvas'
import { PreviewHeader } from './components/preview-header'
import { useImageZoomPan } from './hooks/use-image-zoom-pan'
import { useSlideImageLoad } from './hooks/use-slide-image-load'

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
}: MainPreviewProps) {
  // ========================================
  // カスタムフック: 画像読み込み
  // ========================================

  const imageSrc = useSlideImageLoad(projectId, slide)

  // ========================================
  // カスタムフック: ズーム・パン操作
  // ========================================

  const {
    scale,
    position,
    isDragging,
    handleResetView,
    handleZoomIn,
    handleZoomOut,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useImageZoomPan()

  const isEdited = slide.currentGeneratedId !== undefined

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      {/* ヘッダー */}
      <PreviewHeader
        slideNumber={slideNumber}
        totalSlides={totalSlides}
        isEdited={isEdited}
        slideId={slide.id}
      />

      {/* メインプレビューエリア */}
      <ImageCanvas
        imageSrc={imageSrc}
        slideNumber={slideNumber}
        scale={scale}
        position={position}
        isDragging={isDragging}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />
    </div>
  )
}
