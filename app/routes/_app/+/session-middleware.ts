import type { Session } from '~/lib/auth/auth'

export type AuthApi = {
  getSession: (opts: {
    headers: Headers
    query?: {
      disableCookieCache?: boolean
      disableRefresh?: boolean
    }
  }) => Promise<Session | null>
  signInAnonymous: (opts: {
    headers: Headers
    asResponse: true
  }) => Promise<Response | null>
}

export type SessionMiddlewareResult = {
  session: Session | null
  setCookieHeader: string | null
}

/**
 * セッション取得または匿名サインインを実行
 * better-auth API の失敗時はセッションなしで続行（アプリはセッションなしでも動作可能）
 */
export async function getOrCreateSession(
  requestHeaders: Headers,
  authApi: AuthApi,
): Promise<SessionMiddlewareResult> {
  let session: Session | null = null
  let setCookieHeader: string | null = null

  try {
    // 既存セッションを確認
    const headersToUse = requestHeaders

    session = await authApi.getSession({
      headers: headersToUse,
      query: { disableCookieCache: true },
    })

    // セッションがなければ匿名サインイン
    if (!session) {
      const signInResponse = await authApi.signInAnonymous({
        headers: requestHeaders,
        asResponse: true,
      })
      if (signInResponse) {
        setCookieHeader = signInResponse.headers.get('set-cookie')
        // 新しい cookie を使ってセッションを再取得
        const newHeaders = new Headers(requestHeaders)
        if (setCookieHeader) {
          // Set-Cookie から cookie 値を抽出して Cookie ヘッダーに設定
          const cookieValue = setCookieHeader.split(';')[0]
          newHeaders.set('cookie', cookieValue)
        }
        session = await authApi.getSession({
          headers: newHeaders,
          query: { disableCookieCache: true },
        })
      }
    }
  } catch (error) {
    // 認証APIエラー時はセッションなしで続行
    console.error('[Auth Middleware] Failed to get/create session:', error)
  }

  return { session, setCookieHeader }
}
