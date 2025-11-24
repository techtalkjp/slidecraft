# React Router v7 - Actionsによるミューテーション処理の実装ガイド

React Router v7では、データの作成・更新・削除などのミューテーション処理をactionを通じて実装します。actionは従来の命令的なイベントハンドラと異なり、宣言的にミューテーションを定義できる仕組みです。このドキュメントでは、clientActionとactionの違い、実装パターン、そしてSlideCraftプロジェクトにおける最適な活用方法をまとめます。

## clientActionとactionの違い

React Router v7には、ミューテーション処理を実装するための2つの異なるアプローチが用意されています。clientActionとactionです。これらは実行環境と責務が明確に分かれており、適切に使い分けることでセキュリティとパフォーマンスの両立が可能になります。

clientActionはブラウザ内でのみ実行されるアクションです。サーバーとの通信を伴わず、クライアント側のリソースに直接アクセスします。ローカルストレージ、IndexedDB、Origin Private File System (OPFS) といったブラウザ固有のストレージ機能を操作する場合、clientActionが最適です。clientLoaderと組み合わせて使用することで、完全にクライアント側で完結するデータフローを構築できます。clientActionのコードはクライアントバンドルに含まれるため、ブラウザ環境でのみ利用可能なAPIを自由に呼び出せます。

一方、actionはサーバー上で実行されるアクションです。データベースへの書き込み、認証・認可処理、機密情報を扱う操作など、サーバー専属のリソースを必要とする場合に使用します。actionのコードはクライアントバンドルから削除されるため、環境変数やサーバー側のライブラリを安全に利用できます。セキュリティが重要な処理は必ずactionで実装すべきです。

両方のアクションが同じルートに定義されている場合、clientActionが優先されます。つまり、clientActionが存在するとactionは呼び出されません。この優先順位により、段階的な移行やオーバーライドが可能になります。

SlideCraftプロジェクトでは、OPFS (Origin Private File System) を使用してスライド画像をブラウザ内に保存しています。このため、ほとんどのミューテーション処理はclientActionで実装するのが適切です。ローカルストレージやIndexedDBへの操作もclientActionの責務に含まれます。一方、将来的にサーバー側でのデータベース管理や認証機能を追加する場合は、actionの導入を検討する必要があります。

## actionの基本的な使い方

actionは非同期関数として定義し、ルートファイルからエクスポートします。React Routerは自動的にこの関数を認識し、フォーム送信やプログラム的な呼び出しに応答します。

最もシンプルなactionの実装では、リクエストからFormDataを取得し、必要な処理を実行した後、結果を返すかリダイレクトします。

```typescript
// app/routes/projects/new.tsx
import { type Route } from './+types/new'

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    throw new Response('Not Found', { status: 404 })
  }

  const formData = await request.formData()
  const projectName = formData.get('projectName') as string

  // サーバーサイドでプロジェクト作成
  const project = await createProjectOnServer(projectName)

  // 新規作成後は詳細ページにリダイレクト
  return redirect(`/projects/${project.id}/edit`)
}
```

clientActionも同様のパターンで実装できますが、クライアント側のリソースにアクセスする点が異なります。

```typescript
// app/routes/projects/index.tsx
import { useRevalidator } from 'react-router'
import type { Route } from './+types/index'

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData()
  const projectId = formData.get('projectId') as string

  // クライアント側でプロジェクト削除
  await deleteProject(projectId)

  // 削除成功
  return { success: true, deletedId: projectId }
}
```

actionから値を返すと、その値はコンポーネント側でuseActionDataフックを通じてアクセスできます。リダイレクトが必要な場合は、redirect関数を使用します。redirect関数を呼び出すと、actionの実行が中断され、指定したURLへの遷移が発生します。

actionは複数の処理を扱うこともできます。この場合、FormDataに含まれる特別なフィールド（慣習的に\_actionという名前）を使って処理を分岐させます。

```typescript
import { redirect } from 'react-router'

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const action = formData.get('_action')

  if (action === 'create') {
    const project = await createProject(formData)
    return redirect(`/projects/${project.id}/edit`)
  }

  if (action === 'delete') {
    const projectId = formData.get('projectId') as string
    await deleteProject(projectId)
    return redirect('/projects')
  }

  return null
}
```

## Form送信とprogrammatic submission

React Routerでは、actionを呼び出す方法が3つ用意されています。それぞれがナビゲーション動作とユースケースにおいて異なる特性を持ちます。

Formコンポーネントは、最もシンプルで宣言的な方法です。通常のHTMLフォームと同様に使用できますが、React Routerがフォーム送信をインターセプトし、ナビゲーションとして処理します。

```typescript
import { Form } from 'react-router'

export default function CreateProject() {
  return (
    <Form method="post">
      <input type="text" name="projectName" required />
      <button type="submit">プロジェクト作成</button>
    </Form>
  )
}
```

Formコンポーネントを使用すると、送信時にナビゲーションが実行されます。URLが変更され、ブラウザ履歴に新しいエントリが追加されます。送信中は自動的にloading状態が管理され、actionの実行後はloaderDataが自動で再フェッチされます。この動作は、ページ遷移を伴う操作に適しています。

useSubmitフックは、イベントハンドラから動的にactionを呼び出す場合に使用します。Formコンポーネントと同様にナビゲーションが発生しますが、プログラム的に制御できる点が異なります。

```typescript
import { useSubmit } from 'react-router'

export default function MyComponent() {
  const submit = useSubmit()

  const handleSave = async () => {
    const formData = new FormData()
    formData.set('projectName', 'My Project')
    formData.set('_action', 'create')

    // プログラム的にアクション実行（ナビゲーション発生）
    submit(formData, { method: 'post' })
  }

  return (
    <button onClick={handleSave}>
      保存
    </button>
  )
}
```

useSubmitもFormと同様にナビゲーションを引き起こします。URLが変更され、actionの完了後にloading状態が自動で管理されます。イベントハンドラから呼び出せるため、条件分岐やバリデーション後の送信など、より複雑なフローに対応できます。

useFetcherは、最も重要なパターンです。FormやuseSubmitと決定的に異なるのは、ナビゲーションを引き起こさない点です。現在のページに留まったまま、actionを実行してデータを更新できます。

```typescript
import { useFetcher } from 'react-router'

export default function ProjectCard({ project }) {
  const fetcher = useFetcher()

  return (
    <div>
      <h3>{project.name}</h3>

      {/* fetcher.Form: ナビゲーション無し */}
      <fetcher.Form method="post" action={`/projects/${project.id}/delete`}>
        <button type="submit" disabled={fetcher.state !== 'idle'}>
          {fetcher.state === 'submitting' ? '削除中...' : '削除'}
        </button>
      </fetcher.Form>

      {/* または fetcher.submit() でプログラム的に */}
      <button
        onClick={() => {
          const formData = new FormData()
          fetcher.submit(formData, { method: 'post' })
        }}
      >
        削除
      </button>

      {/* エラーハンドリング */}
      {fetcher.data?.error && (
        <div className="text-red-600">{fetcher.data.error}</div>
      )}
    </div>
  )
}
```

useFetcherはナビゲーションを発生させず、URL変更もブラウザ履歴への影響もありません。fetcher.stateで独立した状態を管理し、fetcher.dataでアクション結果にアクセスします。複数のfetcherを同時に実行できるため、リスト内の各アイテムに対して独立した操作を実行する場合に最適です。

SlideCraftでは、editorページの候補選択処理にuseFetcherを使用します。候補を選択してもページ遷移は発生せず、その場でプレビューが更新されるべきです。一方、projectsページでの新規プロジェクト作成はFormまたはuseSubmitを使用し、作成後にエディタページへ遷移します。削除処理はuseFetcherを使用し、リストからアイテムを削除してもページ全体をリロードしません。

## エラーハンドリング

actionから返されるデータには、成功時の結果だけでなくエラー情報も含めることができます。useActionDataフックを使用すると、コンポーネント側でこのデータにアクセスできます。

```typescript
import { useActionData } from 'react-router'

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const projectName = formData.get('projectName') as string

  // バリデーション
  if (!projectName.trim()) {
    return {
      error: 'プロジェクト名は必須です',
      values: { projectName }
    }
  }

  try {
    const project = await createProject(projectName)
    return { success: true, project }
  } catch (error) {
    return {
      error: 'プロジェクト作成に失敗しました',
      values: { projectName }
    }
  }
}

export default function CreateProject() {
  const actionData = useActionData<typeof action>()

  return (
    <Form method="post">
      <input
        type="text"
        name="projectName"
        defaultValue={actionData?.values?.projectName}
        required
      />

      {actionData?.error && (
        <div className="text-red-600">{actionData.error}</div>
      )}

      <button type="submit">作成</button>
    </Form>
  )
}
```

useFetcherを使用する場合、fetcher.dataを通じて同様のエラーハンドリングが可能です。

```typescript
export default function ProjectCard({ project }) {
  const fetcher = useFetcher<typeof deleteAction>()

  return (
    <div>
      <fetcher.Form method="post" action={`/projects/${project.id}/delete`}>
        <button type="submit" disabled={fetcher.state !== 'idle'}>
          削除
        </button>
      </fetcher.Form>

      {fetcher.data?.error && (
        <div className="text-red-600">{fetcher.data.error}</div>
      )}

      {fetcher.data?.success && (
        <div className="text-green-600">削除しました</div>
      )}
    </div>
  )
}
```

actionでエラーをスローすると、エラーバウンダリがキャッチします。これは予期しない例外や致命的なエラーに対処する仕組みです。

```typescript
import { isRouteErrorResponse, useRouteError } from 'react-router'

export async function action({ request }: Route.ActionArgs) {
  try {
    // ... 処理
  } catch (error) {
    // 404エラー
    throw new Response('Not Found', { status: 404 })

    // または一般的なエラー
    // throw error  // ErrorBoundaryでキャッチ
  }
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div className="p-4">
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1>エラーが発生しました</h1>
      <p>{error instanceof Error ? error.message : '予期しないエラー'}</p>
    </div>
  )
}
```

通常のバリデーションエラーや業務上の失敗はactionの戻り値として返し、システムレベルのエラーはスローしてエラーバウンダリで処理します。この使い分けにより、ユーザー体験を損なわずに適切なエラー処理が実現できます。

## 楽観的UIとの統合

React 19のuseOptimisticフックをfetcherと組み合わせることで、ネットワーク遅延をユーザーに感じさせないUIを構築できます。楽観的UIは、サーバーからの応答を待たずにUIを先行して更新し、応答後に最終的な状態を確定する手法です。

```typescript
import { useFetcher } from 'react-router'
import { useOptimistic } from 'react'

interface Slide {
  id: string
  name: string
  currentGeneratedId?: string
}

export default function SlideEditor({ initialSlide }: { initialSlide: Slide }) {
  const fetcher = useFetcher<typeof updateSlideAction>()

  // 現在のスライド状態
  const [slide, setSlide] = useState(initialSlide)

  // 楽観的UI: 送信直後に即座に UI を更新
  const [optimisticSlide, addOptimisticUpdate] = useOptimistic(
    slide,
    (current, newValues: Partial<Slide>) => ({
      ...current,
      ...newValues,
    })
  )

  const handleSelectCandidate = (candidateId: string) => {
    // UI を即座に更新（楽観的）
    addOptimisticUpdate({ currentGeneratedId: candidateId })

    // 実際の更新リクエスト
    const formData = new FormData()
    formData.set('candidateId', candidateId)
    formData.set('slideId', slide.id)

    fetcher.submit(formData, { method: 'post', action: '/slides/select' })
  }

  // サーバーから結果が返ったら実際の状態を更新
  useEffect(() => {
    if (fetcher.data?.success) {
      setSlide(fetcher.data.updatedSlide)
    }
  }, [fetcher.data])

  return (
    <div>
      <h3>{optimisticSlide.name}</h3>
      <p>Selected: {optimisticSlide.currentGeneratedId}</p>

      {fetcher.state === 'submitting' && (
        <span className="text-sm text-blue-500">保存中...</span>
      )}
    </div>
  )
}
```

useOptimisticでUIを先行更新し、fetcher送信で実際のデータ更新を行い、サーバーレスポンスで最終的な状態を確定します。この流れにより、ユーザーは即座に操作結果を確認でき、ネットワーク遅延による待機時間を感じません。失敗時はuseEffect内でロールバック処理を実装することで、一貫性を保てます。

## Revalidationの仕組み

React Routerの重要な機能の一つがRevalidationです。actionから返ると、自動的にすべてのloaderが再実行されます。これにより、画面上のデータが常に最新の状態に保たれます。

```typescript
export async function createAction({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const project = await createProject(formData)

  // このアクションが終了すると、ページのすべての loader が自動で再実行
  return redirect(`/projects/${project.id}/edit`)
}

export async function projectsLoader() {
  // ページ初回ロード時と、アクション完了後に実行される
  return { projects: await loadProjects() }
}
```

手動でRevalidationをトリガーしたい場合は、useRevalidatorフックを使用します。

```typescript
import { useRevalidator } from 'react-router'

export default function MyComponent() {
  const revalidator = useRevalidator()

  const handleDelete = async () => {
    await deleteProject(projectId)

    // loader を明示的に再実行
    revalidator.revalidate()
  }

  return <button onClick={handleDelete}>削除</button>
}
```

SlideCraftでは、スライド更新後にloaderを再実行してUIを同期させます。

```typescript
// app/routes/_app/projects/$projectId/edit/index.tsx
export default function Editor({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator()

  const handleSlideUpdate = () => {
    // スライド更新後、loader を再実行
    revalidator.revalidate()
  }

  return (
    <MainPreview onSlideUpdate={handleSlideUpdate} />
  )
}
```

## 複数のactionを持つルートの扱い方

一つのルートで複数の異なるmutation処理を扱う場合、\_actionフィールドで処理を分岐させます。

```typescript
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const _action = formData.get('_action') as string

  if (_action === 'update') {
    return await handleUpdate(formData)
  }

  if (_action === 'delete') {
    return await handleDelete(formData)
  }

  if (_action === 'publish') {
    return await handlePublish(formData)
  }

  throw new Response('Invalid action', { status: 400 })
}

async function handleUpdate(formData: FormData) {
  const id = formData.get('id')
  const name = formData.get('name')
  // ...
  return { success: true }
}

async function handleDelete(formData: FormData) {
  const id = formData.get('id')
  // ...
  return { success: true }
}

async function handlePublish(formData: FormData) {
  const id = formData.get('id')
  // ...
  return { success: true }
}
```

各処理を独立した関数に分離することで、テストが容易になり、コードの見通しも良くなります。\_actionフィールドは単なる慣習ですが、広く採用されているパターンです。

複数の操作を同時に実行する必要がある場合は、複数のfetcherを使用します。

```typescript
export default function SlideManager({ slide }) {
  const updateFetcher = useFetcher()
  const deleteFetcher = useFetcher()
  const regenerateFetcher = useFetcher()

  return (
    <div>
      {/* 更新フォーム */}
      <updateFetcher.Form method="post" action={`/slides/${slide.id}/update`}>
        <input name="name" />
        <button type="submit">更新</button>
      </updateFetcher.Form>

      {/* 削除ボタン */}
      <deleteFetcher.Form method="post" action={`/slides/${slide.id}/delete`}>
        <button type="submit">削除</button>
      </deleteFetcher.Form>

      {/* 再生成ボタン */}
      <regenerateFetcher.Form method="post" action={`/slides/${slide.id}/regenerate`}>
        <button type="submit">再生成</button>
      </regenerateFetcher.Form>

      {/* 状態表示 */}
      <div>
        Update: {updateFetcher.state}
        Delete: {deleteFetcher.state}
        Regenerate: {regenerateFetcher.state}
      </div>
    </div>
  )
}
```

各操作は独立したfetcherを持ち、複数の操作を同時実行できます。各fetcherが独立したstateを保持するため、個別の進捗表示が可能です。

## ファイルアップロードなどの大きなデータの扱い

ファイルアップロードはmultipart/form-dataエンコーディングを使用して実装します。

```typescript
export async function uploadAction({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const file = formData.get('pdf') as File

  // ファイルバリデーション
  if (!file || file.type !== 'application/pdf') {
    return { error: 'PDFファイルを選択してください' }
  }

  if (file.size > 50 * 1024 * 1024) {
    return { error: 'ファイルサイズは50MB以下にしてください' }
  }

  try {
    // サーバーで処理（PDFをスライドに変換など）
    const slides = await processPdf(file)
    const project = await createProject(slides)

    return redirect(`/projects/${project.id}/edit`)
  } catch (error) {
    return { error: 'ファイル処理に失敗しました' }
  }
}

export default function UploadPage() {
  const actionData = useActionData<typeof uploadAction>()

  return (
    <Form method="post" encType="multipart/form-data">
      <input
        type="file"
        name="pdf"
        accept=".pdf"
        required
      />

      {actionData?.error && (
        <div className="text-red-600">{actionData.error}</div>
      )}

      <button type="submit">アップロード</button>
    </Form>
  )
}
```

SlideCraftではPDFからスライドへの変換をクライアント側で実行します。これにより、サーバーへのアップロード時間を削減し、プライバシーも保護できます。

```typescript
// app/routes/projects/new.tsx
export default function Upload() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const processFile = async (file: File) => {
    try {
      // ステップ1: プロジェクト作成
      const project = await createProject(file.name, 0)

      // ステップ2: クライアント側で PDF 変換（進捗表示付き）
      const slides = await convertPdfToSlides(
        project.id,
        file,
        (current, total) => setProgress({ current, total })
      )

      // ステップ3: スライド保存
      await saveSlides(project.id, slides)

      // ステップ4: エディタに遷移
      navigate(`/projects/${project.id}/edit`)
    } catch (error) {
      console.error('処理エラー:', error)
    }
  }

  return (
    // UI...
  )
}
```

大容量ファイル処理では、バリデーション（ファイル形式とサイズチェック）、進捗表示（ユーザーに処理状況を伝える）、エラーハンドリング（ネットワーク障害などに対応）、UX配慮（ブロッキング操作を避け、キャンセルオプション提供）が重要です。

## ベストプラクティス

設計段階では、まずナビゲーションが必要かを判断します。ページ遷移が必要な場合はFormまたはuseSubmitを使用し、現在のページに留まる場合はuseFetcherを使用します。次に処理の実行場所を決定します。サーバー専属リソース（データベース、認証）を扱う場合はaction、クライアント専属リソース（localStorage、IndexedDB、OPFS）を扱う場合はclientActionを選択します。最後に、複数の操作を並列実行する必要がある場合はuseFetcherを複数インスタンス化し、単一の操作の場合はFormやuseSubmitで十分です。

実装時は、型安全性を確保するため必ずtypeof actionで戻り値の型推論を活用します。エラーハンドリングは必ずtry-catchとエラー境界を実装し、ユーザー体験を損なわないようにします。ローディング状態は常に表示し、ユーザーが操作の進行状況を把握できるようにします。楽観的UIをuseOptimisticで実装することで、ネットワーク遅延を隠せます。バリデーションはクライアントとサーバー両側で実装し、セキュリティとUXの両立を図ります。大容量ファイルを扱う場合は、メモリ管理に注意しストリーミング処理を検討します。

SlideCraft向けには、すべてのmutationを集約したactions.tsxファイルを作成し、\_actionフィールドで処理を分岐させるパターンを推奨します。

```typescript
// +actions.tsx - すべてのmutationを集約
export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData()
  const _action = formData.get('_action') as string

  // 各処理に分岐
  if (_action === 'selectCandidate') {
    return await selectCandidateAction(formData, params.projectId)
  }

  if (_action === 'resetToOriginal') {
    return await resetToOriginalAction(formData, params.projectId)
  }

  throw new Response('Invalid action', { status: 400 })
}

// 各コンポーネントでuseFetcherを使用
export function CandidateImagesGrid({ slide }) {
  const fetcher = useFetcher<typeof clientAction>()

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="_action" value="selectCandidate" />
      <input type="hidden" name="slideId" value={slide.id} />
      <button type="submit" disabled={fetcher.state !== 'idle'}>
        選択
      </button>
    </fetcher.Form>
  )
}
```

このパターンにより、コードの見通しが良くなり、テストも容易になります。

## 参考資料

React Router Actions: https://reactrouter.com/start/framework/actions
useSubmit API: https://reactrouter.com/api/hooks/useSubmit
useFetcher API: https://reactrouter.com/api/hooks/useFetcher
Form vs Fetcher: https://reactrouter.com/explanation/form-vs-fetcher
