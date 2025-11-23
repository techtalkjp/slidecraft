import {
  FileText,
  FolderInput,
  Loader2,
  Upload as UploadIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Progress } from '~/components/ui/progress'
import { convertPdfToSlides } from '~/lib/pdf-processor.client'
import { createProject, updateProject } from '~/lib/projects-repository.client'
import { saveSlides } from '~/lib/slides-repository.client'
import type { Route } from './+types/new'

export const handle = {
  breadcrumb: () => ({ label: '新規作成' }),
}

export function meta(): Route.MetaDescriptors {
  return [{ title: '新規プロジェクト作成 - SlideCraft' }]
}

export default function Upload() {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('PDFファイルを選択してください')
      return
    }

    setIsProcessing(true)
    setError(null)
    setProgress({ current: 0, total: 0 })

    try {
      // プロジェクトを先に作成（スライド数は0で初期化）
      const projectName =
        file.name.replace(/\.pdf$/i, '') || `プロジェクト ${Date.now()}`
      const project = await createProject(projectName, 0)

      // PDFをスライドに変換（projectIdを渡す）
      const slides = await convertPdfToSlides(
        project.id,
        file,
        (current, total) => {
          setProgress({ current, total })
        },
      )

      // プロジェクトのスライド数を更新
      await updateProject(project.id, { slideCount: slides.length })

      // スライドを保存
      await saveSlides(project.id, slides)

      // エディター画面にリダイレクト
      navigate(`/projects/${project.id}/edit`)
    } catch (err) {
      console.error('PDF処理エラー:', err)
      setError('PDFの処理に失敗しました。もう一度お試しください。')
      setIsProcessing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag and drop zone
    <div
      className={`flex flex-1 flex-col items-center justify-center transition-colors duration-200 ${
        isDragging ? 'bg-blue-50' : 'bg-background'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Card
        className={`w-full max-w-md border-2 p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'scale-105 border-blue-500 bg-blue-50/50 shadow-2xl'
            : 'border-dashed border-slate-300 hover:border-slate-400'
        }`}
      >
        <div
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-colors duration-200 ${
            isDragging
              ? 'bg-blue-100 text-blue-700'
              : 'bg-blue-50 text-blue-600'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : isDragging ? (
            <FolderInput className="h-10 w-10 animate-bounce" />
          ) : (
            <FileText className="h-10 w-10" />
          )}
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          新規プロジェクト作成
        </h1>
        <p className="mb-8 text-slate-500">
          {isDragging
            ? 'ここにPDFをドロップしてください！'
            : isProcessing
              ? `PDF処理中... ${progress.current} / ${progress.total} ページ`
              : 'PDFスライドをドラッグ&ドロップ、またはボタンからアップロードして、新しいプロジェクトを作成します。'}
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {isProcessing && progress.total > 0 && (
          <div className="mb-6 space-y-2">
            <Progress
              value={(progress.current / progress.total) * 100}
              className="h-2"
            />
            <p className="text-xs text-slate-500">
              {progress.current} / {progress.total} ページ処理中
            </p>
          </div>
        )}

        <label
          className={`block w-full ${
            isProcessing ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <Button
            type="button"
            className="w-full"
            disabled={isProcessing}
            asChild
          >
            <div>
              <UploadIcon className="mr-2 h-5 w-5" />
              <span>
                {isProcessing ? 'PDFを処理中...' : 'PDFをアップロード'}
              </span>
            </div>
          </Button>
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
        </label>

        <p className="mt-4 text-xs text-slate-400">
          💡 このエリアにPDFファイルをドラッグ&ドロップできます
          <br />
          対応フォーマット: PDFのみ
          <br />
          処理はお使いのブラウザ内でローカルに行われます。
        </p>
      </Card>

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-blue-500/10 backdrop-blur-[1px]">
          <div className="rounded-xl bg-white/90 px-6 py-4 text-xl font-bold text-blue-700 shadow-lg">
            PDFをドロップしてアップロード
          </div>
        </div>
      )}
    </div>
  )
}
