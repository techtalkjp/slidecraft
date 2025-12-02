import { AlertCircle, Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  ANALYSIS_MODELS,
  type AnalysisModelId,
} from '~/lib/slide-analyzer.client'
import { usePptxExport } from '../hooks/use-pptx-export'

interface PptxExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageBlob: Blob | null
  projectName: string
  slideNumber: number
  onApiKeyRequired: () => void
}

export function PptxExportDialog({
  open,
  onOpenChange,
  imageBlob,
  projectName,
  slideNumber,
  onApiKeyRequired,
}: PptxExportDialogProps) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)

  const {
    state,
    selectedModel,
    error,
    analysis,
    graphics,
    pptxResult,
    usage,
    processingTime,
    isProcessing,
    setSelectedModel,
    handleAnalyze,
    handleDownload,
    reset,
  } = usePptxExport({
    imageBlob,
    projectName,
    slideNumber,
    onApiKeyRequired,
  })

  // ダイアログを閉じるときにリセット
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        reset()
      }
      onOpenChange(newOpen)
    },
    [reset, onOpenChange],
  )

  // 画像のData URLを生成（プレビュー用）
  useEffect(() => {
    if (!imageBlob || !open) {
      setImageDataUrl(null)
      return
    }

    const url = URL.createObjectURL(imageBlob)
    setImageDataUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [imageBlob, open])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              PPTXエクスポート
            </div>
          </DialogTitle>
          <DialogDescription>
            スライド画像を解析して編集可能なPowerPointファイルを生成します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* モデル選択 */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              解析モデル
            </span>
            <div className="flex gap-2">
              {Object.entries(ANALYSIS_MODELS).map(([id, model]) => (
                <Button
                  key={id}
                  variant={selectedModel === id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModel(id as AnalysisModelId)}
                  disabled={isProcessing}
                >
                  {model.name}
                  <span className="ml-1 text-xs opacity-70">
                    (~¥{model.estimatedCostJpy})
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* プレビュー */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-slate-100">
            {imageDataUrl && (
              <img
                src={imageDataUrl}
                alt="スライドプレビュー"
                className="h-full w-full object-contain"
              />
            )}

            {/* 解析結果オーバーレイ */}
            {analysis && (
              <div className="absolute inset-0">
                {/* テキスト要素（青） */}
                {analysis.textElements.map((el) => (
                  <div
                    key={`text-${el.x}-${el.y}-${el.content.slice(0, 10)}`}
                    role="img"
                    aria-label={`テキスト要素: ${el.content}`}
                    className="absolute border-2 border-blue-500 bg-blue-500/20"
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `${el.height}%`,
                    }}
                    title={el.content}
                  />
                ))}

                {/* シェイプ要素（オレンジ） */}
                {analysis.shapeElements?.map((shape) => (
                  <div
                    key={`shape-${shape.x}-${shape.y}-${shape.type}`}
                    role="img"
                    aria-label={`シェイプ要素: ${shape.type}${shape.text ? ` (${shape.text})` : ''}`}
                    className="absolute border-2 border-orange-500 bg-orange-500/20"
                    style={{
                      left: `${shape.x}%`,
                      top: `${shape.y}%`,
                      width: `${shape.width}%`,
                      height: `${shape.height}%`,
                    }}
                    title={`${shape.type}${shape.text ? `: ${shape.text}` : ''}`}
                  />
                ))}

                {/* テーブル要素（紫） */}
                {analysis.tableElements?.map((table, idx) => (
                  <div
                    key={`table-${table.x}-${table.y}-${idx}`}
                    role="img"
                    aria-label="テーブル要素"
                    className="absolute border-2 border-purple-500 bg-purple-500/20"
                    style={{
                      left: `${table.x}%`,
                      top: `${table.y}%`,
                      width: `${table.width}%`,
                      height: `${table.height}%`,
                    }}
                    title="テーブル"
                  />
                ))}

                {/* グラフィック領域（緑） */}
                {analysis.graphicRegions.map((region) => (
                  <div
                    key={`graphic-${region.x}-${region.y}-${region.description.slice(0, 10)}`}
                    role="img"
                    aria-label={`グラフィック領域: ${region.description}`}
                    className="absolute border-2 border-emerald-500 bg-emerald-500/20"
                    style={{
                      left: `${region.x}%`,
                      top: `${region.y}%`,
                      width: `${region.width}%`,
                      height: `${region.height}%`,
                    }}
                    title={region.description}
                  />
                ))}
              </div>
            )}

            {/* 処理中オーバーレイ */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex flex-col items-center gap-2 rounded-lg bg-white px-6 py-4 shadow-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="text-sm font-medium text-slate-700">
                    {state === 'analyzing' && '解析中...'}
                    {state === 'extracting' && 'グラフィック切り出し中...'}
                    {state === 'generating' && 'PPTX生成中...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 解析結果サマリー */}
          {analysis && state === 'ready' && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <div>
                  <span className="font-medium text-blue-600">テキスト:</span>{' '}
                  {analysis.textElements.length}
                </div>
                {(analysis.shapeElements?.length ?? 0) > 0 && (
                  <div>
                    <span className="font-medium text-orange-600">
                      シェイプ:
                    </span>{' '}
                    {analysis.shapeElements?.length}
                  </div>
                )}
                {(analysis.tableElements?.length ?? 0) > 0 && (
                  <div>
                    <span className="font-medium text-purple-600">
                      テーブル:
                    </span>{' '}
                    {analysis.tableElements?.length}
                  </div>
                )}
                <div>
                  <span className="font-medium text-emerald-600">
                    グラフィック:
                  </span>{' '}
                  {graphics.length}
                </div>
                {usage && (
                  <>
                    <div>
                      <span className="font-medium text-slate-600">
                        トークン:
                      </span>{' '}
                      {usage.totalTokens.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">
                        コスト:
                      </span>{' '}
                      ¥{usage.costJpy.toFixed(2)}
                    </div>
                  </>
                )}
                {processingTime !== null && (
                  <div>
                    <span className="font-medium text-slate-600">
                      処理時間:
                    </span>{' '}
                    {processingTime.toFixed(1)}秒
                  </div>
                )}
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            閉じる
          </Button>

          {state === 'idle' && (
            <Button onClick={handleAnalyze} disabled={!imageBlob}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              解析開始
            </Button>
          )}

          {state === 'ready' && (
            <>
              <Button variant="outline" onClick={handleAnalyze}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                再解析
              </Button>
              {pptxResult && (
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  PPTXダウンロード
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
