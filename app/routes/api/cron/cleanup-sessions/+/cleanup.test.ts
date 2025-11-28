import { describe, expect, it, vi } from 'vitest'
import { cleanupSessions, verifyCronAuth } from './cleanup'

describe('verifyCronAuth', () => {
  describe('production environment', () => {
    it('returns true when secret matches', () => {
      expect(verifyCronAuth('Bearer secret123', 'secret123', true)).toBe(true)
    })

    it('returns false when secret does not match', () => {
      expect(verifyCronAuth('Bearer wrong', 'secret123', true)).toBe(false)
    })

    it('returns false when no auth header', () => {
      expect(verifyCronAuth(null, 'secret123', true)).toBe(false)
    })

    it('returns false when no secret configured', () => {
      expect(verifyCronAuth('Bearer secret123', undefined, true)).toBe(false)
    })
  })

  describe('development environment', () => {
    it('returns true when no secret configured', () => {
      expect(verifyCronAuth(null, undefined, false)).toBe(true)
    })

    it('returns true when secret matches', () => {
      expect(verifyCronAuth('Bearer secret123', 'secret123', false)).toBe(true)
    })

    it('returns false when secret configured but does not match', () => {
      expect(verifyCronAuth('Bearer wrong', 'secret123', false)).toBe(false)
    })
  })
})

describe('cleanupSessions', () => {
  it('deletes expired sessions and orphaned anonymous users', async () => {
    const mockDb = {
      session: {
        deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
      },
      user: {
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    }

    const result = await cleanupSessions(mockDb as never)

    expect(result.deletedSessions).toBe(5)
    expect(result.deletedAnonymousUsers).toBe(2)
    expect(result.executedAt).toBeDefined()

    // session.deleteMany が期限切れ条件で呼ばれたことを確認
    expect(mockDb.session.deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: {
          lt: expect.any(Date),
        },
      },
    })

    // user.deleteMany が匿名 + セッションなし条件で呼ばれたことを確認
    expect(mockDb.user.deleteMany).toHaveBeenCalledWith({
      where: {
        isAnonymous: true,
        sessions: {
          none: {},
        },
      },
    })
  })

  it('handles zero deletions', async () => {
    const mockDb = {
      session: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      user: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    }

    const result = await cleanupSessions(mockDb as never)

    expect(result.deletedSessions).toBe(0)
    expect(result.deletedAnonymousUsers).toBe(0)
  })

  it('propagates database errors', async () => {
    const mockDb = {
      session: {
        deleteMany: vi
          .fn()
          .mockRejectedValue(new Error('DB connection failed')),
      },
      user: {
        deleteMany: vi.fn(),
      },
    }

    await expect(cleanupSessions(mockDb as never)).rejects.toThrow(
      'DB connection failed',
    )
  })
})
