import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '~/generated/prisma/client'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

export const prisma = new PrismaClient({ adapter })
