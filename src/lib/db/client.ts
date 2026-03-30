import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ??
    'postgresql://user:password@localhost:5432/sanctuary_booking'

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
