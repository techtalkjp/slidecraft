/**
 * PPTX一括エクスポート用ヘルパー関数
 *
 * UIとビジネスロジックを分離するためのユーティリティ
 */
import type { BatchPptxExportOutput } from '~/jobs'
import { readFile } from '~/lib/storage.client'

/**
 * 日時を日本語フォーマットで表示
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * OPFSからPPTXをダウンロード
 */
export async function downloadPptxFromOpfs(
  output: BatchPptxExportOutput,
): Promise<void> {
  const blob = await readFile(output.opfsPath)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = output.fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
