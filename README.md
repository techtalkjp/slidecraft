# SlideCraft

AI生成スライドをピンポイント修正するWebアプリケーション。

<img width="1280" height="800" alt="image" src="https://github.com/user-attachments/assets/72eda644-e706-4abc-9d88-45ef671fc4c1" />

「30枚のうち3枚だけ直したいのに、再生成すると5〜10分待つ上に完璧だった27枚まで変わってしまうガチャ状態」という問題を解決します。

[![License: O'Saasy](https://img.shields.io/badge/License-O'Saasy-blue.svg)](LICENSE)

## 概要

Nano Banana Pro (Gemini Pro 3) やGoogle Notebook LMで生成したスライドの、気になる部分だけを1枚単位で修正できます。

- **ピンポイント修正**: 気になるスライドだけを選んで修正、他のスライドは一切変更されません（再生成ガチャのリスクなし）
- **高速処理**: 1スライド1分で完了（Notebook LMの再生成は5〜10分）
- **複数候補生成**: 1回の修正で最大4つの候補を同時生成し、並べて比較できます
- **自然な日本語指示**: 「背景を白に」「タイトルを大きく」といった自然な日本語で修正内容を指示できます
- **ブラウザ完結**: 全てのデータはブラウザ内で処理され、PDFファイルが外部サーバーに送信されることはありません
- **オープンソース**: コードを自分の目で確認でき、セキュリティ上の懸念を解消できます
- **明朗な料金**: アプリ自体は完全無料。かかるのはGoogle Gemini APIの利用料のみ（1スライド修正あたり約20円）

## 技術スタック

- **Frontend**: React Router v7, shadcn/ui, TailwindCSS v4
- **Backend**: better-auth (認証)
- **Database**: Turso (LibSQL), Kysely (クエリビルダー), Atlas (マイグレーション)
- **AI**: Google Gemini API (@google/genai)
- **Language**: TypeScript
- **Build**: Vite
- **Package Manager**: pnpm

## セットアップ

### 前提条件

- Node.js 18以上
- pnpm 8以上
- Google AI Studio APIキー
- Atlas CLI (`brew install atlas`)

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/techtalkjp/slidecraft.git
cd slidecraft

# 依存関係のインストール
pnpm install
```

### 開発サーバーの起動

```bash
pnpm dev
```

http://localhost:5173 でアプリケーションが起動します。

## 開発コマンド

```bash
# 開発サーバー起動（HMR有効）
pnpm dev

# コードの検証（フォーマット、リント、型チェック）
pnpm validate

# 型チェックのみ
pnpm typecheck

# 本番ビルド
pnpm build

# 本番ビルドをローカルで実行
pnpm start

# フォーマット修正
pnpm format:fix

# データベース操作
pnpm db:migrate      # マイグレーションファイル生成
pnpm db:apply        # ローカルDBにマイグレーション適用
pnpm db:codegen      # DBスキーマから型定義を生成
```

## プロジェクト構成

```text
├── app/
│   ├── routes/              # ルート定義とページコンポーネント
│   │   ├── _index.tsx      # ランディングページ
│   │   ├── _app/           # アプリケーション本体
│   │   ├── guides/         # ガイドページ（APIキー設定、セキュリティ）
│   │   ├── terms.tsx       # 利用規約
│   │   └── privacy.tsx     # プライバシーポリシー
│   ├── components/         # 再利用可能なコンポーネント
│   ├── lib/               # ユーティリティ関数
│   └── root.tsx           # ルートレイアウト
├── db/
│   └── schema.sql         # DBスキーマ定義
├── data/                  # ローカルSQLiteファイル
├── docs/                  # 設計ドキュメント
├── references/            # 参考実装
└── public/               # 静的ファイル
```

## デプロイ

現在Vercelで稼働中です。

## ライセンス

O'Saasy License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 開発元

TechTalk Inc.

- Website: https://www.techtalk.jp
- Service: https://www.slidecraft.work

---

Built with React Router v7
