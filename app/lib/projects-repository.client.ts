/**
 * プロジェクト管理リポジトリ
 *
 * プロジェクト一覧の読み書きを管理する
 */

import { readFile, writeFile } from './storage.client'
import type { Project, ProjectsMetadata } from './types'

const PROJECTS_METADATA_PATH = 'projects.json'

/**
 * プロジェクト一覧を読み込む
 */
export async function loadProjects(): Promise<Project[]> {
  try {
    const blob = await readFile(PROJECTS_METADATA_PATH)
    const text = await blob.text()
    const metadata: ProjectsMetadata = JSON.parse(text)
    return metadata.projects
  } catch (_error) {
    // ファイルが存在しない場合は空配列を返す
    console.log('プロジェクト一覧が存在しません。空配列を返します。')
    return []
  }
}

/**
 * プロジェクト一覧を保存
 */
export async function saveProjects(projects: Project[]): Promise<void> {
  try {
    const metadata: ProjectsMetadata = {
      projects,
      updatedAt: new Date().toISOString(),
    }

    const json = JSON.stringify(metadata, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    await writeFile(PROJECTS_METADATA_PATH, blob)
  } catch (error) {
    console.error('プロジェクト一覧の保存に失敗しました:', error)
    throw new Error('プロジェクト一覧の保存に失敗しました')
  }
}

/**
 * プロジェクトを作成
 */
export async function createProject(
  name: string,
  slideCount: number,
): Promise<Project> {
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    slideCount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const projects = await loadProjects()
  projects.unshift(project) // 先頭に追加（最新が先頭）
  await saveProjects(projects)

  return project
}

/**
 * プロジェクトを更新
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'slideCount'>>,
): Promise<void> {
  const projects = await loadProjects()
  const index = projects.findIndex((p) => p.id === projectId)

  if (index === -1) {
    throw new Error(`プロジェクトが見つかりません: ${projectId}`)
  }

  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  await saveProjects(projects)
}

/**
 * プロジェクトを削除
 */
export async function deleteProject(projectId: string): Promise<void> {
  const projects = await loadProjects()
  const filtered = projects.filter((p) => p.id !== projectId)
  await saveProjects(filtered)
}

/**
 * プロジェクトを取得
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const projects = await loadProjects()
  return projects.find((p) => p.id === projectId) || null
}
