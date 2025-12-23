# 作業ジャーナル 2025-12-22

## Durably 導入とテスト

### ユーザー指示

Durably を導入して、まず簡単なテストルートで試したい。

### ユーザー意図

ブラウザ上で SQLite ベースのワークフローエンジン（Durably）を使えるようにし、将来的に PDF エクスポートなどの長時間処理を中断・再開可能にしたい。また、現在の OPFS ファイルベース（projects.json）のデータ管理を SQLite に移行することで、クエリ、トランザクション、マイグレーション対応などのメリットを得たい。

### 実施内容

1. **パッケージインストール**
   - `@coji/durably` と `sqlocal` を追加

2. **テストルート作成**
   - `/test/durably` にテストページを作成
   - 5ステップのワークフロー（初期化 → カウント×3 → 完了）を実装
   - イベント購読でリアルタイムログ表示

3. **COOP/COEP ヘッダー対応**
   - SQLocal が OPFS で永続化するには SharedArrayBuffer が必要
   - SharedArrayBuffer には COOP/COEP ヘッダーが必須
   - Vite の `server.headers` は SSR レスポンスに適用されない問題を発見
   - Vite プラグインでミドルウェアを追加してヘッダーを設定する方法で解決

4. **Vite 設定変更** (`vite.config.ts`)
   - `coopCoepPlugin()` を追加（全リクエストに COOP/COEP ヘッダー付与）
   - `optimizeDeps.exclude: ['sqlocal']` を追加
   - `worker.format: 'es'` を追加

5. **Vercel 設定** (`vercel.json`)
   - 本番環境用に COOP/COEP ヘッダーを追加

### 技術的な発見

- Vite の `server.headers` 設定は静的ファイルには効くが、React Router の SSR レスポンスには適用されない
- `configureServer` フックでミドルウェアを追加することで全レスポンスにヘッダーを付与できる
- COOP/COEP ヘッダーは外部リソース読み込みに影響するため、外部 CDN を使う場合は `crossorigin` 属性が必要になる可能性あり

### 次のステップ（検討中）

projects.json を SQLite に移行する際のマイグレーション管理について検討：

- Atlas でスキーマ定義を管理
- `atlas migrate diff` でマイグレーション SQL を自動生成
- ビルド時に SQL ファイルを TypeScript に埋め込み
- クライアント側で `atlas_schema_revisions` 互換のテーブルで適用済み管理

### 改善提案

- COOP/COEP ヘッダーの影響範囲を限定する場合は、`vercel.json` の `source` パターンを `/app/*` などに絞ることを検討
- テストルートのデバッグ用 console.log は本番前に削除を検討
