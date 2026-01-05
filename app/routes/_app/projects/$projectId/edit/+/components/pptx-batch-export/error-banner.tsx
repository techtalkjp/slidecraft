/**
 * エラーバナー
 *
 * 単一責務: エラーメッセージを表示し、閉じるボタンを提供
 */
import { AlertCircle, XCircle } from 'lucide-react'

interface ErrorBannerProps {
  message: string
  onDismiss: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-2 bg-red-50 px-3 py-2 text-xs text-red-600">
      <AlertCircle className="h-3 w-3" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600"
      >
        <XCircle className="h-3 w-3" />
      </button>
    </div>
  )
}
