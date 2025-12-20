# 2025-12-20 作業ジャーナル

## Prisma から Atlas + Kysely への移行

### ユーザー指示

「prisma やめて atlasgo + kysely にかえたい」

### ユーザー意図

ORM として Prisma を使うのをやめ、マイグレーション管理に Atlas、クエリビルダーに Kysely を使う構成に変更したい。better-auth のアダプターについては Kysely インスタンスを直接渡す方式を希望。

### 実施内容

#### 1. Atlas のセットアップ

- `db/schema.sql` を作成し、既存の Prisma スキーマから SQL DDL を生成
- `atlas.hcl` を作成し、local 環境と turso 環境を定義
- `db/migrations/` ディレクトリを作成

#### 2. Kysely のセットアップ

- `kysely` と `@libsql/kysely-libsql` をインストール
- `app/lib/db/types.ts` に Database 型定義を作成
- `app/lib/db/kysely.ts` に Kysely クライアントを作成
- `@libsql/client` を 0.8.1 にダウングレード（kysely-libsql との互換性のため）

#### 3. better-auth の移行

当初カスタムアダプターを実装しようとしたが、better-auth は Kysely インスタンスを直接受け取れることが判明。`database: { db, type: 'sqlite' }` の形式で設定。

#### 4. アプリケーションコードの移行

- `app/lib/auth/auth.ts`: prismaAdapter から Kysely 直接使用に変更
- `app/routes/api/usage-log/index.tsx`: Prisma クエリを Kysely クエリに書き換え
- `app/routes/api/cron/cleanup-sessions/+/cleanup.ts`: Prisma クエリを Kysely クエリに書き換え

#### 5. テストの修正

`cleanup.test.ts` のモックを Prisma 形式から Kysely のチェーンメソッド形式に更新。

#### 6. Prisma 関連の削除

- `prisma/` ディレクトリ削除
- `prisma.config.ts` 削除
- `app/generated/prisma/` 削除
- `app/lib/db/prisma.ts` 削除
- `prisma`, `@prisma/client`, `@prisma/adapter-libsql` をアンインストール
- `package.json` の `onlyBuiltDependencies` から `prisma` を削除
- npm scripts を更新（`db:migrate` → atlas コマンド）

### 成果物

- 型チェック通過
- 全テスト通過（101 passed, 3 skipped）
- ビルド成功

### 改善提案

- `@libsql/kysely-libsql` は `@libsql/client ^0.8.0` を要求するため、0.8.1 にダウングレードした。より新しい libsql クライアントを使いたい場合は、`@coji/kysely-libsql` など別のパッケージを検討する余地がある。
- Atlas CLI のインストールが必要（`brew install atlas` など）。CI/CD パイプラインでも Atlas を使えるようにセットアップが必要。

---

## Turso マイグレーションの Atlas 統合

### ユーザー指示

「turso:migrate も atlas にそろえたい」

### ユーザー意図

カスタムの TypeScript マイグレーションスクリプトをやめて、Atlas の公式 Turso サポートを使いたい。

### 実施内容

#### 1. Atlas 公式ドキュメントの確認

[atlasgo.io/guides/sqlite/turso](https://atlasgo.io/guides/sqlite/turso) を参照し、Atlas が `libsql://` URL を直接サポートしていることを確認。

#### 2. atlas.hcl の更新

既存の環境変数 `DATABASE_URL` と `DATABASE_AUTH_TOKEN` を使用するように変更:

```hcl
env "turso" {
  src     = "file://db/schema.sql"
  url     = "${var.database_url}?authToken=${var.database_auth_token}"
  dev     = "sqlite://file?mode=memory"
  exclude = ["_litestream*"]
}
```

#### 3. package.json の更新

- `turso:migrate` → `turso:apply` に変更
- `dotenv-cli` を追加して `.env.production` を自動読み込み
- 本番変更は確認プロンプトを表示（`--auto-approve` なし）

```json
"turso:apply": "dotenv -e .env.production -- atlas schema apply --env turso"
```

#### 4. カスタムスクリプトの削除

- `scripts/migrate-turso.ts` 削除
- `scripts/migrate-turso.test.ts` 削除
- `scripts/` ディレクトリ削除（空になったため）

#### 5. 本番 (Turso) への適用

Atlas による初回スキーマ適用を実行。主な変更:

- `_prisma_migrations` テーブル削除
- 各テーブルに `NOT NULL DEFAULT` 制約を追加
- 既存データは `IFNULL` で安全に移行

#### 6. ローカル DB のベースライン設定

既存のローカル DB に対して初期マイグレーション `20251220054340_init.sql` を作成し、ベースラインを設定。

### 成果物

- カスタムスクリプト不要に（Atlas CLI のみで完結）
- ローカルと本番で統一されたマイグレーションワークフロー
- 型チェック・テスト通過（101 passed, 3 skipped）

---

## CI ワークフロー整備

### ユーザー指示

「CI どうしよう」「自動デプロイがいいんだけど、アプリデプロイ先が vercel なんだよね。github 連携済みで勝手にデプロイされる」「ci で validate 失敗してたらデプロイしたくないけど、大丈夫なんだっけ」「Branch protection いれたい」

### ユーザー意図

GitHub に push したら Vercel がアプリをデプロイする前に、自動で DB マイグレーションを実行したい。ただし validate が失敗している場合はマイグレーションもデプロイも行いたくない。

### 実施内容

#### 1. CI ワークフロー統合

当初 `migrate.yml` を別ワークフローとして作成したが、validate が失敗してもマイグレーションが実行される問題があった。`validate.yml` に統合し、`ci.yml` にリネーム:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm run-p format lint
      - run: pnpm typecheck
      - run: pnpm test --run

  migrate:
    needs: validate
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ariga/setup-atlas@v0
      - run: atlas schema apply --env turso --auto-approve
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DATABASE_AUTH_TOKEN: ${{ secrets.DATABASE_AUTH_TOKEN }}
```

ポイント:

- `needs: validate` で validate 成功後のみ migrate 実行
- PR 時は validate のみ、main push 時は validate → migrate の順
- ファイル名を `ci.yml` に変更（migrate も含むため）

#### 2. Branch Protection 設定

`gh` CLI で main ブランチの保護ルールを設定:

```bash
gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "checks": [{"context": "validate"}]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF
```

設定内容:

- `validate` ステータスチェック必須
- `strict: true` - ブランチが最新でないとマージ不可

#### 3. 必要な GitHub シークレット

リポジトリの Settings → Secrets and variables → Actions で以下を設定:

- `DATABASE_URL`: Turso の libsql:// URL
- `DATABASE_AUTH_TOKEN`: Turso の認証トークン

### 成果物

- validate 失敗時は PR マージ不可
- validate 成功時のみマイグレーション実行
- Vercel デプロイ前に DB が更新される

---

## better-auth カラム名マッピングと CamelCasePlugin

### ユーザー指示

「table user has no column named emailVerified」「kysely の camel case plugin いれたいね。kysely 使う側の話だけど。jsonaggregate plugin も」

### ユーザー意図

better-auth が camelCase のカラム名を期待しているが、DB スキーマは snake_case。Kysely クエリを camelCase で書きたい。

### 実施内容

#### 1. better-auth のカラム名マッピング

better-auth は Kysely の CamelCasePlugin を経由せず直接 SQL を発行するため、明示的なカラム名マッピングが必要:

```typescript
export const auth = betterAuth({
  database: { db, type: 'sqlite' },
  user: {
    fields: {
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      // ...
    },
  },
  session: { fields: { ... } },
  account: { fields: { ... } },
  verification: { fields: { ... } },
})
```

#### 2. Kysely CamelCasePlugin 追加

Kysely に組み込みの `CamelCasePlugin` を追加。追加パッケージ不要:

```typescript
import { CamelCasePlugin, Kysely } from 'kysely'

export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({ client }),
  plugins: [new CamelCasePlugin()],
})
```

これにより、型定義とクエリを camelCase で書ける。SQL 生成時に自動で snake_case に変換される。

#### 3. 型定義の camelCase 化

`app/lib/db/types.ts` のカラム名を snake_case から camelCase に変更:

```typescript
// Before
interface UserTable {
  email_verified: number
  created_at: Generated<string>
}

// After
interface UserTable {
  emailVerified: number
  createdAt: Generated<string>
}
```

#### 4. クエリの camelCase 化

アプリケーションコードのクエリを camelCase に更新:

```typescript
// Before
db.insertInto('api_usage_log').values({ user_id, input_tokens })

// After
db.insertInto('apiUsageLog').values({ userId, inputTokens })
```

#### 5. JSON 集約ヘルパーの re-export

`jsonArrayFrom`, `jsonObjectFrom` を `~/lib/db/kysely` から使えるように:

```typescript
export { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/sqlite'
```

### 成果物

- Kysely クエリを camelCase で記述可能
- 型定義とクエリが一貫した命名規則
- 型チェック・テスト通過（101 passed, 3 skipped）

---

## kysely-codegen による型自動生成

### ユーザー指示

「型定義 kysely codegen つかいたい」「exclude 効くと思うんだけどなあ。ちゃんとしらべたい」

### ユーザー意図

DB スキーマから Kysely の型定義を自動生成したい。手動での型定義メンテナンスを不要に。

### 実施内容

#### 1. kysely-codegen のインストール

```bash
pnpm add -D kysely-codegen
```

#### 2. 型生成スクリプトの追加

`--exclude-pattern` オプションで `atlas_schema_revisions` テーブルを除外:

```json
"db:codegen": "kysely-codegen --dialect libsql --url 'file:./data/local.db' --camel-case --out-file app/lib/db/types.ts --exclude-pattern atlas_schema_revisions"
```

当初 `--exclude-pattern` が効かないと思っていたが、パターンの書き方の問題だった。ワイルドカードを使わず、テーブル名を直接指定することで正しく除外できた。

#### 3. 型名の変更

kysely-codegen が生成する型名 `DB` に合わせて、コード内の `Database` を `DB` に変更:

- `app/lib/db/kysely.ts`
- `app/routes/api/cron/cleanup-sessions/+/cleanup.ts`

#### 4. 不要テーブルの削除

ローカル DB から `_prisma_migrations` テーブルを削除（移行完了のため不要）。

### 成果物

- `pnpm db:codegen` で型定義を自動生成
- システムテーブル（`atlas_schema_revisions`）を除外
- 型チェック・テスト通過（101 passed, 3 skipped）

---

## better-auth の ID 生成エラー修正

### ユーザー指示

「[Auth Middleware] Failed to get/create session: Error: NOT NULL constraint failed: user.id」

### ユーザー意図

匿名ユーザー作成時に発生するエラーを修正したい。

### 実施内容

#### 原因調査

エラーメッセージから、user.id カラムに NULL が挿入されようとしていることが判明。`app/lib/auth/auth.ts` を確認したところ、以下の設定が原因だった:

```typescript
advanced: {
  database: {
    generateId: false,
  },
},
```

この設定は better-auth による ID 自動生成を無効化する。Prisma 移行時に誤って残っていた設定と思われる。

#### 修正

`advanced.database.generateId: false` の設定ブロックを削除。better-auth がデフォルトで ID を生成するようになった。

### 成果物

- 匿名ユーザー作成時のエラー解消
- 型チェック・テスト通過（101 passed, 3 skipped）
