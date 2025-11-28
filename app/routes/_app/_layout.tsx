import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import type { Route } from './+types/_layout'
import { AppSidebar } from '~/components/layout/app-sidebar'
import { Main } from '~/components/layout/main'
import { Separator } from '~/components/ui/separator'
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { useBreadcrumbs } from '~/hooks/use-breadcrumbs'
import { cn } from '~/lib/utils'
import { auth } from '~/lib/auth/auth'
import { sessionContext } from '~/lib/auth/session.context'

/**
 * _app 配下のルートにアクセスしたときに匿名セッションを自動作成する middleware
 * セッションがなければ匿名サインインし、context に session を設定
 * Response に Set-Cookie を追加してクライアントにセッションを渡す
 */
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }, next) => {
    let session = null
    let setCookieHeader: string | null = null

    try {
      // 既存セッションを確認
      session = await auth.api.getSession({ headers: request.headers })

      // セッションがなければ匿名サインイン
      if (!session) {
        const signInResponse = await auth.api.signInAnonymous({
          headers: request.headers,
          asResponse: true,
        })
        if (signInResponse) {
          setCookieHeader = signInResponse.headers.get('set-cookie')
          // 新しい cookie を使ってセッションを再取得
          const newHeaders = new Headers(request.headers)
          if (setCookieHeader) {
            // Set-Cookie から cookie 値を抽出して Cookie ヘッダーに設定
            const cookieValue = setCookieHeader.split(';')[0]
            newHeaders.set('cookie', cookieValue)
          }
          session = await auth.api.getSession({ headers: newHeaders })
        }
      }
    } catch (error) {
      // 認証APIエラー時はセッションなしで続行（アプリはセッションなしでも動作可能）
      console.error('[Auth Middleware] Failed to get/create session:', error)
    }

    context.set(sessionContext, session)

    // 次の処理を実行
    const response = await next()

    // Set-Cookie があれば Response に追加
    if (setCookieHeader && response) {
      response.headers.append('set-cookie', setCookieHeader)
    }

    return response
  },
]

function AppLayoutContent({ isEditorPage }: { isEditorPage: boolean }) {
  const { Breadcrumbs } = useBreadcrumbs()

  return (
    <>
      <AppSidebar />
      <div
        id="content"
        className={cn(
          'ml-auto w-full max-w-full',
          'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon))]',
          'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
          'transition-[width] duration-200 ease-linear',
          'flex h-svh flex-col',
        )}
      >
        <header className="bg-background flex h-12 items-center gap-3 border-b px-4 sm:gap-4">
          <SidebarTrigger className="-ml-1 scale-125 sm:scale-100" />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex w-full items-center justify-between gap-2">
            <Breadcrumbs />
            {isEditorPage && (
              <div id="editor-actions" className="flex items-center gap-2" />
            )}
          </div>
        </header>
        {isEditorPage ? (
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        ) : (
          <Main>
            <Outlet />
          </Main>
        )}
      </div>
    </>
  )
}

export default function AppLayout() {
  const location = useLocation()
  const isEditorPage = location.pathname.includes('/edit')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  /**
   * ナビゲーション時のサイドバー状態管理
   * External system: React Router (location.pathname)
   *
   * エディタページではサイドバーを自動的に縮小し、
   * 通常ページでは展開することでワークスペースを最適化
   */
  useEffect(() => {
    setSidebarOpen(!isEditorPage)
  }, [isEditorPage])

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppLayoutContent isEditorPage={isEditorPage} />
    </SidebarProvider>
  )
}
