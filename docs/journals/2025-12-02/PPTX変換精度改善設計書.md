# PPTX変換精度改善設計書

PDF→PPTX変換精度を改善する。シェイプ・テーブル対応と高解像度解析を追加し、平均スコア85点→89.5点、コスト4%削減を目指す。slidecraftはブラウザで動作するクライアントサイドアプリケーションであり、Node.js実装をブラウザ向けに適応させる必要がある。

## 対象の改善項目

5つの改善を実装する。

### 1. テーブル対応

テーブル要素のrowHeightsとfillColor透過対応。レイアウト用途のテーブルで行高さを制御し、セル背景の透過を可能にする。検証ではpage-12のスコアが55点→85点に改善した。

slidecraftは現状テーブル要素に対応していない。スキーマ、解析プロンプト、ジェネレータの3箇所に追加が必要。

### 2. シェイプ対応とfontSize自動計算

シェイプ要素の追加と、fontSize未指定時の自動計算フォールバック。シェイプ内テキストのfontSizeが未指定の場合、シェイプ高さの60%から自動計算する。

slidecraftは現状シェイプ要素に対応していない。スキーマ、解析プロンプト、ジェネレータの3箇所に追加が必要。

### 3. graphicRegion最背面配置とテキスト背景色

graphicRegionを最背面に配置し、テキストボックスにbackgroundColor属性を追加。編集時の利便性が向上する。

slidecraftでは既にgraphicRegionをテキストの下に配置しているが、backgroundColorには対応していない。スキーマとジェネレータの2箇所を修正。

### 4. indentLevel属性

テキスト要素にindentLevel属性を追加し、箇条書きの階層構造を表現可能にする。検証ではpage-2のスコアが75点→85点に改善した。

スキーマ、解析プロンプト、ジェネレータの3箇所に追加が必要。

### 5. media_resolution_high

Gemini APIのv1alpha版でmedia_resolution_highを適用し、画像解析精度を向上させる。検証では平均スコアが85点→89.5点に改善し、コストは4%削減された。

slidecraftの解析処理で@google/genaiのAPIバージョン指定とmediaResolutionパラメータを追加する。

## 現状の差分

slidecraftの現状のスキーマ・実装を分析する。

### slide-analysis.ts（スキーマ）

slidecraftには以下が不足している。

- TextElementSchema: `backgroundColor`, `indentLevel`
- ShapeElementSchema: 存在しない（新規追加）
- TableCellSchema: 存在しない（新規追加）
- TableElementSchema: 存在しない（新規追加）
- SlideAnalysisSchema: `shapeElements`, `tableElements`

### slide-analyzer.client.ts（解析）

slidecraftには以下が不足している。

- v1alpha APIバージョン指定
- mediaResolution: highの適用
- XMLタグ構造化プロンプト
- シェイプ・テーブル・indentLevelの説明

### pptx-generator.client.ts（生成）

slidecraftには以下が不足している。

- addShapeElements関数
- addTableElements関数
- テキストのindentLevel対応（x座標オフセット）
- テキストのbackgroundColor対応
- シェイプのfontSize自動計算フォールバック

## 実装計画

### 修正対象ファイル

1. `app/lib/slide-analysis.ts` - スキーマ拡張
2. `app/lib/slide-analyzer.client.ts` - 解析処理改善
3. `app/lib/pptx-generator.client.ts` - 生成処理拡張

### 修正内容

#### 1. slide-analysis.ts

TextElementSchemaに属性追加。

```typescript
backgroundColor: z.string().optional()
  .describe('テキストボックスの背景色（hex形式、#なし）'),
indentLevel: z.number().optional()
  .describe('インデントレベル（0=なし、1=1段階、2=2段階）'),
```

ShapeElementSchemaを新規追加。矩形、角丸矩形、楕円、三角形、線、矢印の6種類の基本シェイプと、シェイプ内テキストをサポートする。

TableCellSchemaとTableElementSchemaを新規追加。rowsJsonによるフラット化スキーマを採用し、Gemini APIの制限を回避する。rowHeightsとfillColor透過もサポートする。

SlideAnalysisSchemaにshapeElementsとtableElementsを追加。

```typescript
shapeElements: z.array(ShapeElementSchema).optional()
  .describe('シェイプ要素の配列'),
tableElements: z.array(TableElementSchema).optional()
  .describe('テーブル要素の配列'),
```

#### 2. slide-analyzer.client.ts

GoogleGenAIクライアントの初期化でv1alpha APIバージョンを指定。

```typescript
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { apiVersion: 'v1alpha' },
})
```

画像partにmediaResolutionを追加。@google/genaiパッケージからPartMediaResolutionLevelをインポートする。

```typescript
import { GoogleGenAI, PartMediaResolutionLevel } from '@google/genai'

// 画像part
{
  inlineData: {
    mimeType: imageBlob.type || 'image/png',
    data: base64Image,
  },
  mediaResolution: {
    level: PartMediaResolutionLevel.MEDIA_RESOLUTION_HIGH,
  },
}
```

SYSTEM_PROMPTをXMLタグ構造に変更し、シェイプ・テーブル・indentLevelの説明を追加。既存説明（フォントスタイル、フォントウェイト、ロゴの扱い等）を統合する。

#### 3. pptx-generator.client.ts

addShapeElements関数を追加。ブラウザ環境に適応させる。fontSizeフォールバック処理を含める。

```typescript
function addShapeElements(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  shapes: ShapeElement[] | undefined,
): void {
  if (!shapes) return

  for (const shape of shapes) {
    // シェイプタイプをマッピング
    const shapeType = getShapeType(pptx, shape.type)

    if (shape.text) {
      // テキストありシェイプ
      const textOptions: PptxGenJS.TextPropsOptions = {
        // ... 省略
      }

      // fontSizeフォールバック
      if (shape.fontSize) {
        textOptions.fontSize = fontSizePctToPt(shape.fontSize)
      } else {
        textOptions.fontSize = fontSizePctToPt(shape.height * 0.6)
      }

      slide.addText(shape.text, textOptions)
    } else {
      // テキストなしシェイプ
      slide.addShape(shapeType, {
        /* ... */
      })
    }
  }
}
```

addTableElements関数を追加。rowsJsonのパース、rowHeightsの適用、fillColor透過処理を含める。

```typescript
function addTableElements(
  slide: PptxGenJS.Slide,
  tables: TableElement[] | undefined,
): void {
  if (!tables) return

  for (const table of tables) {
    // rowsJsonをパース
    let parsedRows: TableCell[][]
    try {
      parsedRows = JSON.parse(table.rowsJson)
    } catch {
      console.warn('Failed to parse rowsJson')
      continue
    }

    // 行データを変換（fillColor透過対応）
    const rows: PptxGenJS.TableRow[] = parsedRows.map((row) => {
      return row.map((cell) => {
        const cellOptions: PptxGenJS.TableCellProps = {}
        if (cell.fillColor && cell.fillColor !== 'transparent') {
          cellOptions.fill = { color: cell.fillColor }
        }
        // ... 他のオプション
        return { text: cell.text, options: cellOptions }
      })
    })

    // rowHeightsの適用
    const tableOptions: PptxGenJS.TableProps = {
      /* ... */
    }
    if (table.rowHeights && table.rowHeights.length > 0) {
      tableOptions.rowH = table.rowHeights.map((h) => pctToInches(h, 'height'))
    }

    slide.addTable(rows, tableOptions)
  }
}
```

generatePptx関数の要素追加順序を変更。graphicRegionを最初に追加し最背面に配置する。

```typescript
// 1. graphicRegions（最背面）
for (const graphic of graphics) {
  /* ... */
}

// 2. shapeElements
addShapeElements(pptx, slide, analysis.shapeElements)

// 3. textElements
for (const textEl of analysis.textElements) {
  // indentLevelに応じてx座標をオフセット
  const indentOffset = (textEl.indentLevel ?? 0) * 3
  const x = pctToInches(textEl.x + indentOffset, 'width')
  const w = pctToInches(textEl.width - indentOffset, 'width')

  // backgroundColorが指定されている場合は設定
  if (textEl.backgroundColor) {
    textOptions.fill = { color: textEl.backgroundColor }
  }
  // ...
}

// 4. tableElements
addTableElements(slide, analysis.tableElements)
```

## 型エクスポートの追加

slide-analysis.tsにShapeElement、TableCell、TableElementの型エクスポートを追加。pptx-generator.client.tsのimportを更新する。

```typescript
// slide-analysis.ts
export type ShapeElement = z.infer<typeof ShapeElementSchema>
export type TableCell = z.infer<typeof TableCellSchema>
export type TableElement = z.infer<typeof TableElementSchema>

// pptx-generator.client.ts
import type {
  ExtractedGraphic,
  ShapeElement,
  SlideAnalysis,
  TableCell,
  TableElement,
  TextElement,
} from './slide-analysis'
```

## 検証方法

実装完了後、以下の手順で動作確認を行う。

1. TypeScriptコンパイル: `pnpm typecheck` でエラーがないことを確認
2. 既存機能の動作確認: テキストとgraphicRegionのみのスライドが従来通り変換できることを確認
3. 新機能の動作確認: シェイプ、テーブル、箇条書き階層を含むスライドで変換を試行

## 注意事項

ブラウザ環境とNode.js環境の差異に注意する。

- ExtractedGraphicの型が異なる（slidecraft: Blob、参照実装: Buffer）
- ファイル出力方法が異なる（slidecraft: Blobダウンロード、参照実装: writeFile）

移植する際、Buffer関連の処理をBlob対応に書き換える必要がある。slidecraftの既存実装を参考にする。
