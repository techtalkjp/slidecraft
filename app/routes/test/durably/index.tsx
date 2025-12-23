/**
 * Durably テストページ
 *
 * ブラウザ上で Durably (SQLite ベースのワークフローエンジン) を試すためのテストルート
 * クライアントサイドのみで動作
 *
 * 外部リソース: SQLocal (OPFS SQLite), Durably ワークフローエンジン
 */
import { Loader2 } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useDurably } from './+/hooks'
import { testJob } from './+/jobs'

export default function DurablyTestPage() {
  const { state, setState, addLog } = useDurably()
  const runningRef = useRef(false)

  const runJob = useCallback(async () => {
    if (runningRef.current || state.status !== 'ready') return

    runningRef.current = true
    setState((prev) => ({
      ...prev,
      result: null,
      error: null,
    }))

    try {
      addLog('Starting job with count: 3')
      const { output } = await testJob.triggerAndWait({ count: 3 })

      setState((prev) => ({
        ...prev,
        status: 'ready',
        result: output,
      }))
      addLog(`Total steps: ${output.total}`)
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'ready',
        error: err instanceof Error ? err.message : 'Job failed',
      }))
      addLog(`Job error: ${err}`)
    } finally {
      runningRef.current = false
    }
  }, [state.status, setState, addLog])

  const isReady = state.status === 'ready' || state.status === 'completed'
  const isRunning = state.status === 'running'

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>Durably テスト</CardTitle>
          <CardDescription>
            ブラウザ上で SQLite ベースのワークフローエンジンを試します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ステータス */}
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                state.status === 'init'
                  ? 'bg-slate-300'
                  : state.status === 'running'
                    ? 'animate-pulse bg-blue-500'
                    : state.status === 'failed'
                      ? 'bg-red-500'
                      : 'bg-emerald-500'
              }`}
            />
            <span className="text-sm">
              {state.status === 'init' && '初期化中...'}
              {state.status === 'ready' && '準備完了'}
              {state.status === 'running' && `実行中: ${state.currentStep}`}
              {state.status === 'completed' && '完了'}
              {state.status === 'failed' && 'エラー'}
            </span>
          </div>

          {/* 実行ボタン */}
          <Button onClick={runJob} disabled={!isReady || isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                実行中...
              </>
            ) : (
              'ジョブを実行'
            )}
          </Button>

          {/* 結果 */}
          {state.result && (
            <div className="rounded-md bg-emerald-50 p-4">
              <p className="mb-2 font-medium text-emerald-800">
                完了: {state.result.total} ステップ
              </p>
              <ul className="space-y-1 text-sm text-emerald-700">
                {state.result.steps.map((step, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 追記専用配列のため安全
                  <li key={idx}>• {step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* エラー */}
          {state.error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-red-800">{state.error}</p>
            </div>
          )}

          {/* ログ */}
          <div className="rounded-md bg-slate-900 p-4">
            <p className="mb-2 text-sm font-medium text-slate-400">ログ</p>
            <div className="max-h-48 space-y-1 overflow-y-auto font-mono text-xs text-slate-300">
              {state.logs.length === 0 ? (
                <p className="text-slate-500">ログなし</p>
              ) : (
                state.logs.map((log, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 追記専用配列のため安全
                  <div key={idx}>{log}</div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
