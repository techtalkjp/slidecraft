import { AlertCircle, Home } from 'lucide-react'
import { Link, redirect, useRevalidator, useRouteError } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/ui/resizable'
import { getProject } from '~/lib/projects-repository.client'
import { loadSlides } from '~/lib/slides-repository.client'
import { ControlPanel } from './+control-panel'
import { EditorActions } from './+editor-actions'
import { MainPreview } from './+main-preview'
import { Sidebar } from './+sidebar'
import type { Route } from './+types/index'

export { clientAction } from './+actions'

export const handle = {
  breadcrumb: (data: Route.ComponentProps['loaderData']) => ({
    label: data.project.name,
  }),
}

export function meta({ data }: Route.MetaArgs): Route.MetaDescriptors {
  if (!data) {
    return [{ title: 'エディタ - SlideCraft' }]
  }
  return [
    { title: `${data.project.name} - SlideCraft` },
    { name: 'description', content: 'スライドを編集・修正' },
  ]
}

export async function clientLoader({
  request,
  params,
}: Route.ClientLoaderArgs) {
  const { projectId } = params
  const [project, slides] = await Promise.all([
    getProject(projectId),
    loadSlides(projectId),
  ])

  // プロジェクトが存在しない場合はプロジェクト一覧にリダイレクト
  if (!project) {
    throw redirect('/projects')
  }

  // スライドが存在しない場合はプロジェクト一覧にリダイレクト
  if (slides.length === 0) {
    throw redirect('/projects')
  }

  // クエリパラメータからスライドインデックスを取得
  const url = new URL(request.url)
  const slideParam = url.searchParams.get('slide')
  const selectedIndex = slideParam ? Number.parseInt(slideParam, 10) : 0

  // インデックスが範囲外の場合は0にリセット
  const validIndex =
    selectedIndex >= 0 && selectedIndex < slides.length ? selectedIndex : 0

  return { projectId, project, slides, selectedIndex: validIndex }
}

export default function Editor({ loaderData }: Route.ComponentProps) {
  const { projectId, slides, selectedIndex } = loaderData
  const revalidator = useRevalidator()

  const handleSlideUpdate = () => {
    revalidator.revalidate()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <EditorActions projectId={projectId} slides={slides} />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 overflow-hidden"
      >
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Sidebar
            projectId={projectId}
            slides={slides}
            selectedIndex={selectedIndex}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={55} minSize={40}>
          <MainPreview
            projectId={projectId}
            slide={slides[selectedIndex]}
            slideNumber={selectedIndex + 1}
            totalSlides={slides.length}
            onSlideUpdate={handleSlideUpdate}
            allSlides={slides}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <ControlPanel
            projectId={projectId}
            slide={slides[selectedIndex]}
            allSlides={slides}
            onSlideUpdate={handleSlideUpdate}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : '予期しないエラーが発生しました'}
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            ホームに戻る
          </Link>
        </Button>
      </div>
    </div>
  )
}
