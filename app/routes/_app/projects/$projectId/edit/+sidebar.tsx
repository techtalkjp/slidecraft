import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { loadSlideImage } from '~/lib/slides-repository.client'
import type { Slide } from '~/lib/types'

interface SidebarProps {
  projectId: string
  slides: Slide[]
  selectedIndex: number
}

function SlideThumbnail({
  projectId,
  slide,
  index,
  isSelected,
}: {
  projectId: string
  slide: Slide
  index: number
  isSelected: boolean
}) {
  const [imageSrc, setImageSrc] = useState<string>('')

  // 画像データをロードしてdata URLに変換
  useEffect(() => {
    let mounted = true
    let currentUrl: string | null = null

    const loadImage = async () => {
      try {
        const blob = slide.currentGeneratedId
          ? await loadSlideImage(
              projectId,
              slide.id,
              'generated',
              slide.currentGeneratedId,
            )
          : await loadSlideImage(projectId, slide.id, 'original')

        if (mounted) {
          const url = URL.createObjectURL(blob)
          currentUrl = url
          setImageSrc(url)
        }
      } catch (error) {
        console.error('サムネイル画像の読み込みに失敗しました:', error)
      }
    }

    // 前の画像URLをクリア
    setImageSrc('')

    loadImage()

    return () => {
      mounted = false
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [projectId, slide.id, slide.currentGeneratedId])

  const isEdited = slide.currentGeneratedId !== undefined

  return (
    <Link
      to={`?slide=${index}`}
      className={`group relative block transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2'
          : 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2'
      }`}
    >
      <div className="relative aspect-video overflow-hidden rounded-md bg-white shadow-sm">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`Slide ${index + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100">
            <span className="text-xs text-slate-400">読込中...</span>
          </div>
        )}

        <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
          {index + 1}
        </div>

        {isEdited && (
          <div className="absolute top-1 right-1">
            <Badge variant="default" className="text-[10px]">
              編集済み
            </Badge>
          </div>
        )}
      </div>
    </Link>
  )
}

export function Sidebar({ projectId, slides, selectedIndex }: SidebarProps) {
  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-slate-100">
      <div className="flex h-8 items-center border-b border-slate-200 bg-white px-3">
        <h2 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
          スライド一覧 ({slides.length})
        </h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {slides.map((slide, index) => (
          <SlideThumbnail
            key={slide.id}
            projectId={projectId}
            slide={slide}
            index={index}
            isSelected={index === selectedIndex}
          />
        ))}
      </div>
    </div>
  )
}
