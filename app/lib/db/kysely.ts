import { createClient } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import { Kysely } from 'kysely'
import type { Database } from './types'

const LOCAL_DATABASE_URL = 'file:./data/local.db'

// libsql:// (Turso) と file: (ローカル SQLite) の両方に対応
const databaseUrl = process.env.DATABASE_URL ?? LOCAL_DATABASE_URL
const isTurso = databaseUrl.startsWith('libsql://')

const client = createClient({
  url: databaseUrl,
  authToken: isTurso ? process.env.DATABASE_AUTH_TOKEN : undefined,
})

export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({ client }),
})
