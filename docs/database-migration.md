# データベースマイグレーション

## 概要

このプロジェクトでは Atlas (マイグレーション管理) と Kysely (クエリビルダー) を組み合わせて使用している。ローカル開発では SQLite ファイル (`file:./data/local.db`) を使い、本番環境では Turso (LibSQL) のリモートデータベースを使う構成となっている。

## 技術スタック

- **Atlas**: スキーマ管理とマイグレーション
- **Kysely**: 型安全なクエリビルダー（CamelCasePlugin で snake_case ↔ camelCase 変換）
- **Turso**: LibSQL ベースのエッジデータベース
- **kysely-codegen**: DB スキーマから TypeScript 型を自動生成

## マイグレーションの流れ

### 1. スキーマの編集

`db/schema.sql` を編集する。これが正規のスキーマ定義となる。

### 2. マイグレーションファイルの生成

```bash
pnpm db:migrate
```

`db/migrations/` 以下にタイムスタンプ付きの SQL ファイルが生成される。

### 3. ローカル DB への適用

```bash
pnpm db:apply
```

### 4. 型定義の再生成

```bash
pnpm db:codegen
```

`app/lib/db/types.ts` が更新される。

### 5. 本番環境 (Turso) への適用

```bash
pnpm turso:apply
```

このコマンドは `.env.production` を読み込み、確認プロンプトを表示してから適用する。CI では `--auto-approve` オプション付きで自動適用される。

## 環境変数

本番環境への適用には以下の環境変数が必要:

- `DATABASE_URL`: Turso の libsql:// URL
- `DATABASE_AUTH_TOKEN`: Turso の認証トークン

`.env.production` に設定するか、GitHub Secrets に登録する。

## トラブルシューティング

### Turso シェルへのアクセス

```bash
pnpm turso:shell
```

### Atlas のスキーマ差分確認

```bash
atlas schema diff --env local
```

### ベースラインの設定

既存のデータベースに対して Atlas を導入する場合:

```bash
atlas migrate apply --env local --baseline <migration_version>
```
