import type { Generated, Insertable, Selectable, Updateable } from 'kysely'

// User table
export interface UserTable {
  id: string
  name: string
  email: string
  email_verified: number // SQLite uses 0/1 for boolean
  image: string | null
  created_at: Generated<string>
  updated_at: Generated<string>
  is_anonymous: number // SQLite uses 0/1 for boolean
}

export type User = Selectable<UserTable>
export type NewUser = Insertable<UserTable>
export type UserUpdate = Updateable<UserTable>

// Session table
export interface SessionTable {
  id: string
  expires_at: string
  token: string
  created_at: Generated<string>
  updated_at: Generated<string>
  ip_address: string | null
  user_agent: string | null
  user_id: string
}

export type Session = Selectable<SessionTable>
export type NewSession = Insertable<SessionTable>
export type SessionUpdate = Updateable<SessionTable>

// Account table
export interface AccountTable {
  id: string
  account_id: string
  provider_id: string
  user_id: string
  access_token: string | null
  refresh_token: string | null
  id_token: string | null
  access_token_expires_at: string | null
  refresh_token_expires_at: string | null
  scope: string | null
  password: string | null
  created_at: Generated<string>
  updated_at: Generated<string>
}

export type Account = Selectable<AccountTable>
export type NewAccount = Insertable<AccountTable>
export type AccountUpdate = Updateable<AccountTable>

// Verification table
export interface VerificationTable {
  id: string
  identifier: string
  value: string
  expires_at: string
  created_at: Generated<string>
  updated_at: Generated<string>
}

export type Verification = Selectable<VerificationTable>
export type NewVerification = Insertable<VerificationTable>
export type VerificationUpdate = Updateable<VerificationTable>

// API Usage Log table
export interface ApiUsageLogTable {
  id: string
  created_at: Generated<string>
  user_id: string | null
  operation: string
  model: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  cost_jpy: number
  exchange_rate: number
  metadata: string | null
}

export type ApiUsageLog = Selectable<ApiUsageLogTable>
export type NewApiUsageLog = Insertable<ApiUsageLogTable>
export type ApiUsageLogUpdate = Updateable<ApiUsageLogTable>

// Database schema
export interface Database {
  user: UserTable
  session: SessionTable
  account: AccountTable
  verification: VerificationTable
  api_usage_log: ApiUsageLogTable
}
