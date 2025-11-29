# 単体スライドPPTXエクスポート 作業範囲記述書

## 本書の目的

本書はPPTXエクスポート設計書に基づく実装作業の範囲を定義する。何を作り、何を作らないかを明確にすることで、作業の見積もりと完了判定の基準とする。

## 作業範囲

本フェーズではエディタ画面から単体スライドをPPTX形式でエクスポートする機能を実装する。LLMでスライド画像を解析し、テキスト要素とグラフィック領域を抽出してPptxGenJSで編集可能なPowerPointファイルを生成する。

依存関係として、pptxgenjsパッケージをバージョン4.0.1で追加する。@google/genaiとzodは既存のため追加不要である。

型定義とスキーマとして、app/lib/slide-analysis.tsを作成する。slide-extractorのtypes.tsをベースにTextElement、GraphicRegion、SlideAnalysisのZodスキーマと型を定義する。

スライド解析処理として、app/lib/slide-analyzer.client.tsを作成する。@google/genaiを使用してGemini APIを呼び出し、スライド画像からSlideAnalysisを抽出する。slide-extractorのanalyzer.tsで検証済みのシステムプロンプトを移植する。モデルはgemini-2.5-flashをデフォルトとし、gemini-3-pro-previewも選択可能とする。JSONパースエラー時の最大2回リトライとAbortControllerによるキャンセル機構を実装する。

グラフィック切り出し処理として、app/lib/graphic-extractor.client.tsを作成する。Canvas APIを使用して画像から指定領域をPNG Blobとして切り出す。パーセンテージ座標からピクセル座標への変換と境界チェックを実装する。

PPTX生成処理として、app/lib/pptx-generator.client.tsを作成する。slide-extractorのgenerator.tsをブラウザ向けに移植する。パーセンテージ座標からインチ座標への変換、フォント選択ロジック（フォールバック含む）、フォントサイズスケーリングを実装する。画像サイズ取得にはImageオブジェクトを使用する。

ダイアログコンポーネントとして、app/routes/\_app/projects/$projectId/edit/+/components/pptx-export-dialog.tsxを作成する。初期状態、解析中状態、完了状態の3つの状態を持つ。モデル選択ドロップダウン（コスト表示付き）、解析開始ボタン、PPTXダウンロードボタンを配置する。完了状態ではテキスト要素を青色、グラフィック領域を緑色の半透明矩形でオーバーレイ表示する。ダイアログクローズ時のキャンセル処理を実装する。

既存ファイルの修正として、app/routes/\_app/projects/$projectId/edit/+/editor-actions.tsxにPPTXエクスポートボタンを追加する。

## 作業手順

pptxgenjsパッケージをインストールする。

app/lib/slide-analysis.tsを作成し、Zodスキーマと型を定義する。

app/lib/slide-analyzer.client.tsを作成し、Gemini API呼び出しとプロンプトを実装する。既存のgemini-api.client.tsのパターンに従う。

app/lib/graphic-extractor.client.tsを作成し、Canvas APIによる画像切り出しを実装する。

app/lib/pptx-generator.client.tsを作成し、PptxGenJSによるPPTX生成を実装する。

app/routes/\_app/projects/$projectId/edit/+/components/pptx-export-dialog.tsxを作成し、エクスポートダイアログを実装する。

app/routes/\_app/projects/$projectId/edit/+/editor-actions.tsxを修正し、PPTXエクスポートボタンを追加する。

## 範囲外

本フェーズでは以下の項目を実装しない。

複数スライドの一括PPTXエクスポートは将来フェーズで検討する。検証ループ（解析→検証→修正の反復）も初回リリースには含めない。解析結果の手動編集機能も将来フェーズとする。SVGを中間形式として使用するアプローチは採用しない。

## 完了基準

開発サーバーが正常に起動し、型チェックがエラーなく通ることを確認する。

エディタ画面でPPTXエクスポートボタンをクリックするとダイアログが開くことを確認する。モデル選択ドロップダウンでGemini 2.5 FlashとGemini 3 Proを選択でき、概算コストが表示されていることを確認する。

解析開始ボタンをクリックするとGemini APIが呼び出され、解析結果がプレビュー表示されることを確認する。テキスト要素が青色、グラフィック領域が緑色の半透明矩形でオーバーレイ表示されることを確認する。

PPTXダウンロードボタンをクリックするとPPTXファイルがダウンロードされることを確認する。ダウンロードされたPPTXファイルをPowerPointまたはGoogle Slidesで開き、テキストが編集可能であることを確認する。グラフィック領域が画像として正しく配置されていることを確認する。

ESCキーまたはオーバーレイクリックでダイアログが閉じることを確認する。解析中にダイアログを閉じた場合、API呼び出しがキャンセルされエラーが発生しないことを確認する。

APIキーが未設定の場合、適切なエラーメッセージが表示されることを確認する。JSONパースエラーが発生した場合、リトライが行われることを確認する。

## 参考資料

設計の詳細はPPTXエクスポート設計書を参照する。slide-extractorの実装とモデル比較レポートも参照する。PptxGenJSの公式ドキュメントとGemini APIのドキュメントも必要に応じて参照する。
