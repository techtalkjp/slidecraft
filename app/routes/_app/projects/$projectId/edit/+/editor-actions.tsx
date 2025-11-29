import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  Loader2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ApiKeyDialog } from '~/components/api-key-dialog'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { trackPdfExported } from '~/lib/analytics'
import { downloadPdf, generatePdfFromSlides } from '~/lib/pdf-generator.client'
import { loadCurrentSlideImage } from '~/lib/slides-repository.client'
import type { Slide } from '~/lib/types'
import { PptxExportDialog } from './components/pptx-export-dialog'

interface EditorActionsProps {
  projectId: string
  projectName: string
  slides: Slide[]
  selectedSlide: Slide
  slideNumber: number
}

export function EditorActions({
  projectId,
  projectName,
  slides,
  selectedSlide,
  slideNumber,
}: EditorActionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [_error, setError] = useState<string | null>(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  // PPTXエクスポート関連の状態
  const [showPptxDialog, setShowPptxDialog] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [currentSlideBlob, setCurrentSlideBlob] = useState<Blob | null>(null)

  // ヘッダ内のコンテナ要素を取得
  useEffect(() => {
    const element = document.getElementById('editor-actions')
    setContainer(element)
  }, [])

  // PPTXエクスポートダイアログを開く
  const handleOpenPptxDialog = useCallback(async () => {
    try {
      const blob = await loadCurrentSlideImage(projectId, selectedSlide)
      setCurrentSlideBlob(blob)
      setShowPptxDialog(true)
    } catch (error) {
      console.error('スライド画像の読み込みに失敗:', error)
      setError('スライド画像の読み込みに失敗しました')
    }
  }, [projectId, selectedSlide])

  // APIキーが必要な場合のコールバック
  const handleApiKeyRequired = useCallback(() => {
    setShowPptxDialog(false)
    setShowApiKeyDialog(true)
  }, [])

  // APIキー設定後にPPTXダイアログを再度開く
  const handleApiKeySaved = useCallback(() => {
    setShowApiKeyDialog(false)
    setShowPptxDialog(true)
  }, [])

  const handleExport = async () => {
    setError(null)
    setIsExporting(true)

    try {
      // PDFを生成
      const pdfBlob = await generatePdfFromSlides(
        projectId,
        slides,
        (current, total) => {
          setExportProgress({ current, total })
        },
      )

      // ダウンロード
      const timestamp = new Date().toISOString().split('T')[0]
      downloadPdf(pdfBlob, `slides-edited-${timestamp}`)

      // GA4: PDFエクスポートイベント
      trackPdfExported(slides.length)
    } catch (err) {
      console.error('PDFエクスポートエラー:', err)
      setError(err instanceof Error ? err.message : 'PDFの生成に失敗しました')
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }

  const content = (
    <>
      {_error && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{_error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1"
              onClick={() => setError(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* PPTXエクスポートボタン */}
      <Button
        onClick={handleOpenPptxDialog}
        disabled={isExporting}
        size="sm"
        variant="outline"
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        PPTX
      </Button>

      {/* PDF書き出しボタン */}
      <Button onClick={handleExport} disabled={isExporting} size="sm">
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            書き出し中 {exportProgress?.current}/{exportProgress?.total}
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            PDF書き出し
          </>
        )}
      </Button>

      {/* PPTXエクスポートダイアログ */}
      <PptxExportDialog
        open={showPptxDialog}
        onOpenChange={setShowPptxDialog}
        imageBlob={currentSlideBlob}
        projectName={projectName}
        slideNumber={slideNumber}
        onApiKeyRequired={handleApiKeyRequired}
      />

      {/* APIキー設定ダイアログ */}
      <ApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        onSaved={handleApiKeySaved}
      />
    </>
  )

  return container ? createPortal(content, container) : null
}
