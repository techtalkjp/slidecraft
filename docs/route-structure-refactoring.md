# ルート構造リファクタリング設計

## 現状の課題

現在のルート構造は、エディタページが独立したルートとして実装されており、プロジェクト一覧や設定ページとレイアウトコードが重複している。具体的には、SidebarProviderやAppSidebarの設定が`projects.tsx`と`editor.$projectId.tsx`で繰り返され、Breadcrumbsの処理も統一されていない。projectsとsettingsはレイアウトファイルでBreadcrumbsを処理する一方、editorは専用のHeaderコンポーネントで独自に処理している。

この設計上の問題により、SidebarTriggerボタンがeditor専用Headerに重複実装されており、他のページとの統一感が失われている。より本質的な問題として、editorは機能的にはprojectsの子要素であるにもかかわらず、ルート構造がこの階層関係を反映していない。URLパスも`/editor/:projectId`となっており、論理的には`/projects/:projectId/edit`であるべき構造が実現できていない。

## 設計方針

この課題を解決するため、react-router-auto-routesとshadcn-admin-react-routerの規約に従った構造へリファクタリングする。主要な設計原則は以下の通りである。

まず、Pathless Layout Groupsパターンを採用し、`_app+/`ディレクトリ配下で認証済みページ共通のレイアウトを適用する。これにより、URLパスに`_app`が含まれることなく、すべての認証済みページで同じレイアウトコンポーネントを共有できる。

次に、Nested Layoutsを活用して階層的なレイアウト構造を実現する。`_layout/route.tsx`パターンにより、親子関係を持つページ群で段階的にレイアウトを重ねられる。例えば、プロジェクト全体の共通レイアウトの上に、エディタ固有のレイアウトを重ねることが可能になる。

Colocationの原則に従い、ルートファイルと関連するコンポーネントやヘルパー関数を同じディレクトリに配置する。`+`プレフィックスを使用することで、これらの関連ファイルがルートとして認識されることを防ぎつつ、論理的なまとまりを保つ。

Breadcrumb処理は、各ルートで`handle.breadcrumb`を定義し、useBreadcrumbsフックで統一的に処理する。これにより、どのページでも一貫したパンくずリスト表示が実現できる。

## 理想的な構造

リファクタリング後の理想的なディレクトリ構造を以下に示す。ルート直下には引き続きランディングページの`_index.tsx`を配置し、認証済みページはすべて`_app+/`配下に集約する。

```
routes/
├── _index.tsx                                         → / (ランディングページ)
│
└── _app+/                                             → Pathless layout group
    ├── _layout.tsx                                    → 共通レイアウト
    │                                                     (SidebarProvider, AppSidebar,
    │                                                      Header with Breadcrumbs, Main)
    │
    ├── projects+/                                     → /projects グループ
    │   ├── _index/                                    → /projects
    │   │   └── route.tsx                              → プロジェクト一覧
    │   │
    │   ├── new/                                       → /projects/new
    │   │   └── route.tsx                              → 新規プロジェクト作成
    │   │
    │   └── $projectId+/                               → /projects/:projectId グループ
    │       └── edit/                                  → /projects/:projectId/edit
    │           ├── route.tsx                          → エディタメインロジック
    │           ├── +header.tsx                        → エディタ固有ヘッダー
    │           ├── +sidebar.tsx                       → スライド一覧サイドバー
    │           ├── +control-panel.tsx                 → AI編集パネル
    │           └── +main-preview.tsx                  → プレビュー表示
    │
    └── settings+/                                     → /settings グループ
        └── _index/                                    → /settings
            └── route.tsx                              → API設定ページ
```

`_app+/_layout.tsx`が認証済みページ全体の共通レイアウトを提供し、SidebarProvider、AppSidebar、Header（SidebarTrigger、Separator、Breadcrumbsを含む）、そしてOutletを配置したMainコンポーネントを含む。

プロジェクト関連の機能は`projects+/`グループにまとめる。`_index/route.tsx`がプロジェクト一覧を、`new/route.tsx`が新規作成ページを担当する。エディタは`$projectId+/edit/`配下に配置し、route.tsxがメインロジックを、`+`プレフィックス付きファイル群（header.tsx、sidebar.tsx、control-panel.tsx、main-preview.tsx）が関連コンポーネントを担当する。

設定機能は`settings+/`グループにまとめ、`_index/route.tsx`がAPI設定ページを提供する。

## 実装の進め方

実装は段階的に進める。まず共通レイアウトの統一化から始め、次にEditorの移動、最後にBreadcrumbs階層の整理という3つのフェーズで構成する。

### 共通レイアウトの統一化

最初のフェーズでは、AppSidebarとBreadcrumbsを共通レイアウトで管理できるようにする。`routes/_app+/_layout.tsx`を新規作成し、SidebarProvider、AppSidebar、そしてHeader（SidebarTrigger、Separator、Breadcrumbsを含む）、MainにOutletを配置したコンポーネントを実装する。

既存の`projects.tsx`と`settings.tsx`から共通部分を抽出し、新しい共通レイアウトに移動する。これにより、重複コードが削減され、将来的な変更も一箇所で管理できるようになる。

### Editorの移動

第二フェーズでは、エディタページを論理的に正しい位置に移動する。現在の`/editor/:projectId`を`/projects/:projectId/edit`に変更し、URLパスが機能階層を適切に反映するようにする。

`routes/_app+/projects+/$projectId+/edit/route.tsx`を新規作成し、現在の`editor.$projectId.tsx`からロジックを移動する。`handle.breadcrumb`を定義し、プロジェクト名を動的に表示できるようにする。必要に応じて`routes/_app+/projects+/$projectId+/_layout.tsx`を作成し、Editor専用のスライド一覧サイドバーなど、複数ページで共有する要素を配置する。

関連コンポーネントは`+`プレフィックスを使用して同じディレクトリに配置する。`+header.tsx`にEditor固有のヘッダーコンポーネント、`+sidebar.tsx`にスライド一覧サイドバー、`+control-panel.tsx`にAI編集パネル、`+main-preview.tsx`にプレビュー表示をそれぞれ配置する。

### Breadcrumbs階層の整理

第三フェーズでは、論理的なパンくずリスト階層を実現する。各ルートで`handle.breadcrumb`を適切に定義し、親子関係を明確にする。

プロジェクト関連のレイアウトでは「プロジェクト」というラベルと`/projects`へのリンクを定義する。エディタページでは、loaderから取得したプロジェクト名をラベルに使用し、必要に応じて編集ページへのリンクを設定する。

この実装により、プロジェクト一覧では「Home > プロジェクト」、エディタでは「Home > プロジェクト > [プロジェクト名]」、設定では「Home > 設定」というパンくずリストが表示される。旧ファイルは移行完了後に削除する。

## 移行の利点

このリファクタリングにより、複数の利点が得られる。

まず、DRY原則が実現され、レイアウトコードの重複が完全に排除される。共通レイアウトの変更が一箇所で済むため、メンテナンスコストが大幅に削減される。

URLパスが機能の階層を正しく反映するようになり、直感的なナビゲーションが可能になる。ユーザーはURLを見ただけで、現在どのプロジェクトのどの機能にいるかを理解できる。

新しいページの追加が容易になり、例えば将来的に`/projects/:projectId/settings`のようなプロジェクト個別設定ページを追加する際も、既存パターンに従うだけで統一されたレイアウトを持つページを作成できる。

すべてのページでBreadcrumbs、Sidebar、Headerが同じパターンで実装されるため、統一的なユーザー体験が提供される。ユーザーは一度操作方法を学べば、すべてのページで同じように操作できる。

## 想定される課題と対策

移行に際しては、いくつかの懸念事項が存在する。

Editor固有のレイアウト要素については、`+`プレフィックスによるcolocationか、`$projectId+/_layout.tsx`によるネストレイアウトで対応する。どちらのアプローチも、機能の独立性を保ちながら共通レイアウトの恩恵を受けられる。

移行中のバグリスクは、段階的な実装とこまめなcommitで軽減する。各フェーズ完了時に動作確認を行い、問題があれば即座に前の状態に戻せるようにする。

## 実装手順

実装は以下の手順で進める。まずこのデザインドキュメントをレビューし、方針に問題がないか確認する。次にPhase 1から順次実装を開始し、各Phase完了時に必ず動作確認とcommitを行う。すべてのフェーズが完了したら、旧ファイルを削除して移行を完了させる。

この段階的なアプローチにより、リスクを最小限に抑えながら、保守性と拡張性に優れたルート構造を実現できる。
