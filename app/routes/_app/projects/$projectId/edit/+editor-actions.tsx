import { Download, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '~/components/ui/button'
import { trackPdfExported } from '~/lib/analytics'
import { downloadPdf, generatePdfFromSlides } from '~/lib/pdf-generator.client'
import type { Slide } from '~/lib/types'

interface EditorActionsProps {
  projectId: string
  slides: Slide[]
}

export function EditorActions({ projectId, slides }: EditorActionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [_error, setError] = useState<string | null>(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  // ヘッダ内のコンテナ要素を取得
  useEffect(() => {
    const element = document.getElementById('editor-actions')
    setContainer(element)
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
  )

  return container ? createPortal(content, container) : null
}
