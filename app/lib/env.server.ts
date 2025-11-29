import { z } from 'zod'

// VERCEL_ENV を先にバリデーション（スキーマ構築に使用するため）
const vercelEnvSchema = z.enum(['production', 'preview', 'development'])
const vercelEnvResult = vercelEnvSchema.safeParse(process.env.VERCEL_ENV)
// バリデーション成功時のみ値を使用、失敗時は undefined（ローカル開発扱い）
const vercelEnv = vercelEnvResult.success ? vercelEnvResult.data : undefined
// 本番環境とPreview環境では環境変数を必須にする
const isStrictEnv = vercelEnv === 'production' || vercelEnv === 'preview'

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // Vercel
  VERCEL_ENV: vercelEnvSchema.optional(),
  VERCEL_URL: z.string().optional(),
  // Database
  DATABASE_URL: z.string().default('file:./data/local.db'),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  // better-auth
  BETTER_AUTH_SECRET: isStrictEnv
    ? z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters')
    : z.string().optional(),
  // BETTER_AUTH_URL は VERCEL_URL からフォールバック可能なため常に optional
  BETTER_AUTH_URL: z.url().optional(),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
  // Cron
  CRON_SECRET: isStrictEnv ? z.string().min(1) : z.string().optional(),
})

// スキーマから型を導出（手動定義との乖離を防止）
// isStrictEnv による条件分岐があるため、常に optional として扱う
type Env = z.infer<typeof schema>

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
}

export function init() {
  const parsed = schema.safeParse(process.env)

  if (!parsed.success) {
    console.error(
      'Invalid environment variables:',
      z.prettifyError(parsed.error),
    )
    throw new Error('Invalid environment variables')
  }
}
