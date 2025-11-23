# ルート構造リファクタリング作業指示書（SOW）

## プロジェクト概要

SlideCraftアプリケーションのルート構造を、react-router-auto-routesの規約に従った保守性の高い設計に全面的に書き換える。現在のエディタページ（`/editor/:projectId`）をプロジェクト配下（`/projects/:projectId/edit`）に移動し、すべてのレイアウトコンポーネントを統一する。

## 作業範囲

### Phase 1: 共通レイアウトの作成

`routes/_app+/_layout.tsx`を新規作成し、認証済みページ全体で共有する基盤レイアウトを実装する。このレイアウトは、SidebarProvider、AppSidebar、Header（SidebarTrigger、Separator、Breadcrumbsを含む）、そしてOutletを配置したMainコンポーネントで構成する。

既存の`projects.tsx`および`settings.tsx`から共通レイアウト部分を抽出し、新しい`_app+/_layout.tsx`に移動する。各ルートファイルは最小限のコードのみを保持し、ページ固有のロジックに集中できるようにする。

### Phase 2: プロジェクト関連ルートの再構成

プロジェクト一覧と新規作成ページを`routes/_app+/projects+/`配下に移動する。具体的には、現在の`projects._index.tsx`を`routes/_app+/projects+/_index/route.tsx`に、`projects.new.tsx`を`routes/_app+/projects+/new/route.tsx`に移動する。

各ルートファイルに`handle.breadcrumb`を追加し、パンくずリスト表示を統一的に処理できるようにする。プロジェクト一覧では「プロジェクト」というラベルと`/projects`へのリンクを定義する。

### Phase 3: エディタページの移動

現在の`routes/editor.$projectId.tsx`とその関連ファイル群を`routes/_app+/projects+/$projectId+/edit/`配下に移動する。メインロジックを`route.tsx`に配置し、関連コンポーネントは`+`プレフィックスを使用して同じディレクトリにcolocationする。

具体的なファイル配置は以下の通りである。`route.tsx`にはclientLoader、メインコンポーネント、ErrorBoundaryを実装する。`+header.tsx`にはエディタ固有のヘッダーコンポーネント（スライド枚数表示、API設定リンク、PDF書き出しボタンなど）を配置する。`+sidebar.tsx`にはスライド一覧サイドバーを、`+control-panel.tsx`にはAI編集パネルを、`+main-preview.tsx`にはプレビュー表示コンポーネントをそれぞれ配置する。

エディタページの`handle.breadcrumb`では、loaderから取得したプロジェクト名を動的に表示する。これにより「Home > プロジェクト > [プロジェクト名]」というパンくずリストが実現される。

### Phase 4: 設定ページの再構成

現在の`settings._index.tsx`を`routes/_app+/settings+/_index/route.tsx`に移動する。設定ページも他のページと同様に、`handle.breadcrumb`を定義して統一的なパンくずリスト表示を実現する。

### Phase 5: 旧ファイルの削除

すべての移行が完了し、動作確認が取れた後、以下の旧ファイルを削除する。`routes/projects.tsx`、`routes/projects._index.tsx`、`routes/projects.new.tsx`、`routes/editor.$projectId.tsx`とその配下のすべてのファイル、`routes/settings.tsx`、`routes/settings._index.tsx`を対象とする。

## 成果物

### 新規作成ファイル

```
routes/_app+/_layout.tsx
routes/_app+/projects+/_index/route.tsx
routes/_app+/projects+/new/route.tsx
routes/_app+/projects+/$projectId+/edit/route.tsx
routes/_app+/projects+/$projectId+/edit/+header.tsx
routes/_app+/projects+/$projectId+/edit/+sidebar.tsx
routes/_app+/projects+/$projectId+/edit/+control-panel.tsx
routes/_app+/projects+/$projectId+/edit/+main-preview.tsx
routes/_app+/settings+/_index/route.tsx
```

### 削除ファイル

```
routes/projects.tsx
routes/projects._index.tsx
routes/projects.new.tsx
routes/editor.$projectId.tsx
routes/editor.$projectId/+header.tsx
routes/editor.$projectId/+sidebar.tsx
routes/editor.$projectId/+control-panel.tsx
routes/editor.$projectId/+main-preview.tsx
routes/settings.tsx
routes/settings._index.tsx
```

### 既存ファイルへの影響

`app/hooks/use-breadcrumbs.tsx`は現状のまま使用を継続する。各ルートファイルから呼び出されるため、変更の必要はない。

`app/components/layout/`配下のコンポーネント群（AppSidebar、Header、Mainなど）も現状のまま使用を継続する。新しい共通レイアウトから参照される形となる。

## 実装手順

各フェーズを順番に実装し、フェーズごとに以下の確認作業を行う。

型チェックの実施として`pnpm typecheck`を実行し、TypeScriptエラーがないことを確認する。動作確認として開発サーバーを起動し、該当ページが正しく表示されることを確認する。ナビゲーションテストとして、各ページ間の遷移が正常に機能することを確認する。Breadcrumbs表示の確認として、各ページでパンくずリストが適切に表示されることを確認する。

各フェーズの確認が完了したら、Gitコミットを作成する。コミットメッセージには「refactor: Phase X - [フェーズ名]」という形式を使用する。

## 品質基準

すべてのページでAppSidebarが正しく表示され、開閉が機能することを確認する。Breadcrumbsがすべてのページで統一的に表示され、リンクが正しく機能することを確認する。URLパスが設計通りに変更され、`/projects/:projectId/edit`でエディタにアクセスできることを確認する。

エディタページのすべての機能（スライド一覧、プレビュー、AI編集、PDF書き出し）が正常に動作することを確認する。TypeScriptの型エラーが存在しないことを確認する。不要なコードや未使用のimportが残っていないことを確認する。

## リスク管理

移行中のバグリスクに対しては、各フェーズごとに動作確認を行い、問題があれば即座に前のコミットに戻す。

レイアウトの破損リスクに対しては、Phase 1で共通レイアウトを慎重に実装し、既存ページで動作確認してから次のフェーズに進む。

URLパス変更による混乱リスクに対しては、未リリースのため影響はないが、開発チーム内で新しいURL構造を共有する。

## 完了条件

すべての新規ファイルが作成され、期待通りに動作している。すべての旧ファイルが削除されている。`pnpm typecheck`がエラーなく完了する。すべてのページが正しく表示され、ナビゲーションが機能する。Breadcrumbsがすべてのページで適切に表示される。

これらの条件がすべて満たされた時点で、リファクタリング作業は完了とする。
