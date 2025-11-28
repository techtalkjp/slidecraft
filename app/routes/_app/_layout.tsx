import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AppSidebar } from '~/components/layout/app-sidebar'
import { Main } from '~/components/layout/main'
import { Separator } from '~/components/ui/separator'
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { useBreadcrumbs } from '~/hooks/use-breadcrumbs'
import { auth } from '~/lib/auth/auth'
import { sessionContext } from '~/lib/auth/session.context'
import { cn } from '~/lib/utils'
import { getOrCreateSession } from './+/session-middleware'
import type { Route } from './+types/_layout'

/**
 * _app 配下のルートにアクセスしたときに匿名セッションを自動作成する middleware
 * セッションがなければ匿名サインインし、context に session を設定
 * Response に Set-Cookie を追加してクライアントにセッションを渡す
 */
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }, next) => {
    const { session, setCookieHeader } = await getOrCreateSession(
      request.headers,
      auth.api,
    )

    context.set(sessionContext, session)

    const response = await next()
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
