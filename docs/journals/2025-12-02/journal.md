# 2025-12-02 作業記録

## PPTX変換精度改善

### ユーザー指示

PPTX変換精度を改善したい。シェイプ、テーブル対応と高解像度解析を追加する。設計書を書いてから実装する。

### ユーザー意図

PDF→PPTX変換の品質を向上させ、より多くのスライド要素を正確に再現できるようにしたい。

### 実施内容

設計書を作成し、slidecraftのブラウザ環境に適応させる形で実装を行った。プロンプト改善だけでは効果がない場合、スキーマ拡張とジェネレータ実装の組み合わせが効果的であることを踏まえ、5つの改善を実装した。

修正対象は3ファイル。slide-analysis.tsではTextElementSchemaにbackgroundColorとindentLevel属性を追加し、ShapeElementSchema、TableCellSchema、TableElementSchemaを新規追加した。SlideAnalysisSchemaにshapeElementsとtableElementsを追加し、型エクスポートも追加した。

slide-analyzer.client.tsではPartMediaResolutionLevelをimportに追加し、SYSTEM_PROMPTをXMLタグ構造に変更した。シェイプ、テーブル、indentLevelの説明を追加し、GoogleGenAIクライアントにv1alpha APIバージョンを指定した。画像partにmediaResolution: MEDIA_RESOLUTION_HIGHを追加し、画像を先に配置する順序に変更した。

pptx-generator.client.tsではShapeElement、TableCell、TableElementをimportに追加し、getShapeType関数とaddShapeElements関数、addTableElements関数を追加した。generatePptx関数の要素追加順序をgraphicRegion→shape→text→tableに変更し、テキスト要素にindentLevelオフセット処理とbackgroundColor対応を追加した。

### 成果物

- [PPTX変換精度改善設計書.md](PPTX変換精度改善設計書.md)
- [slide-analysis.ts](../../app/lib/slide-analysis.ts)
- [slide-analyzer.client.ts](../../app/lib/slide-analyzer.client.ts)
- [pptx-generator.client.ts](../../app/lib/pptx-generator.client.ts)

### 検証結果

`pnpm typecheck` 成功
