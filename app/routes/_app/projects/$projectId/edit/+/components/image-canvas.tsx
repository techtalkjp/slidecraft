import { ZoomControls } from './zoom-controls'

interface ImageCanvasProps {
  imageSrc: string
  slideNumber: number
  scale: number
  position: { x: number; y: number }
  isDragging: boolean
  onWheel: (e: React.WheelEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
}

/**
 * 画像表示キャンバスコンポーネント
 *
 * スライド画像の表示とズーム・パン操作を統合
 */
export function ImageCanvas({
  imageSrc,
  slideNumber,
  scale,
  position,
  isDragging,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onZoomIn,
  onZoomOut,
  onResetView,
}: ImageCanvasProps) {
  return (
    /* biome-ignore lint/a11y/noStaticElementInteractions: 画像ビューアとしてズーム・パン操作が必要 */
    <div
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-100 p-8"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
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

      {/* ズームコントロール */}
      <ZoomControls
        scale={scale}
        position={position}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetView={onResetView}
      />
    </div>
  )
}
