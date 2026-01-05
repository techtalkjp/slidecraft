/**
 * PPTXエクスポート用カスタムフック
 *
 * 単一責務: PPTXエクスポートのビジネスロジックをカプセル化
 */
import { useDurably, useJob, useRuns } from '@coji/durably-react'
import { useCallback, useEffect, useState } from 'react'
import { batchPptxExportJob, type BatchPptxExportOutput } from '~/jobs'
import { getApiKey } from '~/lib/api-settings.client'
import {
  calculateBatchPptxCost,
  formatCostJPY,
  getExchangeRate,
} from '~/lib/cost-calculator'
import type { Slide } from '~/lib/types'
import { downloadPptxFromOpfs } from './helpers'

interface UsePptxExportOptions {
  projectId: string
  projectName: string
  slides: Slide[]
}

export function usePptxExport({
  projectId,
  projectName,
  slides,
}: UsePptxExportOptions) {
  const apiKey = getApiKey()
  const { durably } = useDurably()
  // ローカルエラー（APIキー不足、ダウンロード失敗など）のみ管理
  // ジョブエラーは pptxJob.error を直接参照
  const [localError, setLocalError] = useState<string | null>(null)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)

  // 現在のジョブ状態
  const pptxJob = useJob(batchPptxExportJob)

  // 過去のジョブ履歴（10件）
  const { runs, isLoading: isLoadingRuns } = useRuns(batchPptxExportJob, {
    pageSize: 10,
  })

  // 外部API: 為替レートAPI (exchangerate-api.com) と同期
  useEffect(() => {
    let mounted = true
    getExchangeRate().then((rate) => {
      if (mounted) setExchangeRate(rate)
    })
    return () => {
      mounted = false
    }
  }, [])

  // コスト推定
  const costEstimate = calculateBatchPptxCost(slides.length)
  const costDisplay = exchangeRate
    ? formatCostJPY(costEstimate.totalCost, exchangeRate)
    : `$${costEstimate.totalCost.toFixed(3)}`

  // エクスポート開始
  const handleExport = useCallback(async () => {
    if (!apiKey) {
      setLocalError('PPTX エクスポートには API キーが必要です')
      return
    }
    setLocalError(null)
    await pptxJob.trigger({ projectId, projectName, slides, apiKey })
  }, [apiKey, projectId, projectName, slides, pptxJob])

  // ダウンロード
  const handleDownload = useCallback(
    async (output: BatchPptxExportOutput) => {
      try {
        await downloadPptxFromOpfs(output)
      } catch (err) {
        console.error('PPTXダウンロードエラー:', err)
        const message =
          err instanceof Error ? err.message : 'PPTXのダウンロードに失敗しました'
        setLocalError(message)
      }
    },
    [],
  )

  // 再試行
  const handleRetry = useCallback(
    async (runId: string) => {
      try {
        await durably.retry(runId)
      } catch (err) {
        console.error('再試行エラー:', err)
        const message =
          err instanceof Error ? err.message : '再試行に失敗しました'
        setLocalError(message)
      }
    },
    [durably],
  )

  // 削除
  const handleDelete = useCallback(
    async (runId: string) => {
      try {
        await durably.deleteRun(runId)
      } catch (err) {
        console.error('削除エラー:', err)
        const message =
          err instanceof Error ? err.message : '削除に失敗しました'
        setLocalError(message)
      }
    },
    [durably],
  )

  // エラークリア（ローカルエラーのみ。ジョブエラーはresetJobで消える）
  const clearError = useCallback(() => setLocalError(null), [])

  // ジョブリセット
  const resetJob = useCallback(() => pptxJob.reset(), [pptxJob])

  const isPending = pptxJob.isPending || pptxJob.isRunning

  // ローカルエラーとジョブエラーを統合（ローカルエラー優先）
  const error = localError ?? pptxJob.error ?? null

  return {
    // 状態
    apiKey,
    error,
    exchangeRate,
    costDisplay,
    slideCount: slides.length,
    isPending,
    isCompleted: pptxJob.isCompleted,
    output: pptxJob.output,
    progress: pptxJob.progress,
    runs,
    isLoadingRuns,
    // アクション
    handleExport,
    handleDownload,
    handleRetry,
    handleDelete,
    clearError,
    resetJob,
  }
}
