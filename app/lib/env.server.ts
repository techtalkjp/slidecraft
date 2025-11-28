import { z } from 'zod'

const isProduction: boolean = process.env.NODE_ENV === 'production'

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // Database
  DATABASE_URL: z.string().default('file:./data/local.db'),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  // better-auth
  BETTER_AUTH_SECRET: isProduction
    ? z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters')
    : z.string().optional(),
  BETTER_AUTH_URL: isProduction ? z.url() : z.url().optional(),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
  // Cron
  CRON_SECRET: isProduction ? z.string().min(1) : z.string().optional(),
})

// 循環参照を避けるため、手動で型定義
interface Env {
  NODE_ENV: 'development' | 'production' | 'test'
  DATABASE_URL: string
  DATABASE_AUTH_TOKEN?: string
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  BETTER_AUTH_TRUSTED_ORIGINS?: string
  CRON_SECRET?: string
}

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
