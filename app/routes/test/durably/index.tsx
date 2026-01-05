/**
 * Durably テストページ
 *
 * ブラウザ上で Durably (SQLite ベースのワークフローエンジン) を試すためのテストルート
 * クライアントサイドのみで動作
 *
 * 外部リソース: SQLocal (OPFS SQLite), Durably ワークフローエンジン
 */
import { DurablyProvider, useJob } from '@coji/durably-react'
import { Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { durablyPromise, testMultiStepJob } from '~/jobs'

export default function DurablyTestPage() {
  return (
    <DurablyProvider
      durably={durablyPromise}
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      }
    >
      <DurablyTestContent />
    </DurablyProvider>
  )
}

function DurablyTestContent() {
  const {
    trigger,
    status,
    output,
    error,
    logs,
    isRunning,
    isPending,
    isCompleted,
  } = useJob(testMultiStepJob)

  const isReady = !isRunning && !isPending

  const handleRun = async () => {
    if (!isReady) return
    await trigger({ count: 3 })
  }

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
                !status
                  ? 'bg-slate-300'
                  : isRunning
                    ? 'animate-pulse bg-blue-500'
                    : error
                      ? 'bg-red-500'
                      : 'bg-emerald-500'
              }`}
            />
            <span className="text-sm">
              {!status && '準備完了'}
              {isPending && '待機中...'}
              {isRunning && '実行中'}
              {isCompleted && '完了'}
              {error && 'エラー'}
            </span>
          </div>

          {/* 実行ボタン */}
          <Button onClick={handleRun} disabled={!isReady}>
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
          {output && (
            <div className="rounded-md bg-emerald-50 p-4">
              <p className="mb-2 font-medium text-emerald-800">
                完了: {output.total} ステップ
              </p>
              <ul className="space-y-1 text-sm text-emerald-700">
                {output.steps.map((step, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 追記専用配列のため安全
                  <li key={idx}>• {step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* エラー */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* ログ */}
          <div className="rounded-md bg-slate-900 p-4">
            <p className="mb-2 text-sm font-medium text-slate-400">ログ</p>
            <div className="max-h-48 space-y-1 overflow-y-auto font-mono text-xs text-slate-300">
              {logs.length === 0 ? (
                <p className="text-slate-500">ログなし</p>
              ) : (
                logs.map((log, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 追記専用配列のため安全
                  <div key={idx}>
                    [{log.level}] {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
