import { saveSlides } from '~/lib/slides-repository.client'
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
  onSlideUpdate,
  allSlides,
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

  // ========================================
  // スライド復元処理
  // ========================================

  /**
   * 元に戻すボタンのクリックハンドラー
   * 現在適用されている生成画像をクリアしてオリジナルに戻す
   */
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

  const isEdited = slide.currentGeneratedId !== undefined

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      {/* ヘッダー */}
      <PreviewHeader
        slideNumber={slideNumber}
        totalSlides={totalSlides}
        isEdited={isEdited}
        onResetToOriginal={handleResetToOriginal}
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
