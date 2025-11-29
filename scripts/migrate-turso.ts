#!/usr/bin/env npx tsx
/**
 * Turso マイグレーションスクリプト
 *
 * prisma/migrations/ 内のマイグレーションを Turso に適用
 * _prisma_migrations テーブルで適用済みを管理
 * turso CLI のログイン状態を使用（トークン不要）
 *
 * Usage:
 *   pnpm turso:migrate
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { $ } from 'zx'

$.quiet = true

const DB_NAME = process.env.TURSO_DB_NAME ?? 'slidecraft'
const MIGRATIONS_DIR = join(process.cwd(), 'prisma/migrations')

/**
 * マイグレーション名のバリデーション
 * SQLインジェクション対策として、英数字・アンダースコア・ハイフンのみ許可
 */
export function validateMigrationName(name: string): void {
  if (!/^[\w-]+$/.test(name)) {
    throw new Error(`Invalid migration name: ${name}`)
  }
}

/**
 * SQL 文字列リテラル用のエスケープ
 * シングルクォートを2重にしてエスケープ
 */
function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''")
}

async function tursoShell(sql: string): Promise<string> {
  try {
    const result = await $`turso db shell ${DB_NAME} ${sql}`
    return result.stdout
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return 'SKIPPED'
    }
    throw error
  }
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inSingleQuote = false
  let inDoubleQuote = false
  let inMultiLineComment = false
  let inSingleLineComment = false

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const nextChar = sql[i + 1]
    const prevChar = sql[i - 1]

    if (!inSingleQuote && !inDoubleQuote && !inSingleLineComment) {
      if (char === '/' && nextChar === '*') {
        inMultiLineComment = true
        i++
        continue
      }
      if (inMultiLineComment && char === '*' && nextChar === '/') {
        inMultiLineComment = false
        i++
        continue
      }
    }

    if (!inSingleQuote && !inDoubleQuote && !inMultiLineComment) {
      if (char === '-' && nextChar === '-') {
        inSingleLineComment = true
        i++
        continue
      }
      if (inSingleLineComment && char === '\n') {
        inSingleLineComment = false
        continue
      }
    }

    if (inMultiLineComment || inSingleLineComment) {
      continue
    }

    if (char === "'" && prevChar !== '\\') {
      inSingleQuote = !inSingleQuote
    } else if (char === '"' && prevChar !== '\\') {
      inDoubleQuote = !inDoubleQuote
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      const statement = current.trim()
      if (statement.length > 0) {
        statements.push(statement)
      }
      current = ''
      continue
    }

    current += char
  }

  const finalStatement = current.trim()
  if (finalStatement.length > 0) {
    statements.push(finalStatement)
  }

  return statements
}

async function ensureMigrationsTable(): Promise<void> {
  await tursoShell(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id TEXT PRIMARY KEY,
      migration_name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await tursoShell(
    'SELECT migration_name FROM _prisma_migrations',
  )
  const migrations = new Set<string>()
  for (const line of result.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('migration_name')) {
      migrations.add(trimmed)
    }
  }
  return migrations
}

function getMigrationFolders(): string[] {
  if (!existsSync(MIGRATIONS_DIR)) {
    return []
  }
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort()
}

async function applyMigration(migrationName: string): Promise<boolean> {
  const sqlPath = join(MIGRATIONS_DIR, migrationName, 'migration.sql')
  if (!existsSync(sqlPath)) {
    console.warn(`⚠️  ${migrationName}: migration.sql not found, skipping`)
    return false
  }

  const sql = readFileSync(sqlPath, 'utf-8')
  const statements = splitSqlStatements(sql)

  console.log(`📦 Applying: ${migrationName}`)

  for (const statement of statements) {
    const result = await tursoShell(statement)
    if (result === 'SKIPPED') {
      console.log(`   ⏭️  Skipped (already exists)`)
    }
  }

  // migrationName はファイルシステムから取得しているが、念のためバリデーション
  validateMigrationName(migrationName)

  const id = crypto.randomUUID()
  const escapedId = escapeSqlString(id)
  const escapedMigrationName = escapeSqlString(migrationName)
  await tursoShell(
    `INSERT INTO _prisma_migrations (id, migration_name) VALUES ('${escapedId}', '${escapedMigrationName}')`,
  )

  console.log(`✅ Applied: ${migrationName}`)
  return true
}

async function main(): Promise<void> {
  console.log('🚀 Turso Migration')
  console.log(`   Database: ${DB_NAME}`)
  console.log('')

  await ensureMigrationsTable()

  const applied = await getAppliedMigrations()
  const migrations = getMigrationFolders()

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

// Only run main when executed directly (not when imported for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
}
