/**
 * PPTX一括エクスポートパネル
 *
 * Martin Fowlerのリファクタリング手法を適用:
 * - Extract Function: ヘルパー関数を helpers.ts に分離
 * - Extract Component: UI部品を小さなコンポーネントに分割
 * - Extract Hook: ビジネスロジックを use-pptx-export.ts に分離
 *
 * 各コンポーネントは単一責務を持ち、機能的凝集を実現
 */
import type { Slide } from '~/lib/types'
import { ErrorBanner } from './error-banner'
import { ExportButton } from './export-button'
import { JobCompleted, JobProgress } from './job-progress'
import { RunHistoryList } from './run-history-list'
import { usePptxExport } from './use-pptx-export'

interface PptxBatchExportPanelProps {
  projectId: string
  projectName: string
  slides: Slide[]
}

export function PptxBatchExportPanel({
  projectId,
  projectName,
  slides,
}: PptxBatchExportPanelProps) {
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

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex h-8 items-center justify-between border-b border-slate-200 bg-white px-3">
        <h3 className="text-xs font-semibold text-slate-700">
          PPTX一括エクスポート
        </h3>
        <span className="text-[10px] text-slate-400">
          {slideCount}枚 / 推定{costDisplay}
        </span>
      </div>

      {/* エラー表示 */}
      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      {/* 実行中のジョブ */}
      {isPending && <JobProgress progress={progress} />}

      {/* 完了時のダウンロードボタン */}
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

      {/* 過去の生成履歴 */}
      <RunHistoryList
        runs={runs}
        isLoading={isLoadingRuns}
        exchangeRate={exchangeRate}
        onDownload={handleDownload}
        onRetry={handleRetry}
        onDelete={handleDelete}
      />
    </div>
  )
}
