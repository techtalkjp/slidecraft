/**
 * Durably React Hooks
 *
 * Durably の初期化と状態管理を行うカスタムフック
 */
import { useCallback, useEffect, useState } from 'react'
import { durably } from './durably'

type Status = 'init' | 'ready' | 'running' | 'completed' | 'failed'

export interface DurablyState {
  status: Status
  currentStep: string | null
  result: { steps: string[]; total: number } | null
  error: string | null
  logs: string[]
}

export function useDurably() {
  const [state, setState] = useState<DurablyState>({
    status: 'init',
    currentStep: null,
    result: null,
    error: null,
    logs: [],
  })

  const addLog = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${message}`],
    }))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        await durably.migrate()
        if (cancelled) return

        durably.start()
        setState((prev) => ({ ...prev, status: 'ready' }))
        addLog('Durably initialized and started')
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Failed to initialize',
          }))
        }
      }
    }

    // イベント購読
    const unsubscribers = [
      durably.on('run:start', (event) => {
        if (cancelled) return
        setState((prev) => ({ ...prev, status: 'running', currentStep: null }))
        addLog(`Run started: ${event.runId}`)
      }),
      durably.on('step:start', (event) => {
        if (cancelled) return
        setState((prev) => ({ ...prev, currentStep: event.stepName }))
        addLog(`Step started: ${event.stepName}`)
      }),
      durably.on('step:complete', (event) => {
        if (cancelled) return
        addLog(`Step completed: ${event.stepName}`)
      }),
      durably.on('run:complete', (event) => {
        if (cancelled) return
        setState((prev) => ({
          ...prev,
          status: 'completed',
          currentStep: null,
        }))
        addLog(`Run completed: ${event.runId}`)
      }),
      durably.on('run:fail', (event) => {
        if (cancelled) return
        setState((prev) => ({
          ...prev,
          status: 'failed',
          currentStep: null,
          error: event.error,
        }))
        addLog(`Run failed: ${event.error}`)
      }),
    ]

    init()

    return () => {
      cancelled = true
      for (const unsub of unsubscribers) {
        unsub()
      }
      durably.stop()
    }
  }, [addLog])

  return { state, setState, addLog }
}
