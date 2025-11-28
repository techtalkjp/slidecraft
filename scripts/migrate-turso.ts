#!/usr/bin/env npx tsx
/**
 * Turso マイグレーションスクリプト
 *
 * prisma/migrations/ 内のマイグレーションを Turso に適用
 * _prisma_migrations テーブルで適用済みを管理
 *
 * Usage:
 *   pnpm db:migrate:turso
 */

import { createClient } from '@libsql/client'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set')
  process.exit(1)
}

// URL から authToken を抽出
const url = new URL(DATABASE_URL)
const authToken = url.searchParams.get('authToken') ?? undefined
url.searchParams.delete('authToken')

const client = createClient({
  url: url.toString(),
  authToken,
})

const MIGRATIONS_DIR = join(process.cwd(), 'prisma/migrations')

async function ensureMigrationsTable() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id TEXT PRIMARY KEY,
      migration_name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await client.execute('SELECT migration_name FROM _prisma_migrations')
  return new Set(result.rows.map((row) => row.migration_name as string))
}

async function getMigrationFolders(): Promise<string[]> {
  if (!existsSync(MIGRATIONS_DIR)) {
    return []
  }
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort() // タイムスタンプ順にソート
}

async function applyMigration(migrationName: string) {
  const sqlPath = join(MIGRATIONS_DIR, migrationName, 'migration.sql')
  if (!existsSync(sqlPath)) {
    console.warn(`⚠️  ${migrationName}: migration.sql not found, skipping`)
    return false
  }

  const sql = readFileSync(sqlPath, 'utf-8')

  // SQLを個別のステートメントに分割して実行
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  console.log(`📦 Applying: ${migrationName}`)

  for (const statement of statements) {
    try {
      await client.execute(statement)
    } catch (error) {
      // テーブル/インデックスが既に存在する場合はスキップ
      const message = String(error)
      if (message.includes('already exists')) {
        console.log(`   ⏭️  Skipped (already exists)`)
        continue
      }
      throw error
    }
  }

  // 適用済みとして記録
  await client.execute({
    sql: 'INSERT INTO _prisma_migrations (id, migration_name) VALUES (?, ?)',
    args: [crypto.randomUUID(), migrationName],
  })

  console.log(`✅ Applied: ${migrationName}`)
  return true
}

async function main() {
  console.log('🚀 Turso Migration')
  console.log(`   Database: ${url.host}`)
  console.log('')

  await ensureMigrationsTable()

  const applied = await getAppliedMigrations()
  const migrations = await getMigrationFolders()

  if (migrations.length === 0) {
    console.log('📁 No migrations found in prisma/migrations/')
    console.log('   Run `pnpm db:migrate` to create migrations first')
    return
  }

  const pending = migrations.filter((m) => !applied.has(m))

  if (pending.length === 0) {
    console.log('✨ All migrations are already applied')
    return
  }

  console.log(`📋 Pending migrations: ${pending.length}`)
  console.log('')

  for (const migration of pending) {
    await applyMigration(migration)
  }

  console.log('')
  console.log('✨ Done!')
}

main().catch((error) => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
