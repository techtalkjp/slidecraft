/**
 * PDFをページごとの画像に変換するユーティリティ
 *
 * このファイルは .client.ts 拡張子を使用しており、クライアントサイドでのみバンドルされる。
 */

import * as pdfjsLib from 'pdfjs-dist'
import { saveSlideImage } from './slides-repository.client'
import type { Slide } from './types'

// pdf.js のワーカーを設定
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

/**
 * 進捗コールバックの型
 */
export type ProgressCallback = (current: number, total: number) => void

/**
 * レンダリング設定
 */
const RENDER_SCALE = 2 // 高解像度レンダリング（1920px基準）

/**
 * PDFの1ページをCanvasにレンダリングしてBlobに変換
 *
 * @param page PDFページ
 * @returns 画像のBlob
 */
async function renderPageToBlob(page: pdfjsLib.PDFPageProxy): Promise<Blob> {
  const viewport = page.getViewport({ scale: RENDER_SCALE })

  // Canvasを作成
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D contextの取得に失敗しました')
  }

  canvas.width = viewport.width
  canvas.height = viewport.height

  // ページをCanvasにレンダリング
  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  }).promise

  // CanvasをBlobに変換
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Canvas to Blob conversion failed'))
      }
    }, 'image/png')
  })
}

/**
 * PDFファイルを読み込んでスライドデータに変換
 *
 * @param projectId プロジェクトID
 * @param file PDFファイル
 * @param onProgress 進捗コールバック（省略可）
 * @returns 生成されたスライドの配列
 */
export async function convertPdfToSlides(
  projectId: string,
  file: File,
  onProgress?: ProgressCallback,
): Promise<Slide[]> {
  // PDFファイルをArrayBufferとして読み込む
  const arrayBuffer = await file.arrayBuffer()

  // PDFドキュメントを読み込む
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdfDocument = await loadingTask.promise

  const numPages = pdfDocument.numPages
  const slides: Slide[] = []

  // 各ページを処理
  for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
    const page = await pdfDocument.getPage(pageIndex + 1) // PDFページは1始まり
    const imageBlob = await renderPageToBlob(page)

    // スライドIDを生成（簡易的にタイムスタンプ + インデックス）
    const slideId = `${Date.now()}-${pageIndex}`

    // スライドデータを作成
    const slide: Slide = {
      id: slideId,
      pageIndex,
      generatedCandidates: [],
    }

    // 画像をOPFSに保存（originalのみ、currentは不要）
    await saveSlideImage(projectId, slideId, 'original', imageBlob)

    slides.push(slide)

    // 進捗を通知
    if (onProgress) {
      onProgress(pageIndex + 1, numPages)
    }
  }

  return slides
}
