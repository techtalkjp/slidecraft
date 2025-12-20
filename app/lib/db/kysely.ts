import { createClient } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import { CamelCasePlugin, Kysely } from 'kysely'
import type { DB } from './types'

const LOCAL_DATABASE_URL = 'file:./data/local.db'

// libsql:// (Turso) と file: (ローカル SQLite) の両方に対応
const databaseUrl = process.env.DATABASE_URL ?? LOCAL_DATABASE_URL
const isTurso = databaseUrl.startsWith('libsql://')

// Turso 環境では認証トークンが必須
if (isTurso && !process.env.DATABASE_AUTH_TOKEN) {
  throw new Error('DATABASE_AUTH_TOKEN is required for Turso connection')
}

const client = createClient({
  url: databaseUrl,
  authToken: isTurso ? process.env.DATABASE_AUTH_TOKEN : undefined,
})

export const db = new Kysely<DB>({
  dialect: new LibsqlDialect({ client }),
  plugins: [new CamelCasePlugin()],
})

// JSON 集約ヘルパーを re-export
export { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/sqlite'
