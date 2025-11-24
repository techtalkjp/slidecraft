import { FileText, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { deleteProject, loadProjects } from '~/lib/projects-repository.client'
import { loadSlideImage, loadSlides } from '~/lib/slides-repository.client'
import type { Project } from '~/lib/types'
import type { Route } from './+types/index'

export const handle = {
  breadcrumb: () => ({ label: 'プロジェクト', isRoot: true }),
}

export function meta(): Route.MetaDescriptors {
  return [
    { title: 'プロジェクト一覧 - SlideCraft' },
    {
      name: 'description',
      content: 'PDFスライドプロジェクトの一覧',
    },
  ]
}

export async function clientLoader() {
  const projects = await loadProjects()
  return { projects }
}

function ProjectCard({
  project,
  onDelete,
  isDeleting,
}: {
  project: Project
  onDelete: (projectId: string, e: React.MouseEvent) => void
  isDeleting: boolean
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let objectUrl: string | null = null

    const loadThumbnail = async () => {
      try {
        // プロジェクトのスライドを読み込む
        const slides = await loadSlides(project.id)
        if (!mounted || slides.length === 0) return

        // 最初のスライドの画像を読み込む
        const firstSlideBlob = await loadSlideImage(
          project.id,
          slides[0].id,
          'original',
        )
        if (mounted) {
          objectUrl = URL.createObjectURL(firstSlideBlob)
          setThumbnailUrl(objectUrl)
        }
      } catch (error) {
        console.error('サムネイル読み込みエラー:', error)
      }
    }

    loadThumbnail()

    return () => {
      mounted = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [project.id])

  return (
    <Link to={`/projects/${project.id}/edit`} className="group">
      <Card className="overflow-hidden transition-all hover:shadow-lg">
        <div className="aspect-video bg-slate-100">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={project.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FileText className="h-16 w-16 text-slate-300" />
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="mb-2 truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600">
            {project.name}
          </h3>

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {project.slideCount} スライド
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => onDelete(project.id, e)}
              disabled={isDeleting}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
            </Button>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {new Date(project.updatedAt).toLocaleDateString('ja-JP')}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const [projects, setProjects] = useState<Project[]>(loaderData.projects)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('このプロジェクトを削除してもよろしいですか？')) {
      return
    }

    setDeletingId(projectId)
    try {
      await deleteProject(projectId)
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
    } catch (err) {
      console.error('プロジェクト削除エラー:', err)
      alert('プロジェクトの削除に失敗しました')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">プロジェクト</h2>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            新規プロジェクト
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
            <FileText className="h-12 w-12 text-slate-400" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-700">
            プロジェクトがありません
          </h2>
          <p className="mb-6 text-slate-500">
            PDFをアップロードして新しいプロジェクトを作成しましょう
          </p>
          <Button asChild size="lg">
            <Link to="/projects/new">
              <Plus className="mr-2 h-5 w-5" />
              新規プロジェクト
            </Link>
          </Button>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-sm text-slate-600">
            {projects.length} 件のプロジェクト
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
                isDeleting={deletingId === project.id}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export function ErrorBoundary() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            エラーが発生しました
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            プロジェクト一覧の読み込みに失敗しました
          </p>
          <Button asChild className="w-full">
            <Link to="/">再読み込み</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
