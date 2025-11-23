/**
 * スライドデータの読み書きを担当するリポジトリ層
 *
 * このファイルは .client.ts 拡張子を使用しており、クライアントサイドでのみバンドルされる。
 */

import { fileExists, readFile, writeFile } from './storage.client'
import type { Slide, SlidesMetadata } from './types'

/**
 * プロジェクトのスライドメタデータパスを取得
 */
function getSlidesMetadataPath(projectId: string): string {
  return `projects/${projectId}/slides.json`
}

/**
 * スライドメタデータを読み込む
 *
 * @param projectId プロジェクトID
 * @returns スライドの配列（ファイルが存在しない場合は空配列）
 */
export async function loadSlides(projectId: string): Promise<Slide[]> {
  try {
    const path = getSlidesMetadataPath(projectId)
    const exists = await fileExists(path)
    if (!exists) {
      return []
    }

    const blob = await readFile(path)
    const text = await blob.text()
    const metadata: SlidesMetadata = JSON.parse(text)

    return metadata.slides
  } catch (error) {
    console.error('スライドメタデータの読み込みに失敗しました:', error)
    throw new Error('スライドメタデータの読み込みに失敗しました')
  }
}

/**
 * スライドメタデータを保存
 *
 * @param projectId プロジェクトID
 * @param slides 保存するスライドの配列
 */
export async function saveSlides(
  projectId: string,
  slides: Slide[],
): Promise<void> {
  try {
    const metadata: SlidesMetadata = {
      slides,
      updatedAt: new Date().toISOString(),
    }

    const json = JSON.stringify(metadata, null, 2)
    const blob = new Blob([json], { type: 'application/json' })

    const path = getSlidesMetadataPath(projectId)
    await writeFile(path, blob)
  } catch (error) {
    console.error('スライドメタデータの保存に失敗しました:', error)
    throw new Error('スライドメタデータの保存に失敗しました')
  }
}

/**
 * 画像のタイプ
 */
export type ImageType = 'original' | 'current'

/**
 * スライド画像のパスを生成
 *
 * @param projectId プロジェクトID
 * @param slideId スライドID
 * @param type 画像タイプ
 * @param generatedId 生成画像ID（typeが'generated'の場合のみ）
 */
function getImagePath(
  projectId: string,
  slideId: string,
  type: ImageType | 'generated',
  generatedId?: string,
): string {
  if (type === 'generated') {
    if (!generatedId) {
      throw new Error('生成画像の場合はgeneratedIdが必要です')
    }
    return `projects/${projectId}/images/${slideId}/generated/${generatedId}.png`
  }

  return `projects/${projectId}/images/${slideId}/${type}.png`
}

/**
 * スライド画像を保存
 *
 * @param projectId プロジェクトID
 * @param slideId スライドID
 * @param type 画像タイプ
 * @param imageBlob 画像データ
 * @param generatedId 生成画像ID（typeが'generated'の場合のみ）
 */
export async function saveSlideImage(
  projectId: string,
  slideId: string,
  type: ImageType | 'generated',
  imageBlob: Blob,
  generatedId?: string,
): Promise<void> {
  try {
    const path = getImagePath(projectId, slideId, type, generatedId)
    await writeFile(path, imageBlob)
  } catch (error) {
    console.error('スライド画像の保存に失敗しました:', error)
    throw new Error('スライド画像の保存に失敗しました')
  }
}

/**
 * スライド画像を読み込む
 *
 * @param projectId プロジェクトID
 * @param slideId スライドID
 * @param type 画像タイプ
 * @param generatedId 生成画像ID（typeが'generated'の場合のみ）
 * @returns 画像のBlob
 */
export async function loadSlideImage(
  projectId: string,
  slideId: string,
  type: ImageType | 'generated',
  generatedId?: string,
): Promise<Blob> {
  try {
    const path = getImagePath(projectId, slideId, type, generatedId)
    return await readFile(path)
  } catch (error) {
    console.error('スライド画像の読み込みに失敗しました:', error)
    throw new Error('スライド画像の読み込みに失敗しました')
  }
}

/**
 * 現在のスライド画像（currentGeneratedIdがあればそれ、なければoriginal）を読み込む
 *
 * @param projectId プロジェクトID
 * @param slide スライド
 * @returns 画像のBlob
 */
export async function loadCurrentSlideImage(
  projectId: string,
  slide: Slide,
): Promise<Blob> {
  if (slide.currentGeneratedId) {
    return await loadSlideImage(
      projectId,
      slide.id,
      'generated',
      slide.currentGeneratedId,
    )
  }

  return await loadSlideImage(projectId, slide.id, 'original')
}
