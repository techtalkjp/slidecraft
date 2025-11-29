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

---

## フォントサイズ補正係数の追加

### ユーザー指示

PPTXでエクスポートするとフォントサイズが元画像より2割ほど小さい。

### ユーザー意図

PPTXのフォントサイズを元画像と同等にしたい。

### 作業内容

パーセンテージベースのフォントサイズ変換（405pt基準）は正しく機能していたが、出力が一貫して2割小さかった。原因として、LLMがテキストの見た目の高さ（x-height、小文字xの高さ）を基準に推定している可能性を特定した。フォントのem-square（フルサイズ）はx-heightより大きいため、パーセンテージが控えめになる。

`fontSizePctToPt`関数に補正係数1.2を追加した。

```typescript
function fontSizePctToPt(fontSizePct: number): number {
  const slideHeightPt = SLIDE_HEIGHT * 72
  const scaleFactor = 1.2 // LLMの推定傾向を補正
  return Math.round((fontSizePct / 100) * slideHeightPt * scaleFactor)
}
```

### 成果物

- `app/lib/pptx-generator.client.ts` - 補正係数1.2を追加

---

## PPTXエクスポートボタンの配置改善

### ユーザー指示

PPTXエクスポートボタンを右ペイン（ControlPanel）に移動。スライドエクスポートセクションのヘッダースタイルを他セクションと統一。PPTX発見しづらい問題を解消。

### ユーザー意図

PPTXエクスポートボタンをスライド編集フローの文脈に配置し、発見しやすくしたい。

### 作業内容

PPTXエクスポートボタンをEditorActions（ヘッダー）からControlPanel（右ペイン）に移動した。

スライドエクスポートセクションのヘッダーに`border-y border-slate-200`を追加し、「スライド修正」「スライド一覧」と同じスタイルに統一した。

背景色を`bg-slate-50`に変更してみたが「微妙」とのフィードバックで`bg-white`に戻した。

ヘッダーにアイコンボタンを追加する案も試したが「アイコンだけだとわからん」とのことで却下。

ボタンの視認性を上げるため、PDFボタンを`variant="outline"`に変更し、PPTXボタンをデフォルト（primary）に変更した。

最終的に、スライドエクスポートセクションを下部に固定し、スライド修正セクションを残りの高さで内部スクロール可能にした。レイアウト構造は以下の通り。

```tsx
<div className="flex h-full flex-col bg-white">
  {/* スライド修正ヘッダー - shrink-0で固定 */}
  <div className="flex h-8 shrink-0 items-center border-b ...">
    <h2>スライド修正</h2>
  </div>

  {/* スライド修正コンテンツ - flex-1 + min-h-0でスクロール可能 */}
  <div className="min-h-0 flex-1 overflow-y-auto p-4">
    <GenerationControlForm ... />
    <CandidateImagesGrid ... />
  </div>

  {/* スライドエクスポート - shrink-0で下部固定 */}
  <div className="shrink-0 border-t border-slate-200">
    <div>スライドエクスポート</div>
    <Button>PPTXエクスポート</Button>
  </div>
</div>
```

### 成果物

- `app/routes/_app/projects/$projectId/edit/+/control-panel.tsx` - PPTXエクスポートセクション追加、下部固定レイアウト
- `app/routes/_app/projects/$projectId/edit/+/editor-actions.tsx` - PDFボタンを`variant="outline"`に変更

---

## エディタ背景色の統一

### ユーザー指示

スライド一覧とプレビュー領域の背景色が違うのが気になる。シンプルに統一したい。

### ユーザー意図

コンテンツ表示エリアの背景色を統一して視覚的な一貫性を確保したい。

### 作業内容

当初の状態：

- Sidebar: `bg-slate-100`
- MainPreview外側: `bg-slate-50`
- ImageCanvas: `bg-slate-100/50`（50%透過）

ImageCanvasの`bg-slate-100/50`がMainPreviewの`bg-slate-50`と重なって濃く見えていた。透過の重ね塗りは複雑なので、シンプルに透過なしで統一する方針を採用。

変更後：

- Sidebar: `bg-slate-100`
- MainPreview外側: 背景なし（削除）
- ImageCanvas: `bg-slate-100`（透過なし）
- ControlPanel: `bg-white`（操作UIなので白のまま維持）

### 成果物

- `app/routes/_app/projects/$projectId/edit/+/sidebar.tsx` - `bg-slate-100`に変更
- `app/routes/_app/projects/$projectId/edit/+/main-preview.tsx` - 背景色削除
- `app/routes/_app/projects/$projectId/edit/+/components/image-canvas.tsx` - `bg-slate-100`に変更（透過なし）

---

## PDFエクスポートのファイルサイズ改善

### ユーザー指示

元が10MBのPDFをアップロードして、PDF書き出しすると、150MBになっちゃう。

### ユーザー意図

PDF出力のファイルサイズを元のPDFと同程度に抑えたい。

### 作業内容

PDF生成時にjsPDFの`addImage`で`'PNG'`形式を使用していたことが原因。PNG形式はロスレス圧縮のためファイルサイズが大きくなる。

`blobToJpegDataUrl`関数を新規作成し、Canvas APIを使ってBlobをJPEG形式（圧縮率0.85）のData URLに変換するようにした。処理の流れは以下の通り。

1. BlobからObject URLを作成
2. Imageオブジェクトに読み込み
3. Canvasに白背景を描画（透過対策）
4. 画像をCanvasに描画
5. `canvas.toDataURL('image/jpeg', 0.85)`でJPEG圧縮
6. Object URLを解放（メモリリーク防止）

`generatePdfFromSlides`関数で使用していた未定義の`blobToDataUrl`呼び出しを`blobToJpegDataUrl`に変更し、`pdf.addImage`の形式引数を`'PNG'`から`'JPEG'`に変更した。

### 成果物

- `app/lib/pdf-generator.client.ts` - JPEG圧縮によるPDFサイズ削減

---

## ヘッダーレイアウトとボタンスタイルの統一

### ユーザー指示

サイドバートリガーのあるところが正方形じゃないし、アイコンが真ん中より左にちょっとよってて気持ち悪いから治したい。ヘッダーをgridにしたら？PDF書き出し、修正案を生成ボタン、PPTXエクスポートボタンのスタイルどうしたらいいだろう。統一感なくて。

### ユーザー意図

ヘッダーのレイアウトを整理し、SidebarTriggerの配置を正確にしたい。また、アクションボタンのスタイルを統一して視覚的な一貫性を確保したい。

### 作業内容

まずSidebarTriggerの問題を調査した。`_layout.tsx`に`-ml-1 scale-125 sm:scale-100`、`header.tsx`に`scale-125 sm:scale-100`が設定されており、これらがアイコンの位置ずれと非正方形の原因だった。

ヘッダーのレイアウトをflexからCSS Gridに変更した。`grid-cols-[auto_1fr_auto]`で3カラム構成とし、左にSidebarTrigger、中央にパンくずリスト、右にエディタアクション（PDF書き出しボタン等）を配置。Separatorコンポーネントを削除し、SidebarTriggerのコンテナに`border-r`を設定することでシンプルな境界線を実現した。

ヘッダーの高さを`h-12`（48px）から`h-10`（40px）に縮小し、コンパクトな見た目にした。

ボタンスタイルの統一方針を検討し、以下に決定した。

- メインアクション（修正案を生成）: primary（黒背景）
- サブアクション（PDF書き出し、PPTXエクスポート）: outline（白背景・枠線）

PPTXエクスポートボタンに`variant="outline"`を追加した。PDF書き出しボタンは既にoutlineだったため変更なし。

### 成果物

- `app/routes/_app/_layout.tsx` - CSS Gridレイアウト、Separator削除、高さ縮小
- `app/components/layout/header.tsx` - scale-125削除
- `app/routes/_app/projects/$projectId/edit/+/control-panel.tsx` - PPTXボタンをoutlineに変更

---

## PPTXエクスポート機能のコードレビュー対応

### ユーザー指示

PPTXエクスポート機能のコードレビュー指摘事項を順次修正。

### ユーザー意図

コードの品質、セキュリティ、パフォーマンス、アクセシビリティを向上させたい。

### 作業内容

以下のレビュー指摘に対応した。

1. **為替レート動的取得**: `USD_TO_JPY = 150`のハードコーディングを削除し、`getExchangeRate()`で動的に取得するよう変更。`UsageInfo`に`costJpy`フィールドを追加。

2. **Base64 Data URLバリデーション**: `extractBase64FromDataUrl`に`data:`プレフィックスチェックと分割結果の検証を追加。

3. **JSONパース・Zodバリデーションの明示的エラーハンドリング**: `parseJsonResponse`で`JSON.parse`と`Zod.parse`を別々のtry-catchで囲み、エラーメッセージを区別。

4. **URL.revokeObjectURLのタイミング修正**: `blobToDataUrl`でresolve呼び出し後にrevokeObjectURLを実行するよう順序を変更。

5. **percentToPixelの冗長パラメータ削除**: `dimension`と`maxDimension`が常に同じ値だったため、引数を1つに統合。

6. **逐次処理から並列処理へ**: `extractAllGraphicRegions`でforループを`Promise.all`に変更し、グラフィック切り出しを並列化。

7. **遅延Data URL変換**: `ExtractedGraphic`から`dataUrl`フィールドを削除し、PPTX生成時にBlobからData URLへ変換するよう変更。メモリ効率が約33%向上。

8. **型安全性の向上**: `pptx.write()`の戻り値を`as Blob`型アサーションから`instanceof Blob`型ガードに変更。

9. **UIアクセシビリティ**: プレビューオーバーレイの要素に`role="img"`と`aria-label`を追加し、スクリーンリーダー対応を改善。

### 成果物

- `app/lib/slide-analyzer.client.ts` - 動的為替レート、明示的エラーハンドリング
- `app/lib/pptx-generator.client.ts` - Data URLバリデーション、遅延変換、型ガード
- `app/lib/graphic-extractor.client.ts` - URL解放タイミング修正、パラメータ簡略化、並列処理
- `app/lib/slide-analysis.ts` - `dataUrl`フィールド削除
- `app/routes/_app/projects/$projectId/edit/+/components/pptx-export-dialog.tsx` - アクセシビリティ属性追加

CodeRabbitAIのレビュー指摘にも対応した。

- **AbortSignalをgenerateContentに渡す**: `config: { abortSignal: signal }`を追加し、リクエスト途中でのキャンセルを可能に。従来は手動で`signal?.aborted`をチェックしていたが、ネットワークリクエスト自体は中断できなかった。

- **画像読み込み失敗時のユーザーフィードバック**: `handleOpenPptxDialog`のcatchブロックで`toast.error()`を呼び出し、ユーザーにエラーを通知。

### 成果物（追加）

- `app/lib/slide-analyzer.client.ts` - AbortSignal対応
- `app/routes/_app/projects/$projectId/edit/+/control-panel.tsx` - toast.error追加

追加レビュー対応：

- **blobToBase64のData URLバリデーション**: `dataUrl.split(',')[1]`がundefinedになる可能性を考慮し、partsの長さと存在チェックを追加。

- **AbortError時の状態リセット**: `use-pptx-export.ts`でAbortError発生時に`setState('idle')`を追加し、キャンセル後も状態が適切にリセットされるよう修正。

- **ユニットテスト追加**: 純粋関数のテストを追加してリグレッション防止。`percentToPixel`（5テスト）、`parseJsonResponse`（6テスト）、`calculateCost`（4テスト）の計15テストを作成。テスト対象関数をexportに変更。

成果物（追加レビュー対応）:

- `app/lib/slide-analyzer.client.ts` - blobToBase64バリデーション強化、parseJsonResponseをexport
- `app/lib/graphic-extractor.client.ts` - percentToPixelをexport
- `app/routes/_app/projects/$projectId/edit/+/hooks/use-pptx-export.ts` - AbortError時の状態リセット
- `app/lib/pptx-export.test.ts` - ユニットテスト追加（新規）

---

## Gemini構造化出力の導入とフォントサイズ補正の調整

### ユーザー指示

fontSizeスキーマの説明を「pt」から「スライド高さに対する割合%」に修正。Gemini APIの構造化出力機能を導入。フォントサイズ補正係数を1.0に変更。

### ユーザー意図

スキーマの説明とシステムプロンプトの整合性を取り、構造化出力によりJSON解析の信頼性を向上させたい。構造化出力で精度が上がったため、従来の補正が不要か検証したい。

### 作業内容

**fontSizeスキーマ説明の修正**

`slide-analysis.ts`のfontSizeフィールドの`.describe()`を「フォントサイズ（pt）」から「フォントサイズ（スライド高さに対する割合%）」に変更。システムプロンプトの指示と一致させた。

**Gemini構造化出力の導入**

Gemini APIの構造化出力機能を実装した。従来はLLMがmarkdownブロック付きでJSONを返すことがあり、正規表現で抽出していた。構造化出力では`responseMimeType: 'application/json'`と`responseJsonSchema`を指定することで、APIが構文的に正しいJSONを保証する。

当初`zod-to-json-schema`パッケージを導入したが、Zod v4と互換性がなかった。Zod v4には`z.toJSONSchema()`メソッドが組み込まれていることを発見し、外部パッケージなしで実装できた。

変更点:

- `import * as z from 'zod'`に変更（`z.toJSONSchema`使用のため）
- `slideAnalysisJsonSchema = z.toJSONSchema(SlideAnalysisSchema)`でJSONスキーマ生成
- API呼び出しに`config.responseMimeType`と`config.responseJsonSchema`を追加
- システムプロンプトからJSON形式の指示を削除（スキーマの`.describe()`が自動的に含まれるため）
- レスポンス処理を`parseJsonResponse`から直接`JSON.parse`に簡略化

**フォントサイズ補正係数の変更**

`pptx-generator.client.ts`の`fontSizePctToPt`関数で、`scaleFactor`を1.2から1.0に変更。構造化出力によりLLMの出力精度が向上したため、従来の補正が不要になった可能性を検証する。

### 成果物

- `app/lib/slide-analysis.ts` - fontSizeの説明を修正
- `app/lib/slide-analyzer.client.ts` - 構造化出力対応、システムプロンプト簡素化
- `app/lib/pptx-generator.client.ts` - scaleFactor を1.2から1.0に変更

---

## Canvas最大サイズ制限の追加

### ユーザー指示

Canvasメモリ使用量の制限がないため、大きな画像でメモリ問題が発生する可能性があるとのレビュー指摘。

### ユーザー意図

大きな画像やグラフィック領域が多い場合のメモリ保護を実装したい。

### 作業内容

`graphic-extractor.client.ts`にCanvas最大サイズ制限を追加。`MAX_CANVAS_DIMENSION = 4096`を定義し、切り出し領域がこのサイズを超える場合はエラーを投げるようにした。ブラウザのCanvas制限（通常4096〜16384px）とメモリ効率のバランスを考慮した値を採用。

### 成果物

- `app/lib/graphic-extractor.client.ts` - MAX_CANVAS_DIMENSION定数と最大サイズチェックを追加

---

## useEffectガイドライン準拠とイベントハンドラパターンへの移行

### ユーザー指示

useEffectのガイドラインにしたがってる？

### ユーザー意図

CLAUDE.mdのuseEffectポリシー「Avoid: responding to flags」に違反していないか確認したい。

### 作業内容

当初の実装では`use-pptx-export.ts`にuseEffectがあり、`open`フラグの変化に応じて状態をリセットしていた。

```typescript
// Before: フラグに反応するuseEffect（ガイドライン違反）
useEffect(() => {
  if (!open) {
    abortControllerRef.current?.abort()
    setState('idle')
    setError(null)
    // ...
  }
}, [open])
```

CLAUDE.mdのガイドラインでは「useEffectは外部システムとの同期のみに使用。フラグへの反応は避ける」と規定されている。ダイアログの開閉は外部システムではなく、UIの状態変化なのでuseEffectは不適切。

イベントハンドラパターンにリファクタリングした。

1. **hookから`open`プロパティを削除**: hookはダイアログの開閉状態を知る必要がない
2. **`reset`関数をhookに追加**: 状態リセットのロジックを外部から呼び出し可能に
3. **ダイアログで`handleOpenChange`ラッパーを作成**: 閉じるときに`reset()`を呼び出す
4. **`isActiveRef`で非同期処理のガード**: ダイアログが閉じられた後の setState 呼び出しを防止

```typescript
// After: イベントハンドラでリセット
const reset = useCallback(() => {
  isActiveRef.current = false
  abortControllerRef.current?.abort()
  setState('idle')
  setError(null)
  setAnalysis(null)
  setGraphics([])
  setPptxResult(null)
  setUsage(null)
}, [])

// ダイアログ側
const handleOpenChange = useCallback(
  (newOpen: boolean) => {
    if (!newOpen) {
      reset()
    }
    onOpenChange(newOpen)
  },
  [reset, onOpenChange],
)
```

非同期処理の各ステップ後に`isActiveRef.current`をチェックし、ダイアログが閉じられていたら処理を中断するようにした。これにより、閉じた後にsetStateが呼ばれてワーニングが出る問題も解消。

### 成果物

- `app/routes/_app/projects/$projectId/edit/+/hooks/use-pptx-export.ts` - useEffect削除、reset関数追加、isActiveRefによるガード
- `app/routes/_app/projects/$projectId/edit/+/components/pptx-export-dialog.tsx` - handleOpenChangeラッパー追加

### 教訓

useEffectでUIの状態変化（フラグ）に反応するのは典型的なアンチパターン。イベントハンドラで直接処理するほうがデータフローが明確で、デバッグも容易。非同期処理中にコンポーネントがアンマウントされる場合は、refでアクティブ状態を追跡する。

---

## 解析完了後の再解析機能追加

### ユーザー指示

解析が終わったあとでもう一度モデルを変えたりして解析しなおしたいときがあるよ。

### ユーザー意図

一度解析が完了した後でも、別のモデルで再解析できるようにしたい。

### 作業内容

従来の実装では、解析が完了すると`state === 'ready'`となり、モデル選択ボタンが無効化されてダウンロードのみ可能だった。

2つの変更を実施した。

1. **モデル選択ボタンの無効化条件を変更**: `disabled={isProcessing || state === 'ready'}`から`disabled={isProcessing}`に変更。解析完了後もモデルを変更可能に。

2. **再解析ボタンの追加**: `state === 'ready'`のときに「再解析」ボタンを表示。

```tsx
{
  state === 'ready' && (
    <>
      <Button variant="outline" onClick={handleAnalyze}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        再解析
      </Button>
      {pptxResult && (
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          PPTXダウンロード
        </Button>
      )}
    </>
  )
}
```

これにより、ユーザーは解析結果を確認した後、別のモデルで再解析することが可能になった。Gemini 2.5 Flashで試してから、より高精度なGemini 3 Proで再解析するというワークフローをサポート。

### 成果物

- `app/routes/_app/projects/$projectId/edit/+/components/pptx-export-dialog.tsx` - モデルボタンの無効化条件変更、再解析ボタン追加

---

## PPTXエクスポートボタンのマジカルエフェクト追加

### ユーザー指示

PPTXエクスポートボタンをマジカルな感じでエフェクトつけて目立たせたい。見た目だけ。マーケティング的な要件。

### ユーザー意図

新機能であるPPTXエクスポートの存在をユーザーに視覚的にアピールしたい。

### 作業内容

CSSのみでグラデーションボーダーエフェクトを実装した。ボタンを`group`でラップし、疑似的なグラデーションボーダーを作成。

```tsx
<div className="group relative">
  {/* グラデーションボーダー */}
  <div className="absolute -inset-0.5 rounded-md bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 opacity-75 blur-sm transition-all duration-500 group-hover:opacity-100 group-hover:blur-md" />
  <Button
    onClick={handleOpenPptxDialog}
    size="sm"
    className="relative w-full bg-white text-slate-700 hover:bg-slate-50"
  >
    <FileSpreadsheet className="mr-2 h-4 w-4" />
    PPTXエクスポート
  </Button>
</div>
```

エフェクトの構成：

- ピンク → パープル → ブルーのグラデーション
- `blur-sm`で微かなグロー効果
- ホバー時に`blur-md`で輝きが増す
- `transition-all duration-500`でスムーズなアニメーション

TailwindCSS v4では`bg-gradient-to-r`より`bg-linear-to-r`が推奨されているため、後者を使用。

### 成果物

- `app/routes/_app/projects/$projectId/edit/+/control-panel.tsx` - グラデーションボーダーエフェクト追加

---

## デフォルトモデルとボタン順序の変更

### ユーザー指示

PPTXエクスポート時のデフォルトをGemini 3 Proにしたい。ボタンを左にして。

### ユーザー意図

高精度なGemini 3 Proをデフォルトにし、UIでも優先表示したい。

### 作業内容

2つの変更を実施。

1. `DEFAULT_MODEL`を`gemini-2.5-flash`から`gemini-3-pro-preview`に変更
2. `ANALYSIS_MODELS`オブジェクトの順序を変更し、Gemini 3 Proを先頭に配置

JavaScriptオブジェクトのプロパティ列挙順は挿入順が保持されるため、オブジェクト定義の順序を変えることでUI上のボタン順序も変わる。

### 成果物

- `app/lib/slide-analyzer.client.ts` - デフォルトモデル変更、モデル順序変更

---

## APIコストログ機能の追加

### ユーザー指示

Gemini 3 Proのコストが見積もりの倍になることが多い。DBにログを残したい。どのユーザーが使ったかも含めたい。スライド修正（画像生成）のほうにもログを入れたい。

### ユーザー意図

APIコストの実態を把握し、見積もりと実際の乖離を分析したい。ユーザー別のコスト分析も可能にしたい。

### 作業内容

`ApiUsageLog`テーブルをPrismaスキーマに追加した。記録する情報は以下の通り。

- `userId` - ユーザーID（nullable、匿名ユーザーも記録可能）
- `operation` - 操作種別（slide_analysis / image_generation）
- `model` - 使用モデル
- `inputTokens` / `outputTokens` - トークン数
- `costUsd` / `costJpy` / `exchangeRate` - コスト情報
- `metadata` - JSON形式の追加情報

メタデータにはスライド解析の場合は`imageSize`、`textElementCount`、`graphicRegionCount`、`roleBreakdown`（テキスト要素のロール別内訳）を記録。画像生成の場合は`promptLength`、`requestedCount`、`generatedCount`、`originalImageSize`を記録。

APIエンドポイント`POST /api/usage-log`を作成し、クライアントからfire-and-forgetでログを送信する仕組みを実装。エンドポイント側でセッションから`userId`を自動取得するため、クライアントは認証情報を意識する必要がない。

`slide-analyzer.client.ts`と`gemini-api.client.ts`の両方にログ記録処理を追加。画像生成は並列で複数リクエストを送信するため、各リクエストの`usageMetadata`を集計してトータルのトークン数とコストを算出。

本番DB（Turso）へのマイグレーションは`pnpm turso:migrate`で実行。

### 成果物

- `prisma/schema.prisma` - ApiUsageLogモデル追加、Userにリレーション追加
- `prisma/migrations/20251129092523_add_api_usage_log/` - テーブル作成
- `prisma/migrations/20251129092731_add_user_to_api_usage_log/` - userId追加
- `app/routes/api/usage-log/index.tsx` - ログ記録APIエンドポイント
- `app/lib/api-usage-logger.ts` - クライアント側ロガー
- `app/lib/slide-analyzer.client.ts` - 解析完了時にログ記録
- `app/lib/gemini-api.client.ts` - 画像生成完了時にログ記録

### 改善提案

ログが蓄積されたら、ダッシュボード画面を作成してコストの推移やユーザー別の利用状況を可視化できるとよい。また、見積もりロジックの精度向上のため、実際のトークン数と見積もりの比較分析も有用。

---

## APIコストログ機能のコードレビュー対応

### ユーザー指示

コードレビューで指摘された問題点への対応。セキュリティ、テストカバレッジ、コード重複、エラーハンドリングなど。

### ユーザー意図

本番運用に向けてコード品質を向上させ、保守性を高めたい。

### 作業内容

#### セキュリティ修正

1. **入力バリデーション強化** - Zodスキーマで厳密な型・範囲チェックを追加。operation、model、各数値フィールドに適切な制約を設定。

2. **認証必須化** - セッションがない場合は401エラーを返すように変更。匿名アクセスを禁止。

3. **デフォルト値削除** - Zodスキーマからデフォルト値を削除し、すべてのフィールドを必須化。データ整合性を確保。

#### テスト追加

`app/routes/api/usage-log/index.test.ts`と`app/lib/api-usage-logger.test.ts`を作成。Zodスキーマのバリデーションテスト（有効/無効入力、境界値）とfire-and-forget loggerの動作テスト（非ブロッキング、エラー時の静かな失敗）を実装。

#### コード重複解消

モデル料金定義を`cost-calculator.ts`に一元化。`MODEL_PRICING`で全モデルの料金を管理し、`calculateTokenCost()`関数を提供。`slide-analyzer.client.ts`と`gemini-api.client.ts`から重複定義を削除し、統一関数を使用するように変更。

#### 為替レートエラーハンドリング改善

`getExchangeRate()`のフォールバック戦略を改善。API取得失敗時に期限切れキャッシュを優先的に使用し、キャッシュがない場合のみデフォルト値150を返すように変更。一時的なAPIエラーでも直近の実レートが使われるため、ログの精度が向上。

#### パターン一貫性

`gemini-api.client.ts`の為替レート取得を`.then()`チェーンからasync/awaitパターンに変更し、`slide-analyzer.client.ts`と同じパターンに統一。保守性向上。

### 成果物

- `app/routes/api/usage-log/index.tsx` - バリデーション強化、認証必須化、デフォルト値削除
- `app/routes/api/usage-log/index.test.ts` - スキーマバリデーションテスト
- `app/lib/api-usage-logger.test.ts` - ロガーテスト
- `app/lib/cost-calculator.ts` - 料金定義一元化、為替レートフォールバック改善
- `app/lib/slide-analyzer.client.ts` - 統一料金計算関数を使用
- `app/lib/gemini-api.client.ts` - 統一料金計算関数を使用、async/awaitパターンに統一

---

## Upstashレート制限の追加

### ユーザー指示

usage-log APIにレート制限がない。匿名ユーザーでも書けてしまうので危険度が高い。Vercel KVか何かで簡単に対策したい。

### ユーザー意図

APIエンドポイントへの濫用を防ぎ、DBが不正リクエストで埋め尽くされるのを防止したい。

### 作業内容

Vercel KVは2024年12月にサンセットされたため、Upstash Redisを直接使用する方式を採用。Vercel Marketplace経由でUpstash KVをプロビジョニングすると、環境変数が自動設定される。

`@upstash/ratelimit`と`@upstash/redis`パッケージを追加し、`rate-limiter.ts`を新規作成。スライディングウィンドウ方式で1分間に30リクエストまでに制限。

`/api/usage-log`エンドポイントに認証後のレート制限チェックを追加。制限超過時は429ステータスとX-RateLimitヘッダーを返す。

開発環境では環境変数が未設定のためレート制限がスキップされる。本番環境で環境変数がない場合のみ警告ログを出力するよう条件を追加。

Gemini 3 Pro解析の目安コストを3円から8円に更新（実測値に基づく調整）。

### 成果物

- `app/lib/rate-limiter.ts` - Upstashレート制限ユーティリティ
- `app/lib/rate-limiter.test.ts` - レート制限のテスト
- `app/routes/api/usage-log/index.tsx` - レート制限チェック追加
- `app/lib/slide-analyzer.client.ts` - 目安コスト更新（3円→8円）
- `package.json` - @upstash/ratelimit、@upstash/redis追加

### 環境変数

本番環境では以下の環境変数が必要（Vercel Marketplace経由で自動設定）。

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

---

## レート制限とAPIログ機能の改善

### ユーザー指示

レビュー指摘への対応。トークン集計の競合状態修正、本番環境でのレート制限必須化、エラーログへのコンテキスト追加、JSDoc追加、スキーマ共有化、未使用コード削除。

### ユーザー意図

コードの堅牢性、保守性、ドキュメント品質を向上させたい。

### 作業内容

**トークン集計の競合状態を修正**

`gemini-api.client.ts`で並列リクエスト中に共有変数`totalInputTokens`/`totalOutputTokens`を直接加算していた。JavaScriptはシングルスレッドだが、非同期処理の完了タイミングによっては不正確な値になる可能性があった。

各リクエストが`{ image, inputTokens, outputTokens }`を返すように変更し、`Promise.all()`完了後に`reduce()`で集計する方式に修正した。

**本番環境でのレート制限必須化**

`rate-limiter.ts`で環境変数がない場合に警告を出すだけだったのを、本番環境では起動時にエラーを投げるよう変更した。セキュリティ上重要な機能が設定ミスで無効化されるリスクを排除。

**Retry-Afterヘッダーの追加**

429レスポンス時にリセットまでの秒数を`Retry-After`ヘッダーで返すよう変更。クライアントが適切なリトライ間隔を知ることができる。

**エラーログへのコンテキスト追加**

`usage-log`エンドポイントのエラーハンドリングで、`userId`と`operation`をログに含めるよう変更。デバッグ時の原因特定が容易になる。

**JSDoc追加**

`api-usage-logger.ts`のインターフェースと関数に詳細なJSDocを追加。使用例も記載。

**スキーマ共有化**

`ApiUsageLogSchema`と`MAX_METADATA_SIZE`を`app/lib/api-usage-log-schema.ts`に抽出し、ルートとテストで共有するよう変更。重複定義によるドリフトを防止。

**未使用コード削除**

`api-usage-log-schema.ts`から未使用の`ApiUsageLogInput`型exportを削除。

**型安全性の向上**

`gemini-api.client.ts`の`MODEL_NAME`に`as const`を追加し、リテラル型として扱うよう変更。`cost-calculator.ts`の`calculateTokenCost`関数の引数を`string`から`ModelId`型に変更し、未定義モデルを渡すとコンパイルエラーになるようにした。

**Redis障害時のfail-open対応**

`rate-limiter.ts`の`checkRateLimit`関数でRedis障害時に例外が発生するとリクエストがブロックされる問題があった。try/catchで例外をキャッチし、エラーログを出力しつつ`success: true`を返すfail-open方式に変更した。レート制限が機能しなくなるリスクはあるが、Redis障害でサービス全体が停止するよりは望ましい。

### 成果物

- `app/lib/gemini-api.client.ts` - トークン集計の競合状態修正、MODEL_NAMEの型安全化
- `app/lib/cost-calculator.ts` - calculateTokenCostの引数をModelId型に変更
- `app/lib/rate-limiter.ts` - 本番環境での必須化、Redis障害時のfail-open
- `app/lib/rate-limiter.test.ts` - テスト追加
- `app/routes/api/usage-log/index.tsx` - Retry-Afterヘッダー、エラーログコンテキスト
- `app/lib/api-usage-logger.ts` - JSDoc追加
- `app/lib/api-usage-log-schema.ts` - スキーマ共有化、未使用コード削除

---

## Vercel Preview環境の環境変数対応

### ユーザー指示

Vercel Preview環境でinternal server errorになる問題を修正。環境変数が未設定でも動作するようにしたい。

### ユーザー意図

PRごとに自動生成されるPreview環境で、手動で環境変数を設定せずにテストできるようにしたい。

### 作業内容

Vercel Preview環境では`NODE_ENV=production`でビルドされるため、従来の`NODE_ENV`ベースの判定では本番環境と区別できなかった。`VERCEL_ENV`環境変数を使用することで、`production`/`preview`/`development`を正しく区別できるようになった。

`env.server.ts`で`isProduction`を`isStrictEnv`（`VERCEL_ENV === 'production'`）に変更し、Preview環境では`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、`CRON_SECRET`をoptionalに。

`auth.ts`では`BETTER_AUTH_URL`が未設定の場合に`VERCEL_URL`から自動生成するフォールバックを追加。Vercelは各デプロイメントに`VERCEL_URL`を自動設定するため、Preview環境でも認証が動作する。`BETTER_AUTH_SECRET`も開発用のフォールバック値を使用するよう変更。セッションは再起動で無効化されるが、Preview環境では問題ない。

`trustedOrigins`も`baseURL`から自動設定するよう変更し、CORS設定も自動化。

### 成果物

- `app/lib/env.server.ts` - VERCEL_ENVベースの厳格チェック
- `app/lib/auth/auth.ts` - 環境変数フォールバック、trustedOrigins自動設定

---

## Vercel Preview環境対応のCodeRabbitレビュー指摘対応

### ユーザー指示

CodeRabbitのレビュー指摘に対応。セキュリティ問題、型安全性、一貫性の改善。

### ユーザー意図

PRのレビュー指摘を解消し、コードの品質とセキュリティを向上させたい。

### 作業内容

**セキュリティ: フォールバックシークレットの削除**

`auth.ts`の`getSecret()`関数にあったハードコードされたフォールバックシークレット`'local-development-secret-do-not-use-in-production'`を削除した。Preview環境でも`env.server.ts`のバリデーションが先に実行されるため、このフォールバックに到達することはないが、セキュリティ上のリスクを排除するため削除。ローカル開発では`better-auth`が内部でシークレットを生成する。

**未検証環境変数の修正**

`env.server.ts`で`VERCEL_ENV`をZodスキーマ構築前に参照していた問題を修正。`vercelEnvSchema.safeParse()`で事前にバリデーションし、成功時のみ値を使用するよう変更した。

**cronエンドポイントの認証判定の一貫性**

`cleanup-sessions/index.tsx`で`NODE_ENV === 'production'`を使用していたのを`VERCEL_ENV`ベースに変更。`env.server.ts`の`isStrictEnv`と同じロジックで、Production/Preview両環境で認証を要求するよう統一した。

**.env.exampleの更新**

`VERCEL_ENV`と`VERCEL_URL`がVercelによって自動設定されることを明記。各環境変数がproduction/previewで必須かどうか、`BETTER_AUTH_URL`がpreviewでは自動導出されることを記載。Upstash Redis環境変数も追加。

**型安全性の向上**

`env.server.ts`の手動定義`Env`インターフェースを`z.infer<typeof schema>`に置き換え、スキーマと型定義の乖離を防止した。

### 成果物

- `app/lib/auth/auth.ts` - フォールバックシークレット削除
- `app/lib/env.server.ts` - VERCEL_ENV事前バリデーション、z.infer型導出
- `app/routes/api/cron/cleanup-sessions/index.tsx` - VERCEL_ENVベース認証判定
- `.env.example` - Vercel環境変数ドキュメント追加

---

## GitHub Actions CI/CD設定

### ユーザー指示

GitHub Actionsでpull requestマージする前にvalidateが通ることを確認したい。なるべく短い時間で終えたい。

### ユーザー意図

PRマージ前に自動でコード品質チェック（format、lint、typecheck）を実行し、問題があればマージをブロックしたい。

### 作業内容

`.github/workflows/validate.yml`を新規作成した。PRとmainへのpush時にvalidateを実行するワークフロー。

時間短縮のため以下の最適化を実施。

- `concurrency`設定で同一PRの古いジョブを自動キャンセル
- `pnpm/action-setup`と`actions/setup-node`の`cache: pnpm`でnode_modulesをキャッシュ
- `run-p format lint`でformatとlintを並列実行

Node.jsバージョン指定のため`.node-version`ファイルを作成（Node 22）。

GitHub Branch Rulesets（Branch Protection Rulesの後継）を`gh api`コマンドで作成。mainブランチに対して以下を設定。

- PR必須（直接pushを禁止）
- `validate`ステータスチェック必須

### 成果物

- `.github/workflows/validate.yml` - CI/CDワークフロー
- `.node-version` - Node.jsバージョン指定
- GitHub Ruleset「Protect main」- mainブランチ保護設定
