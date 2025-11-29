import { data } from 'react-router'
import { auth } from '~/lib/auth/auth'
import { prisma } from '~/lib/db/prisma'
import type { Route } from './+types'

/**
 * API利用ログを記録するエンドポイント
 * POST /api/usage-log
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    // セッションからユーザーIDを取得（認証されていなくてもログは記録）
    const session = await auth.api.getSession({ headers: request.headers })
    const userId = session?.user?.id ?? null

    const body = await request.json()

    const {
      operation,
      model,
      inputTokens,
      outputTokens,
      costUsd,
      costJpy,
      exchangeRate,
      metadata,
    } = body

    // バリデーション
    if (!operation || !model) {
      return data({ error: 'Missing required fields' }, { status: 400 })
    }

    await prisma.apiUsageLog.create({
      data: {
        userId,
        operation,
        model,
        inputTokens: inputTokens ?? 0,
        outputTokens: outputTokens ?? 0,
        costUsd: costUsd ?? 0,
        costJpy: costJpy ?? 0,
        exchangeRate: exchangeRate ?? 150,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    return data({ success: true })
  } catch (error) {
    console.error('Failed to log API usage:', error)
    return data({ error: 'Internal server error' }, { status: 500 })
  }
}
