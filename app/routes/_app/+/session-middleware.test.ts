import { describe, expect, it, vi } from 'vitest'
import type { AuthApi } from './session-middleware'
import { getOrCreateSession } from './session-middleware'

const mockSession = {
  user: { id: 'user-1', email: 'test@example.com', isAnonymous: false },
  session: { id: 'session-1', token: 'token-1' },
}

describe('getOrCreateSession', () => {
  it('returns existing session when available', async () => {
    const mockAuthApi: AuthApi = {
      getSession: vi.fn().mockResolvedValue(mockSession),
      signInAnonymous: vi.fn(),
    }

    const result = await getOrCreateSession(new Headers(), mockAuthApi)

    expect(result.session).toEqual(mockSession)
    expect(result.setCookieHeader).toBeNull()
    expect(mockAuthApi.signInAnonymous).not.toHaveBeenCalled()
  })

  it('creates anonymous session when none exists', async () => {
    const newSession = {
      user: { id: 'anon-1', email: 'temp@anon-1.com', isAnonymous: true },
      session: { id: 'session-2', token: 'token-2' },
    }
    const cookieValue = 'session=abc123; Path=/; HttpOnly'
    // Response-like object with headers.get() method
    const mockResponse = {
      headers: {
        get: vi.fn().mockReturnValue(cookieValue),
      },
    }

    const mockAuthApi: AuthApi = {
      getSession: vi
        .fn()
        .mockResolvedValueOnce(null) // 最初は null
        .mockResolvedValueOnce(newSession), // signIn 後は session あり
      signInAnonymous: vi
        .fn()
        .mockResolvedValue(mockResponse as unknown as Response),
    }

    const result = await getOrCreateSession(new Headers(), mockAuthApi)

    expect(result.session).toEqual(newSession)
    expect(result.setCookieHeader).toBe(cookieValue)
    expect(mockAuthApi.signInAnonymous).toHaveBeenCalled()
  })

  it('gracefully handles auth API failure', async () => {
    const mockAuthApi: AuthApi = {
      getSession: vi.fn().mockRejectedValue(new Error('Database unavailable')),
      signInAnonymous: vi.fn(),
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await getOrCreateSession(new Headers(), mockAuthApi)

    expect(result.session).toBeNull()
    expect(result.setCookieHeader).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Auth Middleware] Failed to get/create session:',
      expect.any(Error),
    )

    consoleSpy.mockRestore()
  })

  it('gracefully handles signInAnonymous failure', async () => {
    const mockAuthApi: AuthApi = {
      getSession: vi.fn().mockResolvedValue(null),
      signInAnonymous: vi
        .fn()
        .mockRejectedValue(new Error('Sign in service down')),
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await getOrCreateSession(new Headers(), mockAuthApi)

    expect(result.session).toBeNull()
    expect(result.setCookieHeader).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('handles signInAnonymous returning null', async () => {
    const mockAuthApi: AuthApi = {
      getSession: vi.fn().mockResolvedValue(null),
      signInAnonymous: vi.fn().mockResolvedValue(null),
    }

    const result = await getOrCreateSession(new Headers(), mockAuthApi)

    expect(result.session).toBeNull()
    expect(result.setCookieHeader).toBeNull()
  })
})
