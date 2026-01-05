/**
 * ジョブ進捗表示
 *
 * 単一責務: 実行中ジョブの進捗と完了状態を表示
 */
import { CheckCircle2, Download, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { BatchPptxExportOutput } from '~/jobs'

interface JobProgressProps {
  progress: { current: number; total?: number; message?: string } | null
}

export function JobProgress({ progress }: JobProgressProps) {
  return (
    <div className="border-b border-slate-100 bg-blue-50 px-3 py-3">
      <div className="flex items-center gap-2 text-sm text-blue-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="flex-1">
          {progress?.message || '処理中...'}
          {progress && (
            <span className="ml-1 text-blue-500">
              ({progress.current}/{progress.total})
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

interface JobCompletedProps {
  output: BatchPptxExportOutput
  onDownload: (output: BatchPptxExportOutput) => void
  onClose: () => void
}

export function JobCompleted({
  output,
  onDownload,
  onClose,
}: JobCompletedProps) {
  return (
    <div className="border-b border-slate-100 bg-emerald-50 px-3 py-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span className="flex-1 text-sm text-emerald-700">生成完了</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-emerald-300 bg-white text-emerald-600 hover:bg-emerald-50"
          onClick={() => onDownload(output)}
        >
          <Download className="mr-1 h-3 w-3" />
          ダウンロード
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-slate-400 hover:text-slate-600"
          onClick={onClose}
        >
          閉じる
        </Button>
      </div>
    </div>
  )
}
