import { AlertCircle, Home } from 'lucide-react'
import { Link, redirect, useRevalidator, useRouteError } from 'react-router'
import { match } from 'ts-pattern'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/ui/resizable'
import { ControlPanel } from './+/control-panel'
import { EditorActions } from './+/editor-actions'
import { MainPreview } from './+/main-preview'
import {
  deleteCandidate,
  resetToOriginal,
  selectCandidate,
} from './+/mutations'
import { getEditorData } from './+/queries'
import { Sidebar } from './+/sidebar'
import type { Route } from './+types/index'

export const handle = {
  breadcrumb: (data: Route.ComponentProps['loaderData']) => ({
    label: data.project.name,
  }),
}

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  if (!loaderData) {
    return [{ title: 'エディタ - SlideCraft' }]
  }
  return [
    { title: `${loaderData.project.name} - SlideCraft` },
    { name: 'description', content: 'スライドを編集・修正' },
  ]
}

export async function clientLoader({
  request,
  params,
}: Route.ClientLoaderArgs) {
  const data = await getEditorData(params.projectId, request.url)
  if (!data) throw redirect('/projects')
  return data
}

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const formData = await request.formData()
  const action = formData.get('_action') as string

  return match(action)
    .with('selectCandidate', () => selectCandidate(formData, params.projectId))
    .with('resetToOriginal', () => resetToOriginal(formData, params.projectId))
    .with('deleteCandidate', () => deleteCandidate(formData, params.projectId))
    .otherwise(() => {
      throw new Response('Invalid action', { status: 400 })
    })
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
            projectName={loaderData.project.name}
            slide={slides[selectedIndex]}
            slideNumber={selectedIndex + 1}
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
