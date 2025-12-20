import type { Kysely } from 'kysely'
import type { DB } from '~/lib/db/types'

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
export async function cleanupSessions(db: Kysely<DB>) {
  const now = new Date().toISOString()

  // 1. 期限切れセッションを削除
  const deletedSessionsResult = await db
    .deleteFrom('session')
    .where('expiresAt', '<', now)
    .execute()

  const deletedSessions = deletedSessionsResult.reduce(
    (acc, r) => acc + Number(r.numDeletedRows ?? 0),
    0,
  )

  // 2. セッションを持たない匿名ユーザーを削除
  // サブクエリでセッションを持つユーザーIDを取得し、それ以外の匿名ユーザーを削除
  const usersWithSessions = db.selectFrom('session').select('userId').distinct()

  const deletedUsersResult = await db
    .deleteFrom('user')
    .where('isAnonymous', '=', 1)
    .where('id', 'not in', usersWithSessions)
    .execute()

  const deletedAnonymousUsers = deletedUsersResult.reduce(
    (acc, r) => acc + Number(r.numDeletedRows ?? 0),
    0,
  )

  return {
    deletedSessions,
    deletedAnonymousUsers,
    executedAt: now,
  }
}
