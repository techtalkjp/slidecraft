import { useDurably, useJob, useRuns } from '@coji/durably-react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileDown,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import { batchPptxExportJob, type BatchPptxExportOutput } from '~/jobs'
import { getApiKey } from '~/lib/api-settings.client'
import {
  calculateBatchPptxCost,
  formatCostJPY,
  getExchangeRate,
} from '~/lib/cost-calculator'
import { readFile } from '~/lib/storage.client'
import type { Slide } from '~/lib/types'

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
  const apiKey = getApiKey()
  const { durably } = useDurably()
  const [error, setError] = useState<string | null>(null)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)

  // 現在のジョブ状態
  const pptxJob = useJob(batchPptxExportJob)

  // 過去のジョブ履歴（10件） - jobDefinition を渡すと型安全
  const { runs, isLoading: isLoadingRuns } = useRuns(batchPptxExportJob, {
    pageSize: 10,
  })

  // 為替レート取得
  useEffect(() => {
    let mounted = true
    getExchangeRate().then((rate) => {
      if (mounted) setExchangeRate(rate)
    })
    return () => {
      mounted = false
    }
  }, [])

  // ジョブエラー時
  useEffect(() => {
    if (pptxJob.error) {
      setError(pptxJob.error)
    }
  }, [pptxJob.error])

  // コスト推定
  const costEstimate = calculateBatchPptxCost(slides.length)
  const costDisplay = exchangeRate
    ? formatCostJPY(costEstimate.totalCost, exchangeRate)
    : `$${costEstimate.totalCost.toFixed(3)}`

  // PPTX 一括エクスポート開始
  const handleExport = async () => {
    if (!apiKey) {
      setError('PPTX エクスポートには API キーが必要です')
      return
    }
    setError(null)

    await pptxJob.trigger({
      projectId,
      projectName,
      slides,
      apiKey,
    })
  }

  // ダウンロード処理
  const handleDownload = async (output: BatchPptxExportOutput) => {
    try {
      const blob = await readFile(output.opfsPath)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = output.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PPTXダウンロードエラー:', err)
      setError('PPTXのダウンロードに失敗しました')
    }
  }

  // 再試行
  const handleRetry = async (runId: string) => {
    try {
      await durably.retry(runId)
    } catch (err) {
      console.error('再試行エラー:', err)
      setError('再試行に失敗しました')
    }
  }

  // 削除
  const handleDelete = async (runId: string) => {
    try {
      await durably.deleteRun(runId)
    } catch (err) {
      console.error('削除エラー:', err)
      setError('削除に失敗しました')
    }
  }

  // ステータスに応じたアイコン
  const getStatusIcon = (
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
  ) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-slate-400" />
      default:
        return null
    }
  }

  // 日時フォーマット
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Run からスライド数を取得
  const getSlideCount = (run: (typeof runs)[number]): number => {
    return run.payload?.slides?.length ?? 0
  }

  // Run からコストを計算
  const getRunCost = (run: (typeof runs)[number]): string => {
    const slideCount = getSlideCount(run)
    if (slideCount === 0) return '-'
    const cost = calculateBatchPptxCost(slideCount)
    return exchangeRate
      ? formatCostJPY(cost.totalCost, exchangeRate)
      : `$${cost.totalCost.toFixed(3)}`
  }

  const isPending = pptxJob.isPending || pptxJob.isRunning

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex h-8 items-center justify-between border-b border-slate-200 bg-white px-3">
        <h3 className="text-xs font-semibold text-slate-700">
          PPTX一括エクスポート
        </h3>
        <span className="text-[10px] text-slate-400">
          {slides.length}枚 / 推定{costDisplay}
        </span>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <XCircle className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* 実行中のジョブ */}
      {isPending && (
        <div className="border-b border-slate-100 bg-blue-50 px-3 py-3">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="flex-1">
              {pptxJob.progress?.message || '処理中...'}
              {pptxJob.progress && (
                <span className="ml-1 text-blue-500">
                  ({pptxJob.progress.current}/{pptxJob.progress.total})
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* 完了時のダウンロードボタン */}
      {pptxJob.isCompleted && pptxJob.output && (
        <div className="border-b border-slate-100 bg-emerald-50 px-3 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="flex-1 text-sm text-emerald-700">生成完了</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-emerald-300 bg-white text-emerald-600 hover:bg-emerald-50"
              onClick={() => handleDownload(pptxJob.output!)}
            >
              <Download className="mr-1 h-3 w-3" />
              ダウンロード
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-slate-400 hover:text-slate-600"
              onClick={() => pptxJob.reset()}
            >
              閉じる
            </Button>
          </div>
        </div>
      )}

      {/* 生成ボタン */}
      {!isPending && !pptxJob.isCompleted && (
        <div className="p-3">
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-md bg-linear-to-r from-violet-500 via-fuchsia-500 to-pink-500 opacity-75 blur-sm transition-all duration-500 group-hover:opacity-100 group-hover:blur-md" />
            <Button
              onClick={handleExport}
              disabled={!apiKey}
              className="relative w-full bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              size="sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              全スライドをPPTX生成
            </Button>
          </div>
          {!apiKey && (
            <p className="mt-2 text-center text-[10px] text-slate-400">
              APIキーを設定してください
            </p>
          )}
        </div>
      )}

      {/* 過去の生成履歴 */}
      <div className="flex h-8 items-center border-t border-b border-slate-200 bg-slate-50 px-3">
        <h4 className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
          過去の生成
        </h4>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {isLoadingRuns ? (
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
              <div key={run.id} className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(run.status)}
                  <span className="flex-1 text-xs text-slate-600">
                    {formatDateTime(run.createdAt)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {getSlideCount(run)}枚
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {getRunCost(run)}
                  </span>
                </div>

                {run.status === 'completed' && run.output && (
                  <div className="mt-1 flex items-center gap-1 pl-6">
                    <FileDown className="h-3 w-3 text-slate-400" />
                    <span className="flex-1 truncate text-[10px] text-slate-500">
                      {run.output.fileName}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] text-emerald-600 hover:text-emerald-700"
                      onClick={() => run.output && handleDownload(run.output)}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      DL
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1 text-slate-400 hover:text-red-500"
                      onClick={() => handleDelete(run.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* 失敗時のアクション */}
                {run.status === 'failed' && (
                  <div className="mt-1 flex items-center gap-1 pl-6">
                    <span className="flex-1 truncate text-[10px] text-red-500">
                      {run.error || 'エラーが発生しました'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-700"
                      onClick={() => handleRetry(run.id)}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      再試行
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1 text-slate-400 hover:text-red-500"
                      onClick={() => handleDelete(run.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* キャンセル済みの削除ボタン */}
                {run.status === 'cancelled' && (
                  <div className="mt-1 flex items-center justify-end pl-6">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1 text-slate-400 hover:text-red-500"
                      onClick={() => handleDelete(run.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
