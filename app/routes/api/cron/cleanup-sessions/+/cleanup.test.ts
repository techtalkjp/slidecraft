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
  // Kysely のチェーンメソッドをモックするヘルパー
  const createKyselyMock = (options: {
    deletedSessions?: number
    deletedUsers?: number
    sessionError?: Error
  }) => {
    const { deletedSessions = 0, deletedUsers = 0, sessionError } = options

    // サブクエリのモック
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        distinct: vi.fn().mockReturnValue('subquery'),
      }),
    })

    // deleteFrom のモック
    const deleteFromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'session') {
        if (sessionError) {
          return {
            where: vi.fn().mockReturnValue({
              execute: vi.fn().mockRejectedValue(sessionError),
            }),
          }
        }
        return {
          where: vi.fn().mockReturnValue({
            execute: vi
              .fn()
              .mockResolvedValue([{ numDeletedRows: BigInt(deletedSessions) }]),
          }),
        }
      }
      if (table === 'user') {
        return {
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              execute: vi
                .fn()
                .mockResolvedValue([{ numDeletedRows: BigInt(deletedUsers) }]),
            }),
          }),
        }
      }
      return {}
    })

    return {
      deleteFrom: deleteFromMock,
      selectFrom: selectFromMock,
    }
  }

  it('deletes expired sessions and orphaned anonymous users', async () => {
    const mockDb = createKyselyMock({
      deletedSessions: 5,
      deletedUsers: 2,
    })

    const result = await cleanupSessions(mockDb as never)

    expect(result.deletedSessions).toBe(5)
    expect(result.deletedAnonymousUsers).toBe(2)
    expect(result.executedAt).toBeDefined()
    expect(mockDb.deleteFrom).toHaveBeenCalledWith('session')
    expect(mockDb.deleteFrom).toHaveBeenCalledWith('user')
  })

  it('handles zero deletions', async () => {
    const mockDb = createKyselyMock({
      deletedSessions: 0,
      deletedUsers: 0,
    })

    const result = await cleanupSessions(mockDb as never)

    expect(result.deletedSessions).toBe(0)
    expect(result.deletedAnonymousUsers).toBe(0)
  })

  it('propagates database errors', async () => {
    const mockDb = createKyselyMock({
      sessionError: new Error('DB connection failed'),
    })

    await expect(cleanupSessions(mockDb as never)).rejects.toThrow(
      'DB connection failed',
    )
  })
})
