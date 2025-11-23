import { Check, ExternalLink, Key } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { getApiKey, saveApiKey } from '~/lib/api-settings.client'

interface ApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  onSaved,
}: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState(getApiKey() || '')
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    setError(null)

    if (!apiKey.trim()) {
      setError('APIキーを入力してください')
      return
    }

    try {
      saveApiKey(apiKey)
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      console.error('APIキーの保存に失敗:', err)
      setError('APIキーの保存に失敗しました')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Google Gemini API設定
            </div>
          </DialogTitle>
          <DialogDescription>
            スライド修正にはGoogle Gemini APIキーが必要です
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              SlideCraftは、画像生成にGoogle Gemini
              APIを使用します。ご自身のAPIキーを設定してください。
            </p>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              Google AI StudioでAPIキーを取得
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="apiKey"
              className="text-sm font-medium text-slate-700"
            >
              Google Gemini APIキー
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                }
              }}
            />
            <p className="text-xs text-slate-500">
              APIキーはブラウザのlocalStorageに保存されます
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            <Check className="mr-2 h-4 w-4" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
