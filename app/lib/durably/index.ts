/**
 * Durably シングルトンインスタンス
 *
 * SQLocal (OPFS SQLite) をバックエンドとした Durably ワークフローエンジン
 * ブラウザ上でのみ動作
 */
import { createDurably } from '@coji/durably'
import { SQLocalKysely } from 'sqlocal/kysely'
import { batchPptxExportJob } from '~/jobs/batch-pptx-export'

const sqlocal = new SQLocalKysely('durably.sqlite3')
export const { dialect } = sqlocal

const baseDurably = createDurably({
  dialect,
  pollingInterval: 100,
  heartbeatInterval: 500,
  staleThreshold: 3000,
})

// 全ジョブを登録
const jobs = {
  batchPptxExport: batchPptxExportJob,
}

export const durably = baseDurably.register(jobs)

/**
 * 初期化済みの Durably インスタンスを返す Promise
 * ジョブ登録後に init() を呼び出す
 */
export const durablyPromise = durably.init().then(() => durably)
