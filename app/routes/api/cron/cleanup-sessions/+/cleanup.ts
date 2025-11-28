import type { prisma } from '~/lib/db/prisma'

/**
 * Cron 認証を検証
 */
export function verifyCronAuth(
  authHeader: string | null,
  cronSecret: string | undefined,
  isProduction: boolean,
): boolean {
  if (isProduction) {
    return !!(cronSecret && authHeader === `Bearer ${cronSecret}`)
  }
  // 開発環境: cronSecret が設定されていなければ認証スキップ
  if (!cronSecret) return true
  return authHeader === `Bearer ${cronSecret}`
}

/**
 * セッションクリーンアップを実行
 */
export async function cleanupSessions(db: typeof prisma) {
  const now = new Date()

  // 1. 期限切れセッションを削除
  const deletedSessions = await db.session.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  })

  // 2. セッションを持たない匿名ユーザーを削除
  const deletedUsers = await db.user.deleteMany({
    where: {
      isAnonymous: true,
      sessions: {
        none: {},
      },
    },
  })

  return {
    deletedSessions: deletedSessions.count,
    deletedAnonymousUsers: deletedUsers.count,
    executedAt: now.toISOString(),
  }
}
