import type { Route } from './+types/index'
import { prisma } from '~/lib/db/prisma'

/**
 * Vercel Cron Job で呼び出されるセッションクリーンアップ API
 * 毎日 AM 3:00 (UTC) に実行
 *
 * 処理内容:
 * 1. 期限切れセッションを削除
 * 2. セッションを持たない匿名ユーザーを削除
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Vercel Cron からの呼び出しを検証
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const now = new Date()

    // 1. 期限切れセッションを削除
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    })

    // 2. セッションを持たない匿名ユーザーを削除
    // (期限切れセッション削除後、セッションがなくなった匿名ユーザー)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        isAnonymous: true,
        sessions: {
          none: {},
        },
      },
    })

    const result = {
      success: true,
      deletedSessions: deletedSessions.count,
      deletedAnonymousUsers: deletedUsers.count,
      executedAt: now.toISOString(),
    }

    console.log('[Cron] cleanup-sessions:', result)

    return Response.json(result)
  } catch (error) {
    console.error('[Cron] cleanup-sessions error:', error)
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 },
    )
  }
}
