import { Outlet, useLocation } from 'react-router'
import { useEffect } from 'react'
import { AppSidebar } from '~/components/layout/app-sidebar'
import { Main } from '~/components/layout/main'
import { Separator } from '~/components/ui/separator'
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '~/components/ui/sidebar'
import { useBreadcrumbs } from '~/hooks/use-breadcrumbs'
import { cn } from '~/lib/utils'

function AppLayoutContent() {
  const { Breadcrumbs } = useBreadcrumbs()
  const location = useLocation()
  const { setOpen } = useSidebar()

  // エディタページかどうかを判定
  const isEditorPage = location.pathname.includes('/edit')

  // エディタページに遷移したときにサイドバーを閉じる
  useEffect(() => {
    if (isEditorPage) {
      setOpen(false)
    }
  }, [isEditorPage, setOpen])

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
        <header className="flex h-12 items-center gap-3 border-b bg-background px-4 sm:gap-4">
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
  return (
    <SidebarProvider>
      <AppLayoutContent />
    </SidebarProvider>
  )
}
