import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logApiUsage, type ApiUsageLogData } from './api-usage-logger'

describe('api-usage-logger', () => {
  const mockFetch = vi.fn()
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = mockFetch
    mockFetch.mockReset()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe('logApiUsage', () => {
    const validData: ApiUsageLogData = {
      operation: 'slide_analysis',
      model: 'gemini-3-pro-preview',
      inputTokens: 1000,
      outputTokens: 500,
      costUsd: 0.01,
      costJpy: 1.5,
      exchangeRate: 150,
    }

    it('should send POST request to /api/usage-log', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      logApiUsage(validData)

      // Give async operation time to complete
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/api/usage-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      })
    })

    it('should include metadata when provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const dataWithMetadata: ApiUsageLogData = {
        ...validData,
        metadata: {
          imageSize: 123456,
          textElementCount: 10,
        },
      }

      logApiUsage(dataWithMetadata)

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockFetch).toHaveBeenCalledWith('/api/usage-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataWithMetadata),
      })
    })

    it('should not throw when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      // This should not throw
      expect(() => logApiUsage(validData)).not.toThrow()

      // Give async operation time to complete
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to log API usage:',
        expect.any(Error),
      )
    })

    it('should handle image_generation operation', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const imageGenData: ApiUsageLogData = {
        operation: 'image_generation',
        model: 'gemini-3-pro-image-preview',
        inputTokens: 2000,
        outputTokens: 0,
        costUsd: 0.134,
        costJpy: 20.1,
        exchangeRate: 150,
        metadata: {
          promptLength: 50,
          requestedCount: 4,
          generatedCount: 4,
          originalImageSize: 500000,
        },
      }

      logApiUsage(imageGenData)

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockFetch).toHaveBeenCalledWith('/api/usage-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageGenData),
      })
    })

    it('should be fire-and-forget (not blocking)', () => {
      // Mock fetch to never resolve
      mockFetch.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      const startTime = Date.now()
      logApiUsage(validData)
      const endTime = Date.now()

      // Should return immediately (< 10ms)
      expect(endTime - startTime).toBeLessThan(10)
    })
  })
})
