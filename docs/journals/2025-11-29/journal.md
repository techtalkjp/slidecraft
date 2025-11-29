# 2025-11-29 作業ジャーナル

## 認証基盤テスト追加とセキュリティ修正

### ユーザー指示

レビューで指摘されたテストを追加。マイグレーションスクリプトのパストラバーサル対策、セッションミドルウェアの API 障害時の挙動、Cron ジョブのクリーンアップロジック。その後 `BETTER_AUTH_SECRET` 未設定の Critical Issue への対応。

### ユーザー意図（推測）

認証基盤を本番投入する前に、セキュリティと信頼性の観点で十分なテストカバレッジを確保したい。特に外部 API 障害時のグレースフルデグラデーションと、セキュリティ上のリスク（パストラバーサル、secret 未設定）を潰しておきたい。

### 作業内容

マイグレーションスクリプトに `validateMigrationName` 関数を追加し、パストラバーサルや SQL インジェクションを試みる不正なマイグレーション名を検出するテストを作成した。正規表現 `/^[\w-]+$/` で英数字とハイフンのみを許可する。

セッションミドルウェアのテストでは、既存セッションがある場合のパススルー、セッションがない場合の匿名セッション作成、API 障害時のグレースフルハンドリング、signInAnonymous 後のセッション取得失敗、signInAnonymous が null を返すケースをカバーした。凝集度ガイドラインに従い `app/routes/_app/+/session-middleware.ts` にロジックを抽出。

Cron ジョブのテストでは `verifyCronAuth` と `cleanupSessions` を `+/cleanup.ts` に抽出し、本番/開発環境での認証挙動、期限切れセッション削除、孤立匿名ユーザー削除、DB エラー伝播をテストした。

テストファイルがルートとして認識される問題は `react-router-auto-routes` の `ignoredRouteFiles` オプションで解決した。

`BETTER_AUTH_SECRET` 未設定の Critical Issue に対応するため、環境変数バリデーションの仕組みを導入した。

1. `app/lib/env.server.ts` を新規作成し、Zod v4 でスキーマを定義
2. 本番環境では `BETTER_AUTH_SECRET`（32文字以上）、`BETTER_AUTH_URL`、`CRON_SECRET` を必須とし、開発環境ではオプショナル
3. `entry.server.tsx` でサーバー起動時に `init()` を呼び出してバリデーション実行
4. `auth.ts` に `secret: process.env.BETTER_AUTH_SECRET` を追加

Zod v4 では `z.url()` が推奨（`z.string().url()` は deprecated）、`error.flatten()` の代わりに `z.prettifyError()` を使用。

prettier と biome で `app/generated` を無視するよう設定した。

### 成果物

- `scripts/migrate-turso.test.ts` - マイグレーション名バリデーションのテスト
- `app/routes/_app/+/session-middleware.ts` - セッションミドルウェアのロジック抽出
- `app/routes/_app/+/session-middleware.test.ts` - セッションミドルウェアのテスト
- `app/routes/api/cron/cleanup-sessions/+/cleanup.ts` - クリーンアップロジック抽出
- `app/routes/api/cron/cleanup-sessions/+/cleanup.test.ts` - クリーンアップのテスト
- `app/routes.ts` - `ignoredRouteFiles` 追加
- `vitest.config.ts` - scripts ディレクトリをテスト対象に追加
- `app/lib/env.server.ts` - 環境変数バリデーション
- `app/entry.server.tsx` - env.server の init 呼び出し
- `app/lib/auth/auth.ts` - secret 設定追加
- `.prettierignore`、`biome.json` - generated 除外
- `package.json` - zod 追加

### 改善提案

1. 環境変数の型安全性を確保する仕組みは最初から入れておくべきだった。`BETTER_AUTH_SECRET` のような重要な設定が漏れるリスクを防げる。

2. レビュー指摘を受けてからテストを書くのではなく、ロジック抽出時にテストを同時に書く習慣をつけると手戻りが減る。

---

## Vercel デプロイ修正

### ユーザー指示

デプロイしたら動かない。環境変数が空。techtalk チームではなく mizoguchi-coji になっている。middleware のエラー「Invalid `context` value provided to `handleRequest`. When middleware is enabled you must return an instance of `RouterContextProvider` from your `getLoadContext` function.」

### ユーザー意図（推測）

認証基盤を本番環境にデプロイして動作確認したい。

### 作業内容

最初の問題は Vercel プロジェクトが `mizoguchi-cojis-projects` に紐づいていたこと。`.vercel` を削除して `vercel link --scope techtalk --yes` で techtalk チームに再リンクした。

techtalk チームの slidecraft には環境変数が設定されていなかったため、以下を追加した。

- `DATABASE_URL` - Turso データベース URL
- `DATABASE_AUTH_TOKEN` - Turso 認証トークン（`turso db tokens create slidecraft` で生成）
- `BETTER_AUTH_SECRET` - セッション署名用シークレット（`openssl rand -base64 32` で生成）
- `BETTER_AUTH_URL` - https://www.slidecraft.work
- `BETTER_AUTH_TRUSTED_ORIGINS` - https://www.slidecraft.work
- `CRON_SECRET` - Cron ジョブ認証用（`openssl rand -hex 16` で生成）

次の問題は React Router v7 の middleware と Vercel preset の互換性問題。Vercel preset はデフォルトで `AppLoadContext` を使うが、middleware は `RouterContextProvider` を必要とする。

https://zenn.dev/yuheitomi/articles/rr7-middleware-vercel を参考に、カスタムサーバーエントリを作成して解決した。

1. `server/app.ts` を作成し、`RouterContextProvider` を渡す `createRequestHandler` を定義
2. `vite.config.ts` で SSR ビルド時に `server/app.ts` をエントリポイントとして指定

マイグレーションスクリプトの SQL インジェクション対策として `escapeSqlString` 関数を追加し、INSERT 文で値をエスケープするようにした。

### 成果物

- `.vercel` - techtalk チームに再リンク
- Vercel 環境変数 - 6 個追加
- `server/app.ts` - カスタムリクエストハンドラー（RouterContextProvider 対応）
- `vite.config.ts` - SSR ビルドのエントリポイント設定
- `scripts/migrate-turso.ts` - `escapeSqlString` 関数追加

---

## Vercel 環境変数と Better Auth 設定の修正

### ユーザー指示

Vercel に設定してる環境変数が間違ってるかも。トークンいれるいれないで。ローカルで Turso につながるようにして試したい。

### ユーザー意図（推測）

本番環境で認証が動作しない原因を特定し、ローカルで Turso に接続して再現・修正したい。

### 作業内容

まず `.env.production` の `DATABASE_URL` にトークンがクエリパラメータとして含まれていた問題を発見した。Prisma LibSql アダプターは `url` と `authToken` を別引数で受け取るため、以下のように分離した。

```bash
# Before
DATABASE_URL=libsql://...?authToken=eyJ...

# After
DATABASE_URL=libsql://...
DATABASE_AUTH_TOKEN=eyJ...
```

ローカルで Turso に接続してテストしたところ、Better Auth がスネークケース（`email_verified`）でカラム名を送っていた。Prisma スキーマは `@map` でスネークケースに変換しているが、Prisma クライアントはキャメルケース（`emailVerified`）を使う。

`auth.ts` の `fields` マッピングが逆方向だったため、これを削除してシンプルな設定に変更した。

```typescript
// Before: 複雑な fields マッピング
export const auth = betterAuth({
  // ...
  user: {
    fields: {
      emailVerified: 'email_verified',
      // ...
    },
  },
  // ...
})

// After: Prisma アダプターに任せる
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
  plugins: [anonymous()],
})
```

ローカルでは動作するようになったが、本番環境で Set-Cookie が発行されない問題が残った。Vercel の環境変数を `vercel env pull` で確認したところ、値の末尾に改行文字（`\n`）が含まれていた。

```bash
BETTER_AUTH_URL="https://www.slidecraft.work\n"
BETTER_AUTH_TRUSTED_ORIGINS="https://www.slidecraft.work\n"
```

Vercel ダッシュボードで環境変数を再設定し、末尾の改行を削除したところ正常に動作するようになった。

### 成果物

- `.env.production` - `DATABASE_URL` と `DATABASE_AUTH_TOKEN` を分離
- `app/lib/auth/auth.ts` - 不要な fields マッピングを削除
- Vercel 環境変数 - 末尾改行を削除して再設定

### 教訓

Vercel 環境変数の設定は CLI でなくダッシュボードから手動で行うか、設定後に `vercel env pull` で値を確認する習慣をつける。Claude Code に環境変数設定を任せると、値に改行が混入するリスクがある。

---

## PPTXエクスポート機能の設計

### ユーザー指示

editor画面からスライド単体でPPTXエクスポートをできるようにしたい。LLM以外なるべく全部クライアントサイドでやりたい。

### ユーザー意図

PowerPointで個別スライドを編集したいケースに対応したい。Xで共有されていたGemini+SVG+PPTXのワークフローに着想を得ている。LLMは使用可だがセキュリティ上APIキーはサーバーに預けたくない。

### 実施内容

references/slide-extractorの実験結果を調査し、設計書とSOWを作成した。

当初はSVGを中間形式とする案だったが、slide-extractorの実験でJSON直接変換のほうが精度が高いことが判明したため方針変更。LLMで画像を解析し構造化JSON（テキスト要素+グラフィック領域）を抽出、PptxGenJSでPPTXを生成する設計とした。

Gemini APIはクライアントサイドから直接呼び出す。既存のスライド画像生成と同様に@google/genaiパッケージを使用し、ユーザーが自身のAPIキーをlocalStorageに保存する方式。

設計書のレビューで以下の懸念点を特定し修正した。

- フォントフォールバック戦略の追加（Noto → 游ゴシック/游明朝 → メイリオ等）
- 画像サイズ取得方法の明記（Imageオブジェクト + naturalWidth/Height）
- JSONパースエラー時の最大2回リトライ
- AbortControllerによるキャンセル機構
- モデル選択時のコスト表示
- プレビューの色分け（テキスト=青、グラフィック=緑）

### 成果物

- docs/journals/2025-11-29/pptx-export-design.md
- docs/journals/2025-11-29/pptx-export-sow.md

---

## PPTXエクスポート機能の実装

### ユーザー指示

設計書に基づいてPPTXエクスポート機能を実装。コスト表示は円換算、ダイアログのstate凝集度を高める、ファイル名はプロジェクト名+ページ番号、フォントサイズを元画像に合わせる。

### ユーザー意図

設計書を元に機能を実装し、使いやすさを追求。日本円でのコスト表示、カスタムフックによるロジック分離、直感的なファイル名、正確なフォントサイズ再現を求めていた。

### 作業内容

設計書に従い以下のファイルを作成した。

- `app/lib/slide-analysis.ts` - Zodスキーマと型定義
- `app/lib/slide-analyzer.client.ts` - Gemini API呼び出し、コスト計算
- `app/lib/graphic-extractor.client.ts` - Canvas APIによるグラフィック切り出し
- `app/lib/pptx-generator.client.ts` - PptxGenJSによるPPTX生成
- `app/routes/_app/projects/$projectId/edit/+/components/pptx-export-dialog.tsx` - ダイアログUI
- `app/routes/_app/projects/$projectId/edit/+/hooks/use-pptx-export.ts` - カスタムフック

モデル選択ではGemini 2.5 FlashとGemini 3 Pro Previewを選択可能にした。ユーザーのフィードバックでモデル名を修正（gemini-2.5-proは存在せず、gemini-3-pro-previewが正しい）。

コスト計算は当初概算固定値だったが、実行後に実際のトークン使用量から計算するよう変更。USD/100万トークンの料金表を定義し、usageMetadataから取得したトークン数で計算。円換算（1USD=150円）で表示。概算コストは実測値に基づき調整（Flash: ¥0.5、Pro: ¥3）。

ダイアログのstate管理が複雑だったため、`usePptxExport`カスタムフックに抽出。ダイアログコンポーネントは純粋なプレゼンテーション層となり凝集度が向上。

ファイル名は当初slideTitle（LLMが推定）を使用していたが、プロジェクト名+ページ番号形式（`{projectName}_{slideNumber}.pptx`）に変更。EditorActionsにprojectNameとslideNumberを追加。

フォントサイズ問題は最も難航した。当初はptで推定→画像高さでスケーリングだったが、基準が曖昧で大きすぎ・小さすぎを繰り返した。最終的にfontSizeをパーセンテージ（スライド高さに対する比率）で推定するようプロンプトを変更。PPTX生成時にパーセンテージからpt（スライド高さ405pt基準）に変換する方式に落ち着いた。

### 成果物

- `app/lib/slide-analysis.ts` - 型定義
- `app/lib/slide-analyzer.client.ts` - Gemini解析、円換算コスト計算
- `app/lib/graphic-extractor.client.ts` - グラフィック切り出し
- `app/lib/pptx-generator.client.ts` - PPTX生成
- `app/routes/_app/projects/$projectId/edit/+/components/pptx-export-dialog.tsx` - UI
- `app/routes/_app/projects/$projectId/edit/+/hooks/use-pptx-export.ts` - ロジックフック
- `app/routes/_app/projects/$projectId/edit/+/editor-actions.tsx` - PPTXボタン追加
- `app/routes/_app/projects/$projectId/edit/index.tsx` - props追加

### 教訓

LLMへの指示でフォントサイズの「単位」を曖昧にすると、解釈がぶれてスケーリング調整が泥沼化する。位置やサイズがパーセンテージならフォントサイズもパーセンテージで統一すべきだった。プロンプト設計段階で単位系を明確に揃えることが重要。
