/**
 * エクスポートボタン
 *
 * 単一責務: グラデーションボーダー付きのエクスポート開始ボタン
 */
import { Sparkles } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface ExportButtonProps {
  onClick: () => void
  disabled: boolean
  showApiKeyWarning: boolean
}

export function ExportButton({
  onClick,
  disabled,
  showApiKeyWarning,
}: ExportButtonProps) {
  return (
    <div className="p-3">
      <div className="group relative">
        <div className="absolute -inset-0.5 rounded-md bg-linear-to-r from-violet-500 via-fuchsia-500 to-pink-500 opacity-75 blur-sm transition-all duration-500 group-hover:opacity-100 group-hover:blur-md" />
        <Button
          onClick={onClick}
          disabled={disabled}
          className="relative w-full bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          size="sm"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          全スライドをPPTX生成
        </Button>
      </div>
      {showApiKeyWarning && (
        <p className="mt-2 text-center text-[10px] text-slate-400">
          APIキーを設定してください
        </p>
      )}
    </div>
  )
}
