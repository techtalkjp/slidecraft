import { CamelCasePlugin, Kysely } from 'kysely'
import { LibsqlDialect } from 'kysely-libsql'
import type { DB } from './types'

const LOCAL_DATABASE_URL = 'file:./data/local.db'

// libsql:// (Turso) と file: (ローカル SQLite) の両方に対応
const databaseUrl = process.env.DATABASE_URL ?? LOCAL_DATABASE_URL
const isTurso = databaseUrl.startsWith('libsql://')
const libsqlConfig = {
  url: databaseUrl,
  authToken: isTurso ? process.env.DATABASE_AUTH_TOKEN : undefined,
}

// Turso 環境では認証トークンが必須
if (isTurso && !process.env.DATABASE_AUTH_TOKEN) {
  throw new Error('DATABASE_AUTH_TOKEN is required for Turso connection')
}

export const db = new Kysely<DB>({
  dialect: new LibsqlDialect(libsqlConfig),
  plugins: [new CamelCasePlugin()],
})

// better-auth expects raw column names; avoid CamelCasePlugin for auth queries.
export const authDb = new Kysely<DB>({
  dialect: new LibsqlDialect(libsqlConfig),
})

// JSON 集約ヘルパーを re-export
export { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/sqlite'
