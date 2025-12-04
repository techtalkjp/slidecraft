# 2025-12-04 作業ジャーナル

## Claude Code Hooks の簡素化

### ユーザー指示

ts-pattern 入ってないプロジェクトも多いからその点ケアしたいな

### ユーザー意図

ts-pattern への依存を削除し、より多くのプロジェクトで利用できるシンプルな実装にしたい。

### 作業内容

- `.claude/hooks/format-on-edit.ts` を ts-pattern 不使用版に更新
  - 配列ベースの拡張子チェックに変更
  - `defineHook` の trigger で `Write: true, Edit: true` を直接指定
  - MultiEdit を削除（cc-hooks-ts の型定義にないため）
- `.claude/settings.local.json` の matcher を `Write|Edit` に変更

## O'Saasy ライセンスの導入

### ユーザー指示

これやりたい（37signals の O'Saasy License について）

### ユーザー意図

MIT ライセンスの自由さを保ちつつ、SaaS として競合されることを防ぐライセンスを採用したい。

### 作業内容

- LICENSE ファイルを MIT から O'Saasy ライセンスに変更
- 日本法準拠・東京地裁専属管轄の条項を追加
- 日本語を正本、英語を参考訳として両言語を併記
- タイトルを「O'Saasy ライセンス」に簡略化

### 備考

O'Saasy ライセンスは 37signals が Fizzy をオープンソース化する際に作成したライセンス。MIT をベースに、元のライセンサーと競合する SaaS サービスとしての提供を禁止する条項を追加している。日本の会社が日本法準拠で使う場合、日本語を正本とするのが自然。
