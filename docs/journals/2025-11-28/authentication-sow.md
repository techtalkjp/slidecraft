# SlideCraft認証基盤 作業範囲記述書

## 本書の目的

本書は認証基盤設計書に基づく実装作業の範囲を定義する。何を作り、何を作らないかを明確にすることで、作業の見積もりと完了判定の基準とする。

## 作業範囲

本フェーズではbetter-authとAnonymousプラグインによる匿名セッション管理を実装する。ユーザーの操作体験は現状から変わらないが、内部的にはセッションが発行され、将来のOAuth連携の土台が整う。

データベース基盤として、better-auth CLIでPrismaスキーマを生成する。npx @better-auth/cli generateを実行すると、better-auth設定ファイルを読み取り、有効なプラグインに応じた必要なテーブル定義を出力する。Anonymousプラグインを有効にしておけばisAnonymousフラグも自動で含まれる。prisma-kyselyジェネレーターによりKysely用の型定義を自動生成する設定も追加する。

認証モジュールとして、サーバー側のbetter-auth設定ファイルとクライアント側の認証クライアント設定ファイルを作成する。better-authにはPrismaアダプターを使用し、アプリケーション固有のクエリ用にKyselyインスタンスも構築する。これらはapp/lib配下に配置する。

APIルートとして、better-authのハンドラーに委譲するsplatルートを作成する。app/routes/api/auth/$/index.tsに配置し、loaderとactionの両方でリクエストを処理する。

設定ファイルとして、prisma/schema.prismaと.env.exampleを更新する。環境変数DATABASE_URLとBETTER_AUTH_SECRETの説明を追加する。

## 作業手順

依存関係のインストールから始める。better-auth、@libsql/client、kysely、@libsql/kysely-libsqlを本番依存として、prisma、prisma-kysely、@prisma/adapter-better-sqlite3、better-sqlite3、@types/better-sqlite3を開発依存として追加する。

Prismaを初期化する。schema.prismaではdatasource providerにsqliteを指定するがurlは記載しない。prisma.config.tsを作成し、ローカル開発用に@prisma/adapter-better-sqlite3を設定する。ジェネレーターはprisma-clientを指定し、出力先をgenerated/prismaとする。prisma-kyselyジェネレーター設定を追加し、camelCaseオプションを有効にする。

better-auth設定ファイルを作成する。この時点ではPrisma Clientが未生成のため仮の状態で構わない。サーバー側にAnonymousプラグイン、クライアント側にanonymousClientプラグインを設定する。

npx @better-auth/cli generateを実行してPrismaスキーマにテーブル定義を追加する。

prisma migrate devでローカルデータベースを作成し、prisma generateでPrisma ClientとKysely型を生成する。

データベース接続モジュールを作成する。libSQLクライアントを初期化し、LibsqlDialectを通じてKyselyインスタンスを構築する。CamelCasePlugin、DeduplicateJoinsPlugin、ParseJSONResultsPlugin、HandleEmptyInListsPluginを適用する。Prisma Clientの初期化時にはアダプターインスタンスを渡す。

better-auth設定を完成させる。アダプター付きで初期化したPrisma Clientをインポートし、prismaAdapterに渡す。

APIルートを作成し、better-authハンドラーに処理を委譲する。

## 範囲外

本フェーズでは以下の項目を実装しない。

ソーシャル認証（Google、Microsoft）は将来フェーズで実装する。Stripe課金連携も同様である。OPFSデータのサーバー移行は行わず、ローカルストレージとして維持する。匿名ユーザーの定期クリーンアップ処理は運用開始後に検討する。ログインボタンなどのUI変更も本フェーズには含めない。

## 完了基準

開発サーバーが正常に起動し、型チェックがエラーなく通ることを確認する。/api/auth/sessionエンドポイントにアクセスしてセッション情報を取得できること、authClient.signIn.anonymous()で匿名セッションが作成されること、ローカルSQLiteファイルにUserとSessionレコードが保存されることを検証する。

## 参考資料

設計の詳細は認証基盤設計書を参照する。better-authとTursoの公式ドキュメントも必要に応じて参照する。
