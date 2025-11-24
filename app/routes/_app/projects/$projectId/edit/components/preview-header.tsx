import { AlertCircle, RotateCcw } from 'lucide-react'
import { useFetcher } from 'react-router'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import type { clientAction } from '../+actions'

interface PreviewHeaderProps {
  slideNumber: number
  totalSlides: number
  isEdited: boolean
  slideId: string
}

/**
 * プレビューヘッダーコンポーネント
 *
 * スライド番号の表示と「元に戻す」ボタンを提供
 * useFetcherを使用してページ遷移なしでリセット処理を実行
 */
export function PreviewHeader({
  slideNumber,
  totalSlides,
  isEdited,
  slideId,
}: PreviewHeaderProps) {
  const fetcher = useFetcher<typeof clientAction>()

  return (
    <div className="flex flex-col border-b border-slate-200 bg-white">
      <div className="flex h-8 items-center justify-between px-4">
        <h1 className="text-xs font-semibold text-slate-800">
          スライド {slideNumber} / {totalSlides}
        </h1>

        {isEdited && (
          <fetcher.Form method="post">
            <input type="hidden" name="_action" value="resetToOriginal" />
            <input type="hidden" name="slideId" value={slideId} />

            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={fetcher.state !== 'idle'}
              className="text-sm font-medium"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              元に戻す
            </Button>
          </fetcher.Form>
        )}
      </div>

      {/* エラー表示 */}
      {fetcher.data?.error && (
        <div className="px-4 py-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fetcher.data.error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
