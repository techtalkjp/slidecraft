/**
 * APIキー管理ユーティリティ
 *
 * このファイルは .client.ts 拡張子を使用しており、クライアントサイドでのみバンドルされる。
 * Google Gemini APIキーをlocalStorageで管理する。
 */

const API_KEY_STORAGE_KEY = 'slidecraft:apiKey'

/**
 * 保存されているAPIキーを取得
 *
 * @returns APIキー（未設定の場合はnull）
 */
export function getApiKey(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY)
  } catch (error) {
    console.error('APIキーの取得に失敗しました:', error)
    return null
  }
}

/**
 * APIキーを保存
 *
 * @param apiKey 保存するAPIキー
 */
export function saveApiKey(apiKey: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim())
  } catch (error) {
    console.error('APIキーの保存に失敗しました:', error)
    throw new Error('APIキーの保存に失敗しました')
  }
}

/**
 * APIキーを削除
 */
export function clearApiKey(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
  } catch (error) {
    console.error('APIキーの削除に失敗しました:', error)
    throw new Error('APIキーの削除に失敗しました')
  }
}

/**
 * APIキーが設定されているか確認
 *
 * @returns APIキーが設定されていればtrue
 */
export function hasApiKey(): boolean {
  const apiKey = getApiKey()
  return apiKey !== null && apiKey.length > 0
}
