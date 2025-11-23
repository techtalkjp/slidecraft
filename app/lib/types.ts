/**
 * 生成された画像候補を表す型
 */
export interface GeneratedImage {
  /** 生成画像の一意識別子 (UUID) */
  id: string
  /** 使用したプロンプト */
  prompt: string
  /** 生成時刻 (ISO 8601形式) */
  timestamp: string
}

/**
 * スライドを表す型
 *
 * 画像データ自体は含まず、OPFSのファイルパスで参照する設計。
 * - オリジナル画像: /slidecraft/images/{id}/original.png
 * - カレント画像: /slidecraft/images/{id}/current.png
 * - 生成画像: /slidecraft/images/{id}/generated/{generatedId}.png
 */
export interface Slide {
  /** スライドの一意識別子 (UUID) */
  id: string
  /** PDFの元のページインデックス（0始まり） */
  pageIndex: number
  /** 最後に使用したプロンプト */
  lastPrompt?: string
  /** 生成された候補の配列（最新が先頭） */
  generatedCandidates: GeneratedImage[]
  /** 現在適用中の生成画像ID（nullの場合はオリジナルを表示） */
  currentGeneratedId?: string
}

/**
 * スライドメタデータ（/slidecraft/projects/{projectId}/slides.jsonに保存される）
 */
export interface SlidesMetadata {
  /** スライドの配列 */
  slides: Slide[]
  /** メタデータの最終更新時刻 (ISO 8601形式) */
  updatedAt: string
}

/**
 * プロジェクト（PDFドキュメント）を表す型
 */
export interface Project {
  /** プロジェクトの一意識別子 (UUID) */
  id: string
  /** プロジェクト名 */
  name: string
  /** スライド枚数 */
  slideCount: number
  /** 作成日時 (ISO 8601形式) */
  createdAt: string
  /** 最終更新日時 (ISO 8601形式) */
  updatedAt: string
}

/**
 * プロジェクト一覧メタデータ（/slidecraft/projects.jsonに保存される）
 */
export interface ProjectsMetadata {
  /** プロジェクトの配列（最新が先頭） */
  projects: Project[]
  /** メタデータの最終更新時刻 (ISO 8601形式) */
  updatedAt: string
}
