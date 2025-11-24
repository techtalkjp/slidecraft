import { useState } from 'react'

/**
 * 画像のズーム・パン操作を管理するカスタムフック
 *
 * - スケール（0.5〜3.0倍）とポジション（x, y）の管理
 * - マウスホイールでのズーム操作
 * - ドラッグでのパン操作
 * - ビューのリセット機能
 */
export function useImageZoomPan() {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  /**
   * ズームとパンをリセット
   */
  const handleResetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  /**
   * ズームイン（+0.25倍、最大3倍）
   */
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  /**
   * ズームアウト（-0.25倍、最小0.5倍）
   */
  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  /**
   * マウスホイールでズーム
   * Ctrl/Cmdキー + ホイールでズーム操作
   *
   * External system: マウスホイールイベント
   */
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)))
    }
  }

  /**
   * ドラッグ開始
   * スケールが1より大きい場合のみドラッグ可能
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  /**
   * ドラッグ中
   * ドラッグ中はカーソル位置に合わせて画像を移動
   *
   * External system: マウス移動イベント
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  /**
   * ドラッグ終了
   */
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return {
    // 状態
    scale,
    position,
    isDragging,
    // ハンドラー
    handleResetView,
    handleZoomIn,
    handleZoomOut,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}
