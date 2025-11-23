import {
  AlertCircle,
  DollarSign,
  HelpCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import type { RefObject } from 'react'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/hover-card'
import { Textarea } from '~/components/ui/textarea'
import { formatCost, formatCostJPY } from '~/lib/cost-calculator'

interface GenerationControlFormProps {
  prompt: string
  setPrompt: (value: string) => void
  generationCount: number
  setGenerationCount: (count: number) => void
  isGenerating: boolean
  generationProgress: { current: number; total: number } | null
  validationError: string | null
  setValidationError: (error: string | null) => void
  generationError: string | null
  promptRef: RefObject<HTMLTextAreaElement | null>
  exchangeRate: number | null
  costEstimate: {
    inputCost: number
    outputCost: number
    totalCost: number
  }
  lastGenerationCost: number | null
  onGenerate: () => void
}

/**
 * 生成制御フォームコンポーネント
 *
 * プロンプト入力、生成設定、コスト表示、生成ボタンなどをまとめて表示
 */
export function GenerationControlForm({
  prompt,
  setPrompt,
  generationCount,
  setGenerationCount,
  isGenerating,
  generationProgress,
  validationError,
  setValidationError,
  generationError,
  promptRef,
  exchangeRate,
  costEstimate,
  lastGenerationCost,
  onGenerate,
}: GenerationControlFormProps) {
  return (
    <div className="space-y-6">
      {/* プロンプト入力 */}
      <div className="space-y-2">
        <label htmlFor="prompt" className="text-sm font-medium text-slate-700">
          修正内容
        </label>
        <Textarea
          ref={promptRef}
          id="prompt"
          placeholder="例: 背景色を青から白に変更、文字化けを修正、タイトルを大きく"
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value)
            if (validationError) setValidationError(null)
          }}
          rows={4}
          disabled={isGenerating}
          className={`resize-none ${validationError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {validationError && (
          <p className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {validationError}
          </p>
        )}
      </div>

      {/* 生成枚数選択とコスト */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">生成候補数</div>
          {exchangeRate && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex cursor-help items-center gap-1 text-xs text-slate-500">
                  <span>
                    コスト推定{' '}
                    {formatCostJPY(costEstimate.totalCost, exchangeRate)}
                  </span>
                  <HelpCircle className="h-3.5 w-3.5" />
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64" align="end">
                <div className="mb-2 font-medium text-slate-700">
                  コスト見積もり
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>入力:</span>
                    <span>
                      {formatCostJPY(costEstimate.inputCost, exchangeRate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>出力 (×{generationCount}):</span>
                    <span>
                      {formatCostJPY(costEstimate.outputCost, exchangeRate)}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-slate-200 pt-1 font-medium">
                    <span>合計:</span>
                    <span>
                      {formatCostJPY(costEstimate.totalCost, exchangeRate)}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    {formatCost(costEstimate.totalCost)} × ¥
                    {exchangeRate.toFixed(2)}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((count) => (
            <Button
              key={count}
              variant={generationCount === count ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGenerationCount(count)}
              disabled={isGenerating}
              className="flex-1"
            >
              {count}案
            </Button>
          ))}
        </div>
      </div>

      {/* 修正コスト */}
      {lastGenerationCost !== null && !isGenerating && (
        <div className="rounded-md bg-green-50 p-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <DollarSign className="h-4 w-4" />
            <span>
              修正コスト: {formatCost(lastGenerationCost)}
              {exchangeRate && (
                <span className="ml-1 text-green-600">
                  ({formatCostJPY(lastGenerationCost, exchangeRate)})
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* 生成ボタン */}
      <Button onClick={onGenerate} disabled={isGenerating} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            修正中 {generationProgress?.current}/{generationProgress?.total}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            修正案を生成
          </>
        )}
      </Button>

      {/* 生成エラーメッセージ */}
      {generationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{generationError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
