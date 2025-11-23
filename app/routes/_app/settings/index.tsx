import { AlertCircle, ExternalLink, Key, Save } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useRouteError } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { getApiKey, saveApiKey } from '~/lib/api-settings.client'
import type { Route } from './+types/index'

export const handle = {
  breadcrumb: () => ({ label: '設定', to: '/settings' }),
}

export function meta(): Route.MetaDescriptors {
  return [
    { title: 'API設定 - SlideCraft' },
    { name: 'description', content: 'Google Gemini APIキーの設定' },
  ]
}

export function clientLoader() {
  const apiKey = getApiKey()
  return { apiKey }
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState(loaderData.apiKey || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = () => {
    setError(null)
    setSuccess(false)

    if (!apiKey.trim()) {
      setError('APIキーを入力してください')
      return
    }

    try {
      saveApiKey(apiKey)
      setSuccess(true)

      // 2秒後にプロジェクト一覧に遷移
      setTimeout(() => {
        navigate('/projects')
      }, 2000)
    } catch (err) {
      console.error('APIキーの保存に失敗:', err)
      setError('APIキーの保存に失敗しました')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">API設定</h2>
        <p className="text-muted-foreground">
          Google Gemini APIキーを設定してください
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            <CardTitle>Google Gemini API</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
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
              <ExternalLink className="h-3 w-3" />
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

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
              APIキーを保存しました。プロジェクト一覧に移動します...
            </div>
          )}

          <Button onClick={handleSave} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  return (
    <div className="mx-auto max-w-2xl">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラーが発生しました</AlertTitle>
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : '予期しないエラーが発生しました'}
        </AlertDescription>
      </Alert>

      <Button asChild className="mt-4">
        <Link to="/projects">プロジェクト一覧に戻る</Link>
      </Button>
    </div>
  )
}
