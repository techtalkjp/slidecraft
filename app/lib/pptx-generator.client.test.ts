/**
 * PPTX生成ユーティリティのテスト
 *
 * 中程度のカバレッジ:
 * - validateAndParseRowsJsonのユニットテスト
 * - スキーマバリデーションテスト（ShapeElementSchema, TableElementSchema）
 */

import { describe, expect, it } from 'vitest'
import { validateAndParseRowsJson } from './pptx-generator.client'
import {
  ShapeElementSchema,
  TableCellSchema,
  TableElementSchema,
} from './slide-analysis'

describe('validateAndParseRowsJson', () => {
  describe('有効なJSON', () => {
    it('正常な2x2テーブルをパースできる', () => {
      const rowsJson = JSON.stringify([
        [{ text: 'A1' }, { text: 'B1' }],
        [{ text: 'A2' }, { text: 'B2' }],
      ])

      const result = validateAndParseRowsJson(rowsJson)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.rows).toHaveLength(2)
        expect(result.rows[0]).toHaveLength(2)
        expect(result.rows[0][0].text).toBe('A1')
        expect(result.rows[1][1].text).toBe('B2')
      }
    })

    it('オプションフィールドを含むセルをパースできる', () => {
      const rowsJson = JSON.stringify([
        [
          {
            text: 'Header',
            bold: true,
            fillColor: '4472C4',
            color: 'FFFFFF',
            align: 'center',
            colspan: 2,
          },
        ],
      ])

      const result = validateAndParseRowsJson(rowsJson)

      expect(result.valid).toBe(true)
      if (result.valid) {
        const cell = result.rows[0][0]
        expect(cell.text).toBe('Header')
        expect(cell.bold).toBe(true)
        expect(cell.fillColor).toBe('4472C4')
        expect(cell.color).toBe('FFFFFF')
        expect(cell.align).toBe('center')
        expect(cell.colspan).toBe(2)
      }
    })

    it('透過背景色(transparent)を保持する', () => {
      const rowsJson = JSON.stringify([
        [{ text: 'Cell', fillColor: 'transparent' }],
      ])

      const result = validateAndParseRowsJson(rowsJson)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.rows[0][0].fillColor).toBe('transparent')
      }
    })

    it('空配列をパースできる', () => {
      const rowsJson = '[]'

      const result = validateAndParseRowsJson(rowsJson)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.rows).toHaveLength(0)
      }
    })

    it('textがない場合は空文字にフォールバックする', () => {
      const rowsJson = JSON.stringify([[{ fillColor: 'FF0000' }]])

      const result = validateAndParseRowsJson(rowsJson)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.rows[0][0].text).toBe('')
      }
    })
  })

  describe('無効なJSON', () => {
    it('無効なJSON文字列でエラーを返す', () => {
      const result = validateAndParseRowsJson('not valid json')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Invalid JSON')
      }
    })

    it('ルートが配列でない場合エラーを返す', () => {
      const result = validateAndParseRowsJson('{"text": "not an array"}')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Root is not an array')
      }
    })

    it('行が配列でない場合エラーを返す', () => {
      const result = validateAndParseRowsJson('[{"text": "not a row array"}]')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toMatch(/Row 0 is not an array/)
      }
    })

    it('セルがオブジェクトでない場合エラーを返す', () => {
      const result = validateAndParseRowsJson('[["not an object"]]')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toMatch(/Cell at \[0\]\[0\] is not an object/)
      }
    })

    it('セルがnullの場合エラーを返す', () => {
      const result = validateAndParseRowsJson('[[null]]')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toMatch(/Cell at \[0\]\[0\] is not an object/)
      }
    })
  })

  describe('型の強制変換', () => {
    it('不正な型のオプションフィールドは無視する', () => {
      const rowsJson = JSON.stringify([
        [
          {
            text: 'Cell',
            bold: 'not a boolean',
            colspan: 'not a number',
            align: 'invalid',
          },
        ],
      ])

      const result = validateAndParseRowsJson(rowsJson)

      expect(result.valid).toBe(true)
      if (result.valid) {
        const cell = result.rows[0][0]
        expect(cell.text).toBe('Cell')
        expect(cell.bold).toBeUndefined()
        expect(cell.colspan).toBeUndefined()
        expect(cell.align).toBeUndefined()
      }
    })
  })
})

describe('ShapeElementSchema', () => {
  describe('有効なシェイプ', () => {
    it('最小限の矩形シェイプをバリデートできる', () => {
      const shape = {
        type: 'rect',
        x: 10,
        y: 20,
        width: 30,
        height: 40,
      }

      const result = ShapeElementSchema.safeParse(shape)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('rect')
      }
    })

    it('テキスト付きシェイプをバリデートできる', () => {
      const shape = {
        type: 'roundRect',
        x: 10,
        y: 20,
        width: 30,
        height: 40,
        text: 'ボタン',
        textColor: 'FFFFFF',
        fontSize: 5,
        fontWeight: 'bold',
        textAlign: 'center',
        textValign: 'middle',
        fillColor: '4472C4',
        cornerRadius: 0.2,
      }

      const result = ShapeElementSchema.safeParse(shape)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.text).toBe('ボタン')
        expect(result.data.cornerRadius).toBe(0.2)
      }
    })

    it('すべてのシェイプタイプをバリデートできる', () => {
      const shapeTypes = [
        'rect',
        'roundRect',
        'ellipse',
        'triangle',
        'line',
        'arrow',
        'rightArrow',
        'leftArrow',
        'upArrow',
        'downArrow',
      ] as const

      for (const type of shapeTypes) {
        const shape = { type, x: 0, y: 0, width: 10, height: 10 }
        const result = ShapeElementSchema.safeParse(shape)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('無効なシェイプ', () => {
    it('未知のシェイプタイプでエラーになる', () => {
      const shape = {
        type: 'unknown',
        x: 10,
        y: 20,
        width: 30,
        height: 40,
      }

      const result = ShapeElementSchema.safeParse(shape)

      expect(result.success).toBe(false)
    })

    it('必須フィールドがない場合エラーになる', () => {
      const shape = {
        type: 'rect',
        x: 10,
        // y, width, height が不足
      }

      const result = ShapeElementSchema.safeParse(shape)

      expect(result.success).toBe(false)
    })

    it('不正なfontWeightでエラーになる', () => {
      const shape = {
        type: 'rect',
        x: 10,
        y: 20,
        width: 30,
        height: 40,
        fontWeight: 'invalid',
      }

      const result = ShapeElementSchema.safeParse(shape)

      expect(result.success).toBe(false)
    })
  })
})

describe('TableElementSchema', () => {
  describe('有効なテーブル', () => {
    it('最小限のテーブルをバリデートできる', () => {
      const table = {
        x: 10,
        y: 20,
        width: 80,
        height: 30,
        rowsJson: '[[{"text":"A1"}]]',
      }

      const result = TableElementSchema.safeParse(table)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rowsJson).toBe('[[{"text":"A1"}]]')
        expect(result.data.height).toBe(30)
      }
    })

    it('全オプション付きテーブルをバリデートできる', () => {
      const table = {
        x: 10,
        y: 20,
        width: 80,
        height: 25,
        rowsJson: '[[{"text":"Header"}],[{"text":"Data"}]]',
        rowHeights: [5, 4],
        headerRows: 1,
        fontSize: 3,
        borderColor: '000000',
      }

      const result = TableElementSchema.safeParse(table)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rowHeights).toEqual([5, 4])
        expect(result.data.headerRows).toBe(1)
      }
    })
  })

  describe('無効なテーブル', () => {
    it('rowsJsonがない場合エラーになる', () => {
      const table = {
        x: 10,
        y: 20,
        width: 80,
        height: 30,
      }

      const result = TableElementSchema.safeParse(table)

      expect(result.success).toBe(false)
    })

    it('heightがない場合エラーになる', () => {
      const table = {
        x: 10,
        y: 20,
        width: 80,
        rowsJson: '[[{"text":"A1"}]]',
      }

      const result = TableElementSchema.safeParse(table)

      expect(result.success).toBe(false)
    })

    it('rowHeightsが配列でない場合エラーになる', () => {
      const table = {
        x: 10,
        y: 20,
        width: 80,
        height: 30,
        rowsJson: '[[{"text":"A1"}]]',
        rowHeights: 'invalid',
      }

      const result = TableElementSchema.safeParse(table)

      expect(result.success).toBe(false)
    })
  })
})

describe('TableCellSchema', () => {
  it('最小限のセルをバリデートできる', () => {
    const cell = { text: 'Cell' }

    const result = TableCellSchema.safeParse(cell)

    expect(result.success).toBe(true)
  })

  it('全オプション付きセルをバリデートできる', () => {
    const cell = {
      text: 'Header',
      colspan: 2,
      rowspan: 1,
      bold: true,
      fillColor: '4472C4',
      color: 'FFFFFF',
      align: 'center',
    }

    const result = TableCellSchema.safeParse(cell)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.colspan).toBe(2)
      expect(result.data.align).toBe('center')
    }
  })

  it('不正なalignでエラーになる', () => {
    const cell = {
      text: 'Cell',
      align: 'justify',
    }

    const result = TableCellSchema.safeParse(cell)

    expect(result.success).toBe(false)
  })
})
