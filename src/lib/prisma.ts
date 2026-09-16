import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Verificar se DATABASE_URL está configurado
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL não está configurado.')
} else {
  console.log('DATABASE_URL configurado (PostgreSQL)')
}

// Para PostgreSQL (Supabase), não é necessário adapter
// O Prisma Client se conecta diretamente usando a URL
const prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance

export const prisma = prismaInstance

