import { loadSlides, saveSlides } from '~/lib/slides-repository.client'
import { deleteFile } from '~/lib/storage.client'
import type { Slide } from '~/lib/types'
import type { Route } from './+types/index'

/**
 * Editor mutation処理のclientAction
 *
 * 候補選択、リセットなどのシンプルなmutation処理を扱う。
 * AI生成処理は進捗表示が必要なため、useSlideGenerationフックを維持。
 */
export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const formData = await request.formData()
  const _action = formData.get('_action') as string
  const { projectId } = params

  if (!projectId) {
    throw new Response('Project ID is required', { status: 400 })
  }

  if (_action === 'selectCandidate') {
    return await selectCandidateAction(formData, projectId)
  }

  if (_action === 'resetToOriginal') {
    return await resetToOriginalAction(formData, projectId)
  }

  if (_action === 'deleteCandidate') {
    return await deleteCandidateAction(formData, projectId)
  }

  throw new Response('Invalid action', { status: 400 })
}

/**
 * 候補画像選択処理
 *
 * ユーザーが生成された候補画像またはオリジナル画像を選択した際に実行される。
 * currentGeneratedIdフィールドを更新してOPFSに保存する。
 */
async function selectCandidateAction(formData: FormData, projectId: string) {
  try {
    const slideId = formData.get('slideId') as string
    const generatedId = formData.get('generatedId') as string | null

    // スライドデータを取得
    const slides = await loadSlides(projectId)
    const slide = slides.find((s) => s.id === slideId)

    if (!slide) {
      return { error: 'スライドが見つかりません' }
    }

    // スライドを更新
    const updatedSlide: Slide = {
      ...slide,
      currentGeneratedId: generatedId || undefined,
    }

    const updatedSlides = slides.map((s) =>
      s.id === slideId ? updatedSlide : s,
    )

    // OPFSに保存
    await saveSlides(projectId, updatedSlides)

    return {
      success: true,
      slideId,
      generatedId: generatedId || null,
    }
  } catch (error) {
    console.error('候補適用エラー:', error)
    return {
      error:
        error instanceof Error ? error.message : '候補の適用に失敗しました',
    }
  }
}

/**
 * オリジナル画像へのリセット処理
 *
 * 編集済みスライドをオリジナル画像に戻す。
 * currentGeneratedIdをundefinedに設定してOPFSに保存する。
 */
async function resetToOriginalAction(formData: FormData, projectId: string) {
  try {
    const slideId = formData.get('slideId') as string

    // スライドデータを取得
    const slides = await loadSlides(projectId)
    const slide = slides.find((s) => s.id === slideId)

    if (!slide) {
      return { error: 'スライドが見つかりません' }
    }

    // スライドを更新
    const updatedSlide: Slide = {
      ...slide,
      currentGeneratedId: undefined,
    }

    const updatedSlides = slides.map((s) =>
      s.id === slideId ? updatedSlide : s,
    )

    // OPFSに保存
    await saveSlides(projectId, updatedSlides)

    return {
      success: true,
      slideId,
    }
  } catch (error) {
    console.error('リセットエラー:', error)
    return {
      error:
        error instanceof Error ? error.message : '元に戻す処理に失敗しました',
    }
  }
}

/**
 * 候補画像削除処理
 *
 * 生成された候補画像を削除する。
 * 削除対象が現在適用中の場合はオリジナルに戻してから削除する。
 */
async function deleteCandidateAction(formData: FormData, projectId: string) {
  try {
    const slideId = formData.get('slideId') as string
    const generatedId = formData.get('generatedId') as string

    if (!generatedId) {
      return { error: '削除する候補が指定されていません' }
    }

    // スライドデータを取得
    const slides = await loadSlides(projectId)
    const slide = slides.find((s) => s.id === slideId)

    if (!slide) {
      return { error: 'スライドが見つかりません' }
    }

    // 候補が存在するか確認
    const candidateIndex = slide.generatedCandidates.findIndex(
      (c) => c.id === generatedId,
    )
    if (candidateIndex === -1) {
      return { error: '削除対象の候補が見つかりません' }
    }

    // 候補配列から削除
    const updatedCandidates = slide.generatedCandidates.filter(
      (c) => c.id !== generatedId,
    )

    // 削除対象が現在適用中の場合はオリジナルに戻す
    const updatedSlide: Slide = {
      ...slide,
      generatedCandidates: updatedCandidates,
      currentGeneratedId:
        slide.currentGeneratedId === generatedId
          ? undefined
          : slide.currentGeneratedId,
    }

    const updatedSlides = slides.map((s) =>
      s.id === slideId ? updatedSlide : s,
    )

    // OPFSに保存
    await saveSlides(projectId, updatedSlides)

    // 画像ファイルを削除
    const imagePath = `projects/${projectId}/images/${slideId}/generated/${generatedId}.png`
    try {
      await deleteFile(imagePath)
    } catch (error) {
      console.warn('画像ファイルの削除に失敗しました:', error)
      // 画像ファイルの削除に失敗してもメタデータは削除済みなので続行
    }

    return {
      success: true,
      slideId,
      deletedId: generatedId,
    }
  } catch (error) {
    console.error('候補削除エラー:', error)
    return {
      error:
        error instanceof Error ? error.message : '候補の削除に失敗しました',
    }
  }
}
