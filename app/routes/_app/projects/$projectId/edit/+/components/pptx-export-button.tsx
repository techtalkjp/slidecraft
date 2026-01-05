/**
 * PPTXエクスポートボタン
 *
 * ヘッダーに表示される状態付きボタン + ポップオーバーで詳細表示
 */
import {
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Loader2,
  XCircle,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import type { Slide } from '~/lib/types'
import { ErrorBanner } from './pptx-batch-export/error-banner'
import { ExportButton } from './pptx-batch-export/export-button'
import { JobCompleted, JobProgress } from './pptx-batch-export/job-progress'
import { RunHistoryList } from './pptx-batch-export/run-history-list'
import { usePptxExport } from './pptx-batch-export/use-pptx-export'

interface PptxExportButtonProps {
  projectId: string
  projectName: string
  slides: Slide[]
}

export function PptxExportButton({
  projectId,
  projectName,
  slides,
}: PptxExportButtonProps) {
  const {
    apiKey,
    error,
    exchangeRate,
    costDisplay,
    slideCount,
    isPending,
    isCompleted,
    output,
    progress,
    runs,
    isLoadingRuns,
    handleExport,
    handleDownload,
    handleRetry,
    handleDelete,
    clearError,
    resetJob,
  } = usePptxExport({ projectId, projectName, slides })

  // 完了/エラー時のトースト通知
  const prevIsCompleted = useRef(isCompleted)
  const prevError = useRef(error)

  useEffect(() => {
    // 完了時
    if (isCompleted && !prevIsCompleted.current && output) {
      toast.success('PPTX生成完了', {
        description: `${output.fileName} をダウンロードできます`,
        action: {
          label: 'ダウンロード',
          onClick: () => handleDownload(output),
        },
      })
    }
    prevIsCompleted.current = isCompleted

    // エラー時
    if (error && error !== prevError.current) {
      toast.error('PPTXエクスポートエラー', {
        description: error,
      })
    }
    prevError.current = error
  }, [isCompleted, error, output, handleDownload])

  // ボタンの表示内容を決定
  const renderButtonContent = () => {
    if (isPending) {
      return (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">PPTX生成中</span>
          {progress && (
            <span className="text-xs opacity-75">
              ({progress.current}/{progress.total})
            </span>
          )}
        </>
      )
    }

    if (isCompleted && output) {
      return (
        <>
          <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-500" />
          <span className="hidden sm:inline">PPTX完了</span>
        </>
      )
    }

    if (error) {
      return (
        <>
          <XCircle className="mr-1.5 h-4 w-4 text-red-500" />
          <span className="hidden sm:inline">エラー</span>
        </>
      )
    }

    return (
      <>
        <FileSpreadsheet className="mr-1.5 h-4 w-4" />
        <span className="hidden sm:inline">PPTX書き出し</span>
      </>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={
            isPending
              ? 'border-blue-300 bg-blue-50'
              : isCompleted
                ? 'border-emerald-300 bg-emerald-50'
                : error
                  ? 'border-red-300 bg-red-50'
                  : ''
          }
        >
          {renderButtonContent()}
          <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex flex-col">
          {/* ヘッダー */}
          <div className="flex h-10 items-center justify-between border-b border-slate-200 bg-slate-50 px-3">
            <h3 className="text-sm font-semibold text-slate-700">
              PPTX一括エクスポート
            </h3>
            <span className="text-xs text-slate-400">
              {slideCount}枚 / 推定{costDisplay}
            </span>
          </div>

          {/* エラー表示 */}
          {error && <ErrorBanner message={error} onDismiss={clearError} />}

          {/* 実行中 */}
          {isPending && <JobProgress progress={progress} />}

          {/* 完了時 */}
          {isCompleted && output && (
            <JobCompleted
              output={output}
              onDownload={handleDownload}
              onClose={resetJob}
            />
          )}

          {/* 生成ボタン */}
          {!isPending && !isCompleted && (
            <ExportButton
              onClick={handleExport}
              disabled={!apiKey}
              showApiKeyWarning={!apiKey}
            />
          )}

          {/* 履歴 */}
          <RunHistoryList
            runs={runs}
            isLoading={isLoadingRuns}
            exchangeRate={exchangeRate}
            onDownload={handleDownload}
            onRetry={handleRetry}
            onDelete={handleDelete}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
