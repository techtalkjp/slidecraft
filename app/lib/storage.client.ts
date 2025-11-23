/**
 * OPFS (Origin Private File System) ユーティリティ関数
 *
 * このファイルは .client.ts 拡張子を使用しており、クライアントサイドでのみバンドルされる。
 * OPFSは全てのファイルを /slidecraft/ サブディレクトリ以下に配置する。
 */

const OPFS_ROOT_DIR = 'slidecraft'

/**
 * ブラウザがOPFSに対応しているか確認
 */
function checkOpfsSupport(): void {
  if (!navigator.storage?.getDirectory) {
    throw new Error(
      'このブラウザはOrigin Private File System (OPFS)に対応していません。Chrome 86+、Safari 15.2+をお試しください。',
    )
  }
}

/**
 * OPFSのルートディレクトリハンドルを取得
 * /slidecraft/ サブディレクトリを作成または取得して返す
 */
export async function getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
  checkOpfsSupport()

  const root = await navigator.storage.getDirectory()
  const slidecraftDir = await root.getDirectoryHandle(OPFS_ROOT_DIR, {
    create: true,
  })

  return slidecraftDir
}

/**
 * パスを "/" で分割して配列に変換
 * 例: "images/slide1/original.png" => ["images", "slide1", "original.png"]
 */
function parsePath(path: string): string[] {
  return path
    .split('/')
    .filter((segment) => segment.length > 0 && segment !== '.')
}

/**
 * 指定パスのディレクトリを再帰的に作成
 * 既に存在する場合は何もしない
 *
 * @param path ディレクトリパス（例: "images/slide1"）
 */
export async function ensureDirectory(path: string): Promise<void> {
  const root = await getOpfsRoot()
  const segments = parsePath(path)

  let currentDir = root
  for (const segment of segments) {
    currentDir = await currentDir.getDirectoryHandle(segment, { create: true })
  }
}

/**
 * ファイルを指定パスに書き込む
 *
 * @param path ファイルパス（例: "slides.json", "images/slide1/original.png"）
 * @param data 書き込むデータ（Blob）
 */
export async function writeFile(path: string, data: Blob): Promise<void> {
  const segments = parsePath(path)
  const fileName = segments.pop()

  if (!fileName) {
    throw new Error(`無効なファイルパス: ${path}`)
  }

  // 親ディレクトリを作成
  if (segments.length > 0) {
    await ensureDirectory(segments.join('/'))
  }

  // ファイルハンドルを取得
  const root = await getOpfsRoot()
  let currentDir = root
  for (const segment of segments) {
    currentDir = await currentDir.getDirectoryHandle(segment)
  }

  const fileHandle = await currentDir.getFileHandle(fileName, { create: true })
  const writable = await fileHandle.createWritable()

  try {
    await writable.write(data)
  } finally {
    await writable.close()
  }
}

/**
 * 指定パスのファイルを読み込む
 *
 * @param path ファイルパス（例: "slides.json", "images/slide1/original.png"）
 * @returns ファイルのBlob
 * @throws ファイルが存在しない場合はエラー
 */
export async function readFile(path: string): Promise<Blob> {
  const segments = parsePath(path)
  const fileName = segments.pop()

  if (!fileName) {
    throw new Error(`無効なファイルパス: ${path}`)
  }

  const root = await getOpfsRoot()
  let currentDir = root
  for (const segment of segments) {
    currentDir = await currentDir.getDirectoryHandle(segment)
  }

  const fileHandle = await currentDir.getFileHandle(fileName)
  const file = await fileHandle.getFile()

  return file
}

/**
 * 指定パスのファイルが存在するか確認
 *
 * @param path ファイルパス
 * @returns ファイルが存在すればtrue
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path)
    return true
  } catch {
    return false
  }
}

/**
 * 指定パスのファイルを削除
 *
 * @param path ファイルパス
 */
export async function deleteFile(path: string): Promise<void> {
  const segments = parsePath(path)
  const fileName = segments.pop()

  if (!fileName) {
    throw new Error(`無効なファイルパス: ${path}`)
  }

  const root = await getOpfsRoot()
  let currentDir = root
  for (const segment of segments) {
    currentDir = await currentDir.getDirectoryHandle(segment)
  }

  await currentDir.removeEntry(fileName)
}

/**
 * 指定パスのディレクトリを再帰的に削除
 *
 * @param path ディレクトリパス
 */
export async function deleteDirectory(path: string): Promise<void> {
  const segments = parsePath(path)
  const dirName = segments.pop()

  if (!dirName) {
    throw new Error(`無効なディレクトリパス: ${path}`)
  }

  const root = await getOpfsRoot()
  let currentDir = root
  for (const segment of segments) {
    currentDir = await currentDir.getDirectoryHandle(segment)
  }

  await currentDir.removeEntry(dirName, { recursive: true })
}

/**
 * 指定ディレクトリ内のエントリ一覧を取得
 *
 * @param path ディレクトリパス（空文字列の場合はルート）
 * @returns エントリ名の配列
 */
export async function listDirectory(path: string = ''): Promise<string[]> {
  const root = await getOpfsRoot()
  let currentDir = root

  if (path) {
    const segments = parsePath(path)
    for (const segment of segments) {
      currentDir = await currentDir.getDirectoryHandle(segment)
    }
  }

  const entries: string[] = []
  // @ts-expect-error - FileSystemDirectoryHandleはAsyncIterableだが型定義が不完全
  for await (const [name] of currentDir.entries()) {
    entries.push(name)
  }

  return entries
}
