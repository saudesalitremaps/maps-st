import { vi } from "vitest"

const { prismaMock, getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  prismaMock: {
    gestante: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    uBS: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    enfermeiro: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    gestanteExcluida: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    indicadorMunicipal: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

vi.mock("../src/lib/prisma", () => ({
  prisma: prismaMock,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))

vi.mock("next-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-auth")>()
  return {
    ...actual,
    getServerSession: getServerSessionMock,
  }
})

export { prismaMock, getServerSessionMock }

declare global {
  // eslint-disable-next-line no-var
  var __prismaMock: typeof prismaMock
}

globalThis.__prismaMock = prismaMock
