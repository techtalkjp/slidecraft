/**
 * PPTXエクスポート関連の純粋関数テスト
 */
import { describe, expect, it } from 'vitest'
import { percentToPixel } from './graphic-extractor.client'
import { calculateCost, parseJsonResponse } from './slide-analyzer.client'

describe('percentToPixel', () => {
  it('正常なパーセンテージ値をピクセルに変換する', () => {
    expect(percentToPixel(50, 1000)).toBe(500)
    expect(percentToPixel(25, 800)).toBe(200)
    expect(percentToPixel(100, 1920)).toBe(1920)
  })

  it('0%は0を返す', () => {
    expect(percentToPixel(0, 1000)).toBe(0)
  })

  it('負の値は0にクランプされる', () => {
    expect(percentToPixel(-10, 1000)).toBe(0)
    expect(percentToPixel(-100, 500)).toBe(0)
  })

  it('100%を超える値は最大値にクランプされる', () => {
    expect(percentToPixel(110, 1000)).toBe(1000)
    expect(percentToPixel(200, 500)).toBe(500)
  })

  it('小数点以下は四捨五入される', () => {
    expect(percentToPixel(33.33, 1000)).toBe(333)
    expect(percentToPixel(66.66, 1000)).toBe(667)
  })
})

describe('parseJsonResponse', () => {
  const validAnalysis = {
    backgroundColor: 'FFFFFF',
    textElements: [],
    graphicRegions: [],
    slideTitle: 'テストスライド',
  }

  it('プレーンなJSONをパースできる', () => {
    const input = JSON.stringify(validAnalysis)
    const result = parseJsonResponse(input)
    expect(result.backgroundColor).toBe('FFFFFF')
    expect(result.textElements).toEqual([])
    expect(result.graphicRegions).toEqual([])
    expect(result.slideTitle).toBe('テストスライド')
  })

  it('```json マークダウンブロックからJSONを抽出できる', () => {
    const input =
      '```json\n{"backgroundColor": "FFFFFF", "textElements": [], "graphicRegions": [], "slideTitle": "マークダウンスライド"}\n```'
    const result = parseJsonResponse(input)
    expect(result.backgroundColor).toBe('FFFFFF')
    expect(result.slideTitle).toBe('マークダウンスライド')
  })

  it('前後に余分なテキストがあってもJSONを抽出できる', () => {
    const input =
      '解析結果は以下の通りです：\n{"backgroundColor": "000000", "textElements": [], "graphicRegions": [], "slideTitle": "抽出テスト"}\nこれで完了です。'
    const result = parseJsonResponse(input)
    expect(result.backgroundColor).toBe('000000')
    expect(result.slideTitle).toBe('抽出テスト')
  })

  it('不正なJSONはエラーを投げる', () => {
    expect(() => parseJsonResponse('{invalid json}')).toThrow(
      'JSONパースエラー',
    )
  })

  it('スキーマに合わないJSONはバリデーションエラーを投げる', () => {
    const invalidSchema = '{"backgroundColor": 123, "textElements": "invalid"}'
    expect(() => parseJsonResponse(invalidSchema)).toThrow(
      'スキーマバリデーションエラー',
    )
  })

  it('textElementsとgraphicRegionsを正しくパースする', () => {
    const input = JSON.stringify({
      backgroundColor: 'FFFFFF',
      textElements: [
        {
          content: 'タイトル',
          x: 10,
          y: 5,
          width: 80,
          height: 15,
          fontSize: 8,
          fontWeight: 'bold',
          fontStyle: 'sans-serif',
          color: '333333',
          align: 'center',
          role: 'title',
        },
      ],
      graphicRegions: [
        {
          description: 'ロゴ画像',
          x: 85,
          y: 5,
          width: 10,
          height: 10,
        },
      ],
      slideTitle: 'サンプルスライド',
    })

    const result = parseJsonResponse(input)
    expect(result.textElements).toHaveLength(1)
    expect(result.textElements[0].content).toBe('タイトル')
    expect(result.graphicRegions).toHaveLength(1)
    expect(result.graphicRegions[0].description).toBe('ロゴ画像')
    expect(result.slideTitle).toBe('サンプルスライド')
  })
})

describe('calculateCost', () => {
  it('gemini-2.5-flashのコストを正しく計算する', () => {
    // 1M input tokens @ $0.30, 1M output tokens @ $2.50
    const cost = calculateCost('gemini-2.5-flash', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(2.8, 5)
  })

  it('gemini-3-pro-previewのコストを正しく計算する', () => {
    // 1M input tokens @ $2, 1M output tokens @ $12
    const cost = calculateCost('gemini-3-pro-preview', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(14, 5)
  })

  it('少量のトークンでも正しく計算する', () => {
    // 1000 input tokens @ $0.30/M, 500 output tokens @ $2.50/M
    const cost = calculateCost('gemini-2.5-flash', 1000, 500)
    const expected = (1000 / 1_000_000) * 0.3 + (500 / 1_000_000) * 2.5
    expect(cost).toBeCloseTo(expected, 10)
  })

  it('0トークンは0コストを返す', () => {
    expect(calculateCost('gemini-2.5-flash', 0, 0)).toBe(0)
  })
})
