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

### 改善提案

1. 設計の方向性が最初から明確だと効率がよい。「OneDrive/Google 連携のために OAuth 基盤が必要、まず匿名認証から」と最初に伝えてもらえれば、不要な設計（データ移行など）を含めずに済んだ。

2. 技術選定の理由（Prisma の DateTime 問題など）を先に共有してもらえると、代替案の検討を省略できる。

3. プロジェクトの既存規約（react-router-auto-routes のフォルダベース）は設計開始時に確認すべきだった。

4. Prisma 7 の破壊的変更は設計開始前に確認すべきだった。フレームワークのメジャーバージョンアップがある場合は事前に伝えてもらえると手戻りを防げる。
