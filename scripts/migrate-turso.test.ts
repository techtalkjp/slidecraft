import { describe, expect, it } from 'vitest'
import { validateMigrationName } from './migrate-turso'

describe('validateMigrationName', () => {
  it('accepts valid migration names', () => {
    expect(() => validateMigrationName('20251128151352_init')).not.toThrow()
    expect(() => validateMigrationName('migration_name')).not.toThrow()
    expect(() => validateMigrationName('migration-name')).not.toThrow()
    expect(() => validateMigrationName('MigrationName123')).not.toThrow()
  })

  it('rejects path traversal attempts', () => {
    expect(() => validateMigrationName('../../etc/passwd')).toThrow(
      'Invalid migration name',
    )
    expect(() => validateMigrationName('../secrets')).toThrow(
      'Invalid migration name',
    )
    expect(() => validateMigrationName('foo/../bar')).toThrow(
      'Invalid migration name',
    )
  })

  it('rejects SQL injection attempts', () => {
    expect(() => validateMigrationName("'; DROP TABLE users; --")).toThrow(
      'Invalid migration name',
    )
    expect(() => validateMigrationName('name; DELETE FROM')).toThrow(
      'Invalid migration name',
    )
  })

  it('rejects names with spaces or special characters', () => {
    expect(() => validateMigrationName('migration name')).toThrow(
      'Invalid migration name',
    )
    expect(() => validateMigrationName('migration@name')).toThrow(
      'Invalid migration name',
    )
    expect(() => validateMigrationName('migration!name')).toThrow(
      'Invalid migration name',
    )
  })

  it('rejects empty string', () => {
    expect(() => validateMigrationName('')).toThrow('Invalid migration name')
  })
})
