/**
 * Durably テストページ
 *
 * ブラウザ上で Durably (SQLite ベースのワークフローエンジン) を試すためのテストルート
 * クライアントサイドのみで動作
 *
 * 外部リソース: SQLocal (OPFS SQLite), Durably ワークフローエンジン
 */
import { createDurably, defineJob, type Run } from '@coji/durably'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SQLocalKysely } from 'sqlocal/kysely'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

// ジョブの出力スキーマ
const jobOutputSchema = z.object({
  steps: z.array(z.string()),
  total: z.number(),
})
type JobOutput = z.infer<typeof jobOutputSchema>

// テスト用ジョブを定義（モジュールレベル）
const testJobDef = defineJob({
  name: 'test-multi-step',
  input: z.object({ count: z.number() }),
  output: jobOutputSchema,
  run: async (step, payload) => {
    const steps: string[] = []

    // ステップ1: 初期化
    const initResult = await step.run('initialize', async () => {
      await sleep(1000)
      return `Initialized with count: ${payload.count}`
    })
    steps.push(initResult)

    // ステップ2: カウントアップ（複数回）
    for (let i = 1; i <= payload.count; i++) {
      const result = await step.run(`count-${i}`, async () => {
        await sleep(500)
        return `Step ${i} completed`
      })
      steps.push(result)
    }

    // ステップ3: 完了処理
    const finalResult = await step.run('finalize', async () => {
      await sleep(500)
      return `Finalized at ${new Date().toISOString()}`
    })
    steps.push(finalResult)

    return { steps, total: steps.length }
  },
})

// Durably インスタンス（シングルトン）
let durablyInstance: ReturnType<typeof createDurably> | null = null
let testJobHandle: ReturnType<
  ReturnType<typeof createDurably>['register']
> | null = null
let initPromise: Promise<void> | null = null

function getDurably() {
  if (!durablyInstance) {
    const { dialect } = new SQLocalKysely('durably-test.sqlite3')
    durablyInstance = createDurably({
      dialect,
      pollingInterval: 100,
      heartbeatInterval: 500,
      staleThreshold: 3000,
    })

    // ジョブを登録
    testJobHandle = durablyInstance.register(testJobDef)

    // マイグレーションを一度だけ実行
    initPromise = durablyInstance.migrate()
  }

  if (!testJobHandle) {
    throw new Error('testJob is not initialized')
  }

  return { durably: durablyInstance, testJob: testJobHandle, initPromise }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Durably 初期化フック (StrictMode 対応)
 */
function useDurably() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const { durably, initPromise } = getDurably()
        await initPromise

        if (cancelled) return

        durably.start()
        setReady(true)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to initialize')
        }
      }
    }

    init()

    return () => {
      cancelled = true
      if (durablyInstance) {
        durablyInstance.stop()
      }
    }
  }, [])

  return { ready, error }
}

/**
 * イベントログ購読フック
 */
function useEventLogs() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ])
  }, [])

  useEffect(() => {
    const { durably } = getDurably()

    const unsubscribers = [
      durably.on('run:start', (event) => {
        addLog(`Run started: ${event.runId}`)
      }),
      durably.on('step:start', (event) => {
        addLog(`Step started: ${event.stepName}`)
      }),
      durably.on('step:complete', (event) => {
        addLog(`Step completed: ${event.stepName}`)
      }),
      durably.on('run:complete', (event) => {
        addLog(`Run completed: ${event.runId}`)
      }),
      durably.on('run:fail', (event) => {
        addLog(`Run failed: ${event.error}`)
      }),
    ]

    return () => {
      for (const unsub of unsubscribers) {
        unsub()
      }
    }
  }, [addLog])

  return { logs, addLog }
}

export default function DurablyTestPage() {
  const { ready, error: initError } = useDurably()
  const { logs, addLog } = useEventLogs()

  const [running, setRunning] = useState(false)
  const [currentRun, setCurrentRun] = useState<Run | null>(null)
  const [result, setResult] = useState<JobOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  // running 状態を ref で保持（useCallback の依存を避ける）
  const runningRef = useRef(running)
  runningRef.current = running

  const runJob = useCallback(async () => {
    if (runningRef.current) return

    setRunning(true)
    setResult(null)
    setError(null)
    setCurrentRun(null)

    try {
      const { testJob } = getDurably()
      addLog('Starting job with count: 3')

      const { id, output } = await testJob.triggerAndWait({ count: 3 })
      addLog(`Job completed: ${id}`)

      // 実行情報を取得
      const run = await testJob.getRun(id)
      setCurrentRun(run)

      // zod で型安全に変換
      const parsedOutput = jobOutputSchema.parse(output)
      setResult(parsedOutput)
      addLog(`Total steps: ${parsedOutput.total}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Job failed')
      addLog(`Job error: ${err}`)
    } finally {
      setRunning(false)
    }
  }, [addLog])

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
              className={`h-3 w-3 rounded-full ${ready ? 'bg-emerald-500' : 'bg-slate-300'}`}
            />
            <span className="text-sm">
              {ready ? '初期化完了' : '初期化中...'}
            </span>
          </div>

          {/* 初期化エラー */}
          {initError && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-red-800">初期化エラー: {initError}</p>
            </div>
          )}

          {/* 実行ボタン */}
          <Button onClick={runJob} disabled={!ready || running}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                実行中...
              </>
            ) : (
              'ジョブを実行'
            )}
          </Button>

          {/* 現在の実行情報 */}
          {currentRun && (
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm font-medium">実行ID: {currentRun.id}</p>
              <p className="text-sm text-slate-600">
                ステータス: {currentRun.status}
              </p>
            </div>
          )}

          {/* 結果 */}
          {result && (
            <div className="rounded-md bg-emerald-50 p-4">
              <p className="mb-2 font-medium text-emerald-800">
                完了: {result.total} ステップ
              </p>
              <ul className="space-y-1 text-sm text-emerald-700">
                {result.steps.map((step) => (
                  <li key={step}>• {step}</li>
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
                logs.map((log) => <div key={log}>{log}</div>)
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
