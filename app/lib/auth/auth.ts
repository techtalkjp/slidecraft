import { betterAuth } from 'better-auth'
import { anonymous } from 'better-auth/plugins'
import { db } from '~/lib/db/kysely'

// BETTER_AUTH_SECRET を取得
// 本番環境・Preview環境では env.server.ts で必須チェック済み
// ローカル開発では未設定でも動作（better-authが固定のデフォルト値を使用）
// https://www.better-auth.com/docs/reference/options#secret
function getSecret(): string | undefined {
  return process.env.BETTER_AUTH_SECRET
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

// trustedOrigins: 明示設定 > baseURL > 本番は空配列 > 開発はlocalhost
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
  database: {
    db,
    type: 'sqlite',
  },
  user: {
    modelName: 'user',
    fields: {
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  session: {
    modelName: 'session',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      userId: 'user_id',
    },
  },
  account: {
    modelName: 'account',
    fields: {
      accountId: 'account_id',
      providerId: 'provider_id',
      userId: 'user_id',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      idToken: 'id_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  verification: {
    modelName: 'verification',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  plugins: [anonymous()],
})

export type Session = typeof auth.$Infer.Session
