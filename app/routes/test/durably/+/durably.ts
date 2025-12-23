/**
 * Durably シングルトンインスタンス
 *
 * SQLocal (OPFS SQLite) をバックエンドとした Durably ワークフローエンジン
 */
import { createDurably } from '@coji/durably'
import { SQLocalKysely } from 'sqlocal/kysely'

const sqlocal = new SQLocalKysely('durably-test.sqlite3')
export const { dialect } = sqlocal

export const durably = createDurably({
  dialect,
  pollingInterval: 100,
  heartbeatInterval: 500,
  staleThreshold: 3000,
})
