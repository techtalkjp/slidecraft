import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock環境変数とモジュール
const mockLimit = vi.fn()

vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    constructor() {}
  },
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class MockRatelimit {
    limit = mockLimit
    constructor() {}
    static slidingWindow() {
      return {}
    }
  },
}))

describe('rate-limiter', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    mockLimit.mockReset()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('checkRateLimit with credentials', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    })

    it('should return success when under rate limit', async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        reset: Date.now() + 60000,
      })

      const { checkRateLimit } = await import('./rate-limiter')
      const result = await checkRateLimit('test-user')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(30)
      expect(result.remaining).toBe(29)
      expect(mockLimit).toHaveBeenCalledWith('test-user')
    })

    it('should return failure when over rate limit', async () => {
      const resetTime = Date.now() + 30000
      mockLimit.mockResolvedValueOnce({
        success: false,
        limit: 30,
        remaining: 0,
        reset: resetTime,
      })

      const { checkRateLimit } = await import('./rate-limiter')
      const result = await checkRateLimit('test-user')

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.reset).toBe(resetTime)
    })
  })

  describe('checkRateLimit without credentials', () => {
    it('should always allow when credentials are missing', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN

      const { checkRateLimit } = await import('./rate-limiter')
      const result = await checkRateLimit('any-user')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(0)
      expect(result.remaining).toBe(0)
      expect(result.reset).toBe(0)
      expect(mockLimit).not.toHaveBeenCalled()
    })

    it('should not warn in development', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
      process.env.NODE_ENV = 'development'

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await import('./rate-limiter')

      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('should warn in production when credentials missing', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
      process.env.NODE_ENV = 'production'

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await import('./rate-limiter')

      expect(warnSpy).toHaveBeenCalledWith(
        'Upstash Redis credentials not found. Rate limiting is disabled.',
      )
    })
  })
})
