/**
 * PDF処理ユーティリティのテスト
 *
 * 動的importとワーカー設定のテスト
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('pdf-processor.client', () => {
  describe('動的import', () => {
    it('pdfjs-distが動的にインポートできる', async () => {
      const pdfjsLib = await import('pdfjs-dist')
      expect(pdfjsLib).toBeDefined()
      expect(pdfjsLib.getDocument).toBeDefined()
      expect(pdfjsLib.version).toBeDefined()
    })

    it('GlobalWorkerOptionsが設定可能', async () => {
      const pdfjsLib = await import('pdfjs-dist')
      const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      // 設定が可能であることを確認
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
      expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toBe(workerSrc)
    })
  })

  describe('convertPdfToSlides', () => {
    // Note: 実際のPDF処理はCanvas APIに依存するため、
    // ブラウザ環境でのE2Eテストが必要
    it.skip('PDFファイルをスライドに変換できる', async () => {
      // E2Eテストとして実装予定
    })
  })
})
