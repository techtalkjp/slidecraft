/**
 * グラフィック領域切り出しユーティリティ
 *
 * このファイルは .client.ts 拡張子を使用しており、クライアントサイドでのみバンドルされる。
 * Canvas APIを使用して画像から指定領域を切り出す。
 */

import type {
  ExtractedGraphic,
  GraphicRegion,
  ImageDimensions,
} from './slide-analysis'

// Canvas最大サイズ（ブラウザ制限とメモリ効率のバランス）
const MAX_CANVAS_DIMENSION = 4096

/**
 * BlobからImageDimensionsを取得
 */
export function getImageDimensions(blob: Blob): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      const result = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      }
      URL.revokeObjectURL(url)
      resolve(result)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('画像の読み込みに失敗しました'))
    }

    img.src = url
  })
}

/**
 * BlobからHTMLImageElementを作成
 */
function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      // 画像データ取得後にURLを解放
      resolve(img)
      URL.revokeObjectURL(url)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('画像の読み込みに失敗しました'))
    }

    img.src = url
  })
}

/**
 * BlobをData URLに変換
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * パーセンテージ座標からピクセル座標に変換（境界チェック付き）
 */
export function percentToPixel(percent: number, dimension: number): number {
  const pixel = Math.round((percent / 100) * dimension)
  // 境界チェック
  return Math.max(0, Math.min(pixel, dimension))
}

/**
 * グラフィック領域を画像から切り出し
 */
export async function extractGraphicRegion(
  imageBlob: Blob,
  region: GraphicRegion,
  dimensions: ImageDimensions,
): Promise<ExtractedGraphic> {
  const img = await createImageFromBlob(imageBlob)

  // パーセンテージからピクセル座標に変換
  const x = percentToPixel(region.x, dimensions.width)
  const y = percentToPixel(region.y, dimensions.height)
  let width = percentToPixel(region.width, dimensions.width)
  let height = percentToPixel(region.height, dimensions.height)

  // 境界を超えないように調整
  if (x + width > dimensions.width) {
    width = dimensions.width - x
  }
  if (y + height > dimensions.height) {
    height = dimensions.height - y
  }

  // 最小サイズチェック
  if (width < 1 || height < 1) {
    throw new Error('切り出し領域が小さすぎます')
  }

  // 最大サイズチェック（メモリ保護）
  if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION) {
    throw new Error(
      `切り出し領域が大きすぎます（最大${MAX_CANVAS_DIMENSION}px）`,
    )
  }

  // Canvasで切り出し
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas contextの取得に失敗しました')
  }

  ctx.drawImage(img, x, y, width, height, 0, 0, width, height)

  // BlobとData URLを取得
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b)
        } else {
          reject(new Error('画像のBlob変換に失敗しました'))
        }
      },
      'image/png',
      1.0,
    )
  })

  return {
    region,
    imageBlob: blob,
  }
}

/**
 * 複数のグラフィック領域を一括で切り出し
 */
export async function extractAllGraphicRegions(
  imageBlob: Blob,
  regions: GraphicRegion[],
): Promise<ExtractedGraphic[]> {
  if (regions.length === 0) {
    return []
  }

  const dimensions = await getImageDimensions(imageBlob)

  // 並列で切り出し処理を実行
  const promises = regions.map((region) =>
    extractGraphicRegion(imageBlob, region, dimensions).catch((error) => {
      // 境界外などのエラーはスキップして続行
      console.warn('グラフィック切り出しエラー:', region.description, error)
      return null
    }),
  )

  const results = await Promise.all(promises)

  // エラーでnullになったものを除外
  return results.filter((r): r is ExtractedGraphic => r !== null)
}
