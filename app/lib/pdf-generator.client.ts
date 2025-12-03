/**
 * PDF生成ユーティリティ
 *
 * このファイルは .client.ts 拡張子を使用しており、クライアントサイドでのみバンドルされる。
 * jsPDFを使用してスライド画像からPDFを生成する。
 *
 * 注: jsPDFは大きなライブラリ（canvg, html2canvasを含む）のため、動的importで遅延ロードする。
 */

import type { jsPDF as JsPDFType } from 'jspdf'
import { loadCurrentSlideImage } from './slides-repository.client'
import type { Slide } from './types'

// jsPDFを動的にロードしてキャッシュ
let jsPDFCache: typeof JsPDFType | null = null

async function getJsPDF(): Promise<typeof JsPDFType> {
  if (jsPDFCache) {
    return jsPDFCache
  }
  try {
    const { jsPDF } = await import('jspdf')
    jsPDFCache = jsPDF
    return jsPDFCache
  } catch {
    throw new Error(
      'PDF生成ライブラリの読み込みに失敗しました。ページを再読み込みしてください。',
    )
  }
}

/**
 * BlobをJPEG Data URLに変換（圧縮）
 */
function blobToJpegDataUrl(blob: Blob, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      // 白背景を描画（透過対策）
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

/**
 * 画像のサイズを取得
 */
function getImageDimensions(
  dataUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * スライドからPDFを生成
 *
 * @param projectId プロジェクトID
 * @param slides スライドの配列
 * @param onProgress 進捗状況コールバック (current, total)
 * @returns 生成されたPDFのBlob
 */
export async function generatePdfFromSlides(
  projectId: string,
  slides: Slide[],
  onProgress?: (current: number, total: number) => void,
): Promise<Blob> {
  if (slides.length === 0) {
    throw new Error('スライドが存在しません')
  }

  try {
    // 最初のスライドの画像を読み込んでサイズを取得
    const firstSlideImage = await loadCurrentSlideImage(projectId, slides[0])
    const firstSlideDataUrl = await blobToJpegDataUrl(firstSlideImage)
    const { width, height } = await getImageDimensions(firstSlideDataUrl)

    // PDFのページサイズを計算
    // 一般的なスライドは16:9なので、A4横向き (297 x 210 mm) をベースにする
    // ただし、実際の画像サイズに合わせて調整
    const aspectRatio = width / height

    // mmに変換 (72 DPI基準で計算)
    const DPI = 72
    const MM_PER_INCH = 25.4
    const pageWidthMm = (width / DPI) * MM_PER_INCH
    const pageHeightMm = (height / DPI) * MM_PER_INCH

    // jsPDFを動的にロード（canvg, html2canvasを含む大きなライブラリのため遅延ロード）
    const jsPDF = await getJsPDF()
    const pdf = new jsPDF({
      orientation: aspectRatio > 1 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
    })

    // 全スライドを処理
    for (let i = 0; i < slides.length; i++) {
      if (onProgress) {
        onProgress(i + 1, slides.length)
      }

      const slide = slides[i]

      // スライド画像を読み込む（JPEG圧縮でファイルサイズ削減）
      const slideImage = await loadCurrentSlideImage(projectId, slide)
      const slideDataUrl = await blobToJpegDataUrl(slideImage)

      // 2ページ目以降は新しいページを追加
      if (i > 0) {
        pdf.addPage([pageWidthMm, pageHeightMm], aspectRatio > 1 ? 'l' : 'p')
      }

      // 画像を追加（ページ全体に配置、JPEG形式）
      pdf.addImage(slideDataUrl, 'JPEG', 0, 0, pageWidthMm, pageHeightMm)
    }

    // PDFをBlobとして出力
    const pdfBlob = pdf.output('blob')
    return pdfBlob
  } catch (error) {
    console.error('PDF生成エラー:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('PDFの生成に失敗しました')
  }
}

/**
 * PDFをダウンロード
 *
 * @param blob PDFのBlob
 * @param filename ファイル名（拡張子なし）
 */
export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.pdf`
  a.style.display = 'none'

  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // URLを解放
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)
}
