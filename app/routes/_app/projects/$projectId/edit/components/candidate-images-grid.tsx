import { AlertCircle, Check, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '~/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import type { Slide } from '~/lib/types'
import type { clientAction } from '../+actions'

interface CandidateImagesGridProps {
  slide: Slide
  candidateImages: Map<string, string | null>
  originalImage: string | null
  isGenerating: boolean
  loadOriginalImage: () => Promise<void>
  loadCandidateImage: (generatedId: string) => Promise<void>
}

/**
 * 候補画像グリッドコンポーネント
 *
 * オリジナル画像と生成された候補画像を表示し、ユーザーが選択できるようにする
 * useFetcherを使用してページ遷移なしで候補を適用
 */
export function CandidateImagesGrid({
  slide,
  candidateImages,
  originalImage,
  isGenerating,
  loadOriginalImage,
  loadCandidateImage,
}: CandidateImagesGridProps) {
  const fetcher = useFetcher<typeof clientAction>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // 削除成功時のtoast表示
  // External system: toast notification
  useEffect(() => {
    if (
      fetcher.data &&
      'deletedId' in fetcher.data &&
      fetcher.state === 'idle'
    ) {
      toast.success('候補を削除しました', {
        description: '候補画像が正常に削除されました。',
      })
    }
  }, [fetcher.data, fetcher.state])

  // 候補がない場合は何も表示しない
  if (slide.generatedCandidates.length === 0) {
    return null
  }

  const isSubmitting = fetcher.state === 'submitting'

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-700">修正候補を選択</div>

      <div className="grid grid-cols-2 gap-2">
        {/* オリジナル画像 */}
        <fetcher.Form method="post">
          <input type="hidden" name="_action" value="selectCandidate" />
          <input type="hidden" name="slideId" value={slide.id} />
          <input type="hidden" name="generatedId" value="" />

          <button
            type="submit"
            disabled={isGenerating || isSubmitting}
            onMouseEnter={loadOriginalImage}
            className={`relative aspect-video w-full overflow-hidden rounded-md border-2 transition-all ${
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
        </fetcher.Form>

        {/* 生成された候補 */}
        {slide.generatedCandidates.map((candidate) => {
          const isApplied = slide.currentGeneratedId === candidate.id
          const imageUrl = candidateImages.get(candidate.id)

          // 画像を遅延読み込み
          if (!candidateImages.has(candidate.id)) {
            loadCandidateImage(candidate.id)
          }

          return (
            <div key={candidate.id} className="group relative">
              <fetcher.Form method="post">
                <input type="hidden" name="_action" value="selectCandidate" />
                <input type="hidden" name="slideId" value={slide.id} />
                <input type="hidden" name="generatedId" value={candidate.id} />

                <button
                  type="submit"
                  disabled={isGenerating || isSubmitting}
                  className={`relative aspect-video w-full overflow-hidden rounded-md border-2 transition-all ${
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
              </fetcher.Form>

              {/* 削除ボタン */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 bottom-1 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteTarget(candidate.id)
                }}
                disabled={isGenerating || isSubmitting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )
        })}
      </div>

      {/* エラー表示 */}
      {fetcher.data?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fetcher.data.error}</AlertDescription>
        </Alert>
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>候補を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。候補画像が完全に削除されます。
              {slide.currentGeneratedId === deleteTarget && (
                <>
                  <br />
                  <br />
                  この候補は現在適用中です。削除するとオリジナル画像に戻ります。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  const formData = new FormData()
                  formData.set('_action', 'deleteCandidate')
                  formData.set('slideId', slide.id)
                  formData.set('generatedId', deleteTarget)
                  fetcher.submit(formData, { method: 'post' })
                  setDeleteTarget(null)
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
