# 2025-11-28 作業ジャーナル

## SlideCraft 認証基盤設計

### ユーザー指示

「better-auth の anonymous プラグインを使った認証基盤を設計してほしい。データベースは Turso、Prisma でマイグレーション管理、Kysely でクエリ。将来的に OneDrive/Google Slides 連携や Stripe 課金を追加する予定。」

### ユーザー意図（推測）

SlideCraft に OneDrive 保存や Google Slides エクスポートなどのクラウド連携機能を追加したい。これらは OAuth 認証が必須となるため、先に認証基盤を整備しておきたい。ただし現時点ではユーザー体験を変えず、匿名セッションで開始し、必要になったときにソーシャルログインでアップグレードできる設計にしたい。

### 作業内容

認証基盤の設計書を作成した。当初は Prisma Postgres とデータ移行を含む大きな設計だったが、ユーザーとの対話を通じて以下のように絞り込んだ。

技術スタックは Turso（libSQL）をデータベースとし、Prisma でスキーマ定義とマイグレーション管理、Kysely で実際のクエリを実行する構成とした。Prisma を直接 SQLite で使うと DateTime が独自フォーマットで保存され TablePlus などで読みにくくなる問題があり、Kysely を通すことで ISO 8601 形式を維持できる。prisma-kysely により Prisma スキーマから Kysely の型定義を自動生成するため、両者の利点を両立できる。

better-auth は Prisma アダプターを使用し、Anonymous プラグインで匿名セッションを管理する。将来ソーシャル認証を追加する際にシームレスにアップグレードできる設計とした。OPFS のデータはローカルに維持し、クラウドへのエクスポートはコピーとして扱う方針とした。

React Router v7 との統合方法も設計に含めた。splat ルート（`app/routes/api/auth/$/index.tsx`）で better-auth のハンドラーに委譲し、セッション取得やクライアント側フックの使い方を記載した。

設計書のレビューで指摘された点（匿名認証の必要性、Prisma+Kysely の二重構造、React Router 統合の詳細不足）はすべて対処し、ルートパスの表記も react-router-auto-routes のフォルダベース規約に統一した。

CLAUDE.md のガイドラインも更新した。React Router Auto Routes セクションでフォルダベース規約を明確化し、splat ルートの具体例（`$/index.tsx`、`/api/auth/*` → `app/routes/api/auth/$/index.tsx`）を追加した。

Prisma 7 の仕様変更に対応するため設計書を更新した。Prisma 7 ではドライバーアダプターが必須となり、prisma.config.ts での設定、ジェネレーター名の変更（prisma-client-js → prisma-client）、出力先の変更（generated/prisma）などの対応が必要となる。ローカル開発では @prisma/adapter-better-sqlite3、本番では @prisma/adapter-libsql を使用する構成とした。

### 成果物

- [docs/journals/2025-11-28/authentication-architecture.md](authentication-architecture.md) - 認証基盤設計書
- [docs/journals/2025-11-28/authentication-sow.md](authentication-sow.md) - 作業範囲記述書
- [CLAUDE.md](../../../CLAUDE.md) - ガイドライン更新（フォルダベース規約の明確化、Route & Component Design 追加）

---

## SlideCraft 認証基盤実装

### ユーザー指示

「ok 実装しよう！」から始まり、以下の要件が追加された。

- カラム名は snake_case
- generated は app 下に出したい（`~/` で import できるように）
- ESM モジュール形式
- ローカル DB は `./data/local.db`
- Turso データベースを作成してマイグレーション適用
- pnpm run で実行できるスクリプト

途中で Kysely アダプターの検討もあったが、ISO 8601 形式で問題ないとの判断で Prisma のみの構成に決定。

### ユーザー意図（推測）

設計書どおりに認証基盤を実装したい。ただし、実際の開発で使いやすいように snake_case のカラム名（TablePlus などでの可読性）、app 下への出力（インポートパスの統一）、適切なデータベースファイル配置を求めている。

### 作業内容

better-auth と Prisma 7 を使った認証基盤を実装した。

Prisma スキーマを作成し、snake_case カラム名を `@map` アノテーションで実現した。ジェネレーター設定で `app/generated/prisma` への出力と ESM 形式を指定した。

PrismaClient は `@prisma/adapter-libsql` を使用し、環境変数がない場合は `file:./data/local.db` にフォールバックする構成とした。これにより開発時は設定不要でローカル SQLite を使用できる。

better-auth の設定では Prisma アダプターを使用し、フィールドマッピングで snake_case との対応を定義した。Anonymous プラグインも `is_anonymous` カラムにマッピングした。

API ルートは `app/routes/api/auth/$/index.tsx` に splat ルートとして実装し、loader と action の両方で better-auth のハンドラーに委譲する構成とした。

Turso データベース `slidecraft` を作成し、マイグレーション SQL を適用した。`db:migrate:turso` スクリプトで最新のマイグレーションを Turso に適用できるようにした。

環境変数は `.env`（ローカル開発用テンプレート）、`.env.production`（本番用）、`.env.example`（リポジトリにコミットするテンプレート）の3ファイル構成とした。

設計書と SOW から Kysely 関連の記述を削除し、Prisma のみの構成に更新した。

### 成果物

- [prisma/schema.prisma](../../../prisma/schema.prisma) - Prisma スキーマ（snake_case、ESM）
- [app/lib/db/prisma.ts](../../../app/lib/db/prisma.ts) - PrismaClient（libsql アダプター）
- [app/lib/auth/auth.ts](../../../app/lib/auth/auth.ts) - better-auth サーバー設定
- [app/lib/auth/auth.client.ts](../../../app/lib/auth/auth.client.ts) - クライアント設定
- [app/routes/api/auth/$/index.tsx](../../../app/routes/api/auth/$/index.tsx) - API splat ルート
- [prisma.config.ts](../../../prisma.config.ts) - Prisma 7 設定
- [.env.example](../../../.env.example) - 環境変数テンプレート
- package.json - db スクリプト追加

### 改善提案

1. 設計の方向性が最初から明確だと効率がよい。「OneDrive/Google 連携のために OAuth 基盤が必要、まず匿名認証から」と最初に伝えてもらえれば、不要な設計（データ移行など）を含めずに済んだ。

2. 技術選定の理由（Prisma の DateTime 問題など）を先に共有してもらえると、代替案の検討を省略できる。

3. プロジェクトの既存規約（react-router-auto-routes のフォルダベース）は設計開始時に確認すべきだった。

4. Prisma 7 の破壊的変更は設計開始前に確認すべきだった。フレームワークのメジャーバージョンアップがある場合は事前に伝えてもらえると手戻りを防げる。

5. Kysely アダプターの検討は ISO 形式で問題ないと最初に確認できていれば不要だった。DateTime 形式の要件は早めに確認すべき。

---

## 認証基盤デプロイ準備

### ユーザー指示

「Prisma の camelCase 修正」「React Router middleware で自動セッション作成」「Vercel Cron でセッションクリーンアップ」「Turso マイグレーション」「Vercel 環境変数設定」「デプロイ手順ドキュメント」

### ユーザー意図（推測）

認証基盤を本番環境にデプロイしたい。マイグレーションの仕組みを整え、環境変数を設定し、PR マージでデプロイできる状態にしたい。スライドとの紐付けは不要で、認証基盤だけ先に入れておく。

### 作業内容

Prisma スキーマのフィールド名を snake_case から camelCase に変更した。`emailVerified`、`createdAt`、`expiresAt`、`isAnonymous` などに修正し、`@map` でDBカラム名を snake_case に維持した。

React Router v7 の middleware を有効化（`react-router.config.ts` で `future.v8_middleware: true`）し、`_app/_layout.tsx` で匿名セッションを自動作成する middleware を実装した。セッションがなければ `signInAnonymous` を呼び、Set-Cookie ヘッダーをレスポンスに追加する。

Vercel Cron Job 用の API（`/api/cron/cleanup-sessions`）を実装した。毎日 AM 3:00 (UTC) に期限切れセッションと孤立した匿名ユーザーを削除する。`vercel.json` に cron 設定を追加。

Prisma CLI が libSQL を直接サポートしていないため、カスタムのマイグレーションスクリプト `scripts/migrate-turso.ts` を作成した。`prisma/migrations/` 内のマイグレーションを読み取り、`@libsql/client` で Turso に適用する。`_prisma_migrations` テーブルで適用済みを管理し、冪等性を確保。

npm スクリプトを整理した。`db:*` はローカル（Prisma + SQLite）、`turso:*` は本番（Turso）と区別。

Vercel CLI で環境変数（DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CRON_SECRET）を設定した。

`docs/database-migration.md` にマイグレーション手順をまとめた。

### 成果物

- `prisma/schema.prisma` - camelCase フィールド名に修正
- `react-router.config.ts` - middleware 有効化
- `app/routes/_app/_layout.tsx` - 自動セッション作成 middleware
- `app/lib/auth/session.context.ts` - セッション context
- `app/routes/api/cron/cleanup-sessions/index.tsx` - セッションクリーンアップ API
- `vercel.json` - Cron Job 設定
- `scripts/migrate-turso.ts` - Turso マイグレーションスクリプト
- `docs/database-migration.md` - マイグレーション手順

### 次のステップ

- PR 作成・マージ
- 本番デプロイ後の動作確認

---

## 認証基盤レビュー対応

### ユーザー指示

スキーマの `isAnonymous` が nullable になっている問題の指摘を受けて修正。DB リセット。マイグレーションスクリプトを zx で書き直し。

### ユーザー意図（推測）

レビュー指摘に対応して PR をマージ可能な状態にしたい。マイグレーションスクリプトのコード品質を上げたい。

### 作業内容

Prisma スキーマの `isAnonymous` を `Boolean?` から `Boolean` に修正した。better-auth の Anonymous プラグインは匿名ユーザー作成時にランダムメールを生成するため、email/name の nullable 化は不要と判断した。

ローカル SQLite と Turso の両方のデータベースをリセットし、マイグレーションを再作成した（`20251128151352_init`）。

マイグレーションスクリプト `scripts/migrate-turso.ts` を zx で書き直した。turso CLI のログイン状態を使用することでトークン管理が不要になった。レビュー対策として DB 名の環境変数化（`TURSO_DB_NAME`）と migrationName のバリデーション（SQLインジェクション対策）を追加した。

### 成果物

- `prisma/schema.prisma` - `isAnonymous` を non-nullable に修正
- `prisma/migrations/20251128151352_init/` - マイグレーション再作成
- `scripts/migrate-turso.ts` - zx で書き直し、セキュリティ強化
- `package.json` - zx 追加
