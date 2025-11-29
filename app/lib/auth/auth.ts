import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { anonymous } from 'better-auth/plugins'
import { prisma } from '~/lib/db/prisma'

// BETTER_AUTH_SECRET が未設定の場合、ローカル開発用のフォールバック
// 本番環境・Preview環境では env.server.ts で必須チェック済み
function getSecret(): string {
  if (process.env.BETTER_AUTH_SECRET) {
    return process.env.BETTER_AUTH_SECRET
  }
  // ローカル開発用: 固定値（開発中はセッション維持）
  return 'local-development-secret-do-not-use-in-production'
}

// BETTER_AUTH_URL が未設定の場合、VERCEL_URL からフォールバック
function getBaseURL(): string | undefined {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return undefined
}

const baseURL = getBaseURL()

// trustedOrigins の決定ロジック:
// 1. BETTER_AUTH_TRUSTED_ORIGINS が設定されていればそれを使用
// 2. baseURL が設定されていれば（VERCEL_URL からの自動生成含む）それを使用
// 3. NODE_ENV === 'production' の場合は空配列（明示的な設定が必要）
// 4. それ以外（ローカル開発）は localhost:5173
// NOTE: ここでは NODE_ENV を使用。VERCEL_ENV ではなく NODE_ENV を使うのは、
// ローカルで NODE_ENV=production をテストする場合に厳格な挙動を確認するため。
const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
  : baseURL
    ? [baseURL]
    : process.env.NODE_ENV === 'production'
      ? [] // 本番環境では明示的な設定が必要
      : ['http://localhost:5173'] // 開発環境のデフォルト

export const auth = betterAuth({
  secret: getSecret(),
  baseURL,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
  plugins: [anonymous()],
})

export type Session = typeof auth.$Infer.Session
