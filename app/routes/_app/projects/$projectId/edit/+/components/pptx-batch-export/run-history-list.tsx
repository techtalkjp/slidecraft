/**
 * ジョブ履歴リスト
 *
 * 単一責務: 過去のジョブ履歴一覧を表示
 */
import { Loader2 } from 'lucide-react'
import type { BatchPptxExportInput, BatchPptxExportOutput } from '~/jobs'
import { RunHistoryItem } from './run-history-item'
import type { RunStatus } from './run-status-icon'

interface Run {
  id: string
  status: RunStatus
  createdAt: string
  error?: string | null
  output?: BatchPptxExportOutput | null
  payload?: BatchPptxExportInput | null
}

interface RunHistoryListProps {
  runs: Run[]
  isLoading: boolean
  exchangeRate: number | null
  onDownload: (output: BatchPptxExportOutput) => void
  onRetry: (runId: string) => void
  onDelete: (runId: string) => void
}

export function RunHistoryList({
  runs,
  isLoading,
  exchangeRate,
  onDownload,
  onRetry,
  onDelete,
}: RunHistoryListProps) {
  return (
    <>
      {/* ヘッダー */}
      <div className="flex h-8 items-center border-t border-b border-slate-200 bg-slate-50 px-3">
        <h4 className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
          過去の生成
        </h4>
      </div>

      {/* リスト */}
      <div className="max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        ) : runs.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            履歴がありません
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {runs.map((run) => (
              <RunHistoryItem
                key={run.id}
                run={run}
                exchangeRate={exchangeRate}
                onDownload={onDownload}
                onRetry={onRetry}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
