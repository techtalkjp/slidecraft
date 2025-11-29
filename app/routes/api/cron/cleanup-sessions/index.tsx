import { prisma } from '~/lib/db/prisma'
import { cleanupSessions, verifyCronAuth } from './+/cleanup'
import type { Route } from './+types/index'

/**
 * Vercel Cron Job で呼び出されるセッションクリーンアップ API
 * 毎日 AM 3:00 (UTC) に実行
 */
export async function loader({ request }: Route.LoaderArgs) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  // VERCEL_ENV を使用（env.server.ts の isStrictEnv と一貫性を保つ）
  // Preview環境でも本番同様に認証を要求する
  const isProduction =
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL_ENV === 'preview'

  if (!verifyCronAuth(authHeader, cronSecret, isProduction)) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const result = await cleanupSessions(prisma)

    console.log('[Cron] cleanup-sessions:', { success: true, ...result })

    return Response.json({ success: true, ...result })
  } catch (error) {
    const errorId = crypto.randomUUID()
    console.error(`[Cron] cleanup-sessions error (${errorId}):`, error)
    return Response.json(
      { success: false, error: 'Internal server error', errorId },
      { status: 500 },
    )
  }
}
