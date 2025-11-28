# データベースマイグレーション

## 背景

このプロジェクトでは Prisma 7 と Turso (libSQL) を組み合わせて使用している。Prisma CLI は libSQL プロトコルを直接サポートしていないため、標準の `prisma migrate deploy` コマンドでは本番環境への適用ができない。この制約を回避するために、カスタムのマイグレーションスクリプトを用意した。

ローカル開発では SQLite ファイル (`file:./data/local.db`) を使い、本番環境では Turso のリモートデータベースを使う構成となっている。

## マイグレーションの流れ

スキーマを変更する際は、まず `prisma/schema.prisma` を編集する。次に `pnpm db:migrate --name <名前>` を実行すると、ローカルの SQLite に対してマイグレーションが作成され、`prisma/migrations/` 以下にタイムスタンプ付きのフォルダと `migration.sql` が生成される。

本番環境への適用は `pnpm turso:migrate` で行う。このコマンドは `scripts/migrate-turso.ts` を実行し、Turso データベースに接続して未適用のマイグレーションを順番に適用する。適用済みのマイグレーションは `_prisma_migrations` テーブルで管理されるため、何度実行しても同じマイグレーションが重複して適用されることはない。

本番環境への適用時は `DATABASE_URL` 環境変数を設定する必要がある。`.env.production` を source するか、直接環境変数を指定して実行する。

```bash
source .env.production && pnpm turso:migrate
```

## 環境変数の形式

`DATABASE_URL` は Turso の接続情報と認証トークンを含む単一の URL として指定する。

```bash
DATABASE_URL=libsql://your-db.turso.io?authToken=xxx
```

認証トークンはクエリパラメータとして URL に埋め込む形式をとる。これは `@libsql/client` が期待する形式である。なお、Prisma CLI はこの形式を認識しないため、`prisma db push` や `prisma migrate deploy` を直接 Turso に対して実行することはできない。そのため本プロジェクトではカスタムスクリプトでマイグレーションを適用している。

## トラブルシューティング

`pnpm turso:shell` で Turso のシェルに入れる。適用済みマイグレーションの確認、テーブル構造の確認、レコードの削除などはシェル上で行う。

誤ったマイグレーションを適用してしまった場合は、`_prisma_migrations` テーブルから該当レコードを削除し、必要に応じてテーブルを手動で修正する。
