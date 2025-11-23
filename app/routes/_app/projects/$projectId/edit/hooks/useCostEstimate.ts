import { useEffect, useMemo, useState } from 'react'
import { calculateGenerationCost, getExchangeRate } from '~/lib/cost-calculator'

/**
 * コスト計算と為替レート管理を行うカスタムフック
 *
 * - USD/JPY為替レートの取得とキャッシュ
 * - プロンプトと生成枚数に基づくコスト推定
 * - 最後の生成にかかった実際のコストの追跡
 */
export function useCostEstimate(prompt: string, generationCount: number) {
  // 為替レート（USD/JPY）
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)

  // 最後の生成にかかったコスト
  const [lastGenerationCost, setLastGenerationCost] = useState<number | null>(
    null,
  )

  /**
   * USD/JPY為替レートを取得（初回のみ）
   * 外部システム: exchangerate-api.comのREST API
   * 24時間キャッシュされるため、頻繁なリクエストは発生しない
   */
  useEffect(() => {
    getExchangeRate().then(setExchangeRate)
  }, [])

  /**
   * 現在のプロンプトと生成枚数に基づくコスト推定
   * プロンプトが空の場合はデフォルトのプロンプトで計算
   */
  const costEstimate = useMemo(() => {
    return calculateGenerationCost(prompt || 'スライドを修正', generationCount)
  }, [prompt, generationCount])

  /**
   * 生成開始時にコストを記録する関数
   * handleGenerate内で呼び出される
   */
  const recordGenerationCost = () => {
    const cost = calculateGenerationCost(prompt, generationCount)
    setLastGenerationCost(cost.totalCost)
  }

  /**
   * 生成コストをリセットする関数
   * 生成開始時や新しいスライドに切り替わった時に呼び出される
   */
  const resetGenerationCost = () => {
    setLastGenerationCost(null)
  }

  return {
    exchangeRate,
    costEstimate,
    lastGenerationCost,
    recordGenerationCost,
    resetGenerationCost,
  }
}
