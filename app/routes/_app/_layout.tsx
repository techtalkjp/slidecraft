import { DurablyProvider } from '@coji/durably-react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Component, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AppSidebar } from '~/components/layout/app-sidebar'
import { Main } from '~/components/layout/main'
import { Button } from '~/components/ui/button'
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { useBreadcrumbs } from '~/hooks/use-breadcrumbs'
import { durablyPromise } from '~/jobs'
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

function DurablyFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
    </div>
  )
}

/**
 * Durably 初期化エラー時のフォールバック UI
 */
function DurablyErrorFallback({ error }: { error: Error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
      <div className="text-center">
        <p className="mb-4 text-red-600">
          ワークフローエンジンの初期化に失敗しました
        </p>
        <p className="mb-4 text-sm text-gray-600">{error.message}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          再読み込み
        </Button>
      </div>
    </div>
  )
}

/**
 * DurablyProvider のエラーをキャッチする ErrorBoundary
 */
class DurablyErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <DurablyErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

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
        <header className="bg-background grid h-10 grid-cols-[auto_1fr_auto] items-center border-b">
          <div className="flex h-full items-center border-r px-2">
            <SidebarTrigger />
          </div>
          <div className="px-4">
            <Breadcrumbs />
          </div>
          {isEditorPage && (
            <div id="editor-actions" className="flex items-center gap-2 px-4" />
          )}
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
    <DurablyErrorBoundary>
      <DurablyProvider durably={durablyPromise} fallback={<DurablyFallback />}>
        <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <AppLayoutContent isEditorPage={isEditorPage} />
        </SidebarProvider>
      </DurablyProvider>
    </DurablyErrorBoundary>
  )
}
