import { Check, Loader2 } from 'lucide-react'
import type { Slide } from '~/lib/types'

interface CandidateImagesGridProps {
  slide: Slide
  candidateImages: Map<string, string | null>
  originalImage: string | null
  isGenerating: boolean
  loadOriginalImage: () => Promise<void>
  loadCandidateImage: (generatedId: string) => Promise<void>
  onSelectCandidate: (generatedId: string | null) => Promise<void>
}

/**
 * 候補画像グリッドコンポーネント
 *
 * オリジナル画像と生成された候補画像を表示し、ユーザーが選択できるようにする
 */
export function CandidateImagesGrid({
  slide,
  candidateImages,
  originalImage,
  isGenerating,
  loadOriginalImage,
  loadCandidateImage,
  onSelectCandidate,
}: CandidateImagesGridProps) {
  // 候補がない場合は何も表示しない
  if (slide.generatedCandidates.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-700">修正候補を選択</div>
      <div className="grid grid-cols-2 gap-2">
        {/* オリジナル画像 */}
        <button
          type="button"
          onClick={() => onSelectCandidate(null)}
          disabled={isGenerating}
          onMouseEnter={loadOriginalImage}
          className={`relative aspect-video overflow-hidden rounded-md border-2 transition-all ${
            !slide.currentGeneratedId
              ? 'border-blue-500 ring-2 ring-blue-200'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          {originalImage ? (
            <img
              src={originalImage}
              alt="オリジナル"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          )}

          <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            オリジナル
          </div>

          {!slide.currentGeneratedId && (
            <div className="absolute top-1 right-1 rounded-full bg-blue-500 p-1">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </button>

        {/* 生成された候補 */}
        {slide.generatedCandidates.map((candidate) => {
          const isApplied = slide.currentGeneratedId === candidate.id
          const imageUrl = candidateImages.get(candidate.id)

          // 画像を遅延読み込み
          if (!candidateImages.has(candidate.id)) {
            loadCandidateImage(candidate.id)
          }

          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onSelectCandidate(candidate.id)}
              disabled={isGenerating}
              className={`relative aspect-video overflow-hidden rounded-md border-2 transition-all ${
                isApplied
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`候補 ${candidate.id}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              )}

              {isApplied && (
                <div className="absolute top-1 right-1 rounded-full bg-blue-500 p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
