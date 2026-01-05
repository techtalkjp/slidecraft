/**
 * ジョブ履歴アイテム
 *
 * 単一責務: 1つのジョブ履歴を表示し、ステータスに応じたアクションを提供
 */
import { AlertTriangle, Download, FileDown, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { BatchPptxExportInput, BatchPptxExportOutput } from '~/jobs'
import { formatCostJPY } from '~/lib/cost-calculator'
import { formatDateTime } from './helpers'
import { RunStatusIcon, type RunStatus } from './run-status-icon'

interface RunHistoryItemProps {
  run: {
    id: string
    status: RunStatus
    createdAt: string
    error?: string | null
    output?: BatchPptxExportOutput | null
    payload?: BatchPptxExportInput | null
  }
  exchangeRate: number | null
  onDownload: (output: BatchPptxExportOutput) => void
  onRetry: (runId: string) => void
  onDelete: (runId: string) => void
}

export function RunHistoryItem({
  run,
  exchangeRate,
  onDownload,
  onRetry,
  onDelete,
}: RunHistoryItemProps) {
  const slideCount = run.payload?.slides?.length ?? 0
  const actualCostUsd = run.output?.actualCostUsd

  // 実績コストのみ表示（なければ「-」）
  const costDisplay =
    actualCostUsd !== undefined && actualCostUsd > 0
      ? exchangeRate
        ? formatCostJPY(actualCostUsd, exchangeRate)
        : `$${actualCostUsd.toFixed(3)}`
      : '-'

  return (
    <div className="px-3 py-2">
      {/* ヘッダー行 */}
      <div className="flex items-center gap-2">
        <RunStatusIcon status={run.status} />
        <span className="flex-1 text-xs text-slate-600">
          {formatDateTime(run.createdAt)}
        </span>
        <span className="text-[10px] text-slate-400">{slideCount}枚</span>
        <span className="text-[10px] text-slate-400">{costDisplay}</span>
      </div>

      {/* ステータス別アクション */}
      <RunActions
        run={run}
        onDownload={onDownload}
        onRetry={onRetry}
        onDelete={onDelete}
      />
    </div>
  )
}

/**
 * ステータス別アクションボタン
 */
function RunActions({
  run,
  onDownload,
  onRetry,
  onDelete,
}: Pick<RunHistoryItemProps, 'run' | 'onDownload' | 'onRetry' | 'onDelete'>) {
  const output = run.output
  if (run.status === 'completed' && output) {
    const failedSlides = output.failedSlides ?? []
    const hasFailedSlides = failedSlides.length > 0
    return (
      <div className="mt-1 space-y-1 pl-6">
        {/* 部分的成功の警告 */}
        {hasFailedSlides && (
          <div className="flex items-start gap-1 rounded bg-amber-50 px-2 py-1">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
            <div className="text-[10px] text-amber-700">
              <span className="font-medium">
                {failedSlides.length}枚のスライドが失敗
              </span>
              <ul className="mt-0.5 list-inside list-disc">
                {failedSlides.map((f) => (
                  <li key={f.slideId} className="truncate">
                    スライド{f.slideNumber}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {/* ファイル情報とアクション */}
        <div className="flex items-center gap-1">
          <FileDown className="h-3 w-3 text-slate-400" />
          <span className="flex-1 truncate text-[10px] text-slate-500">
            {output.fileName}
            {hasFailedSlides && (
              <span className="ml-1 text-amber-600">
                ({output.successfulSlides}/{output.totalSlides}枚)
              </span>
            )}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-emerald-600 hover:text-emerald-700"
            onClick={() => onDownload(output)}
          >
            <Download className="mr-1 h-3 w-3" />
            DL
          </Button>
          <DeleteButton onClick={() => onDelete(run.id)} />
        </div>
      </div>
    )
  }

  if (run.status === 'failed') {
    return (
      <div className="mt-1 flex items-center gap-1 pl-6">
        <span className="flex-1 truncate text-[10px] text-red-500">
          {run.error || 'エラーが発生しました'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-700"
          onClick={() => onRetry(run.id)}
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          再試行
        </Button>
        <DeleteButton onClick={() => onDelete(run.id)} />
      </div>
    )
  }

  if (run.status === 'cancelled') {
    return (
      <div className="mt-1 flex items-center justify-end pl-6">
        <DeleteButton onClick={() => onDelete(run.id)} />
      </div>
    )
  }

  return null
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-6 px-1 text-slate-400 hover:text-red-500"
      onClick={onClick}
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  )
}
