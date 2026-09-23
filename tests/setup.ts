import { beforeEach, vi } from "vitest"
import { getServerSessionMock, prismaMock } from "./mocks"

process.env.NEXTAUTH_SECRET ??= "test-secret"
process.env.NEXTAUTH_URL ??= "http://localhost:3000"
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test"
Object.defineProperty(process.env, "NODE_ENV", {
  value: "test",
  writable: true,
  configurable: true,
})

vi.spyOn(console, "error").mockImplementation(() => {})
vi.spyOn(console, "warn").mockImplementation(() => {})

beforeEach(() => {
  getServerSessionMock.mockReset()
  getServerSessionMock.mockResolvedValue(null)

  prismaMock.gestante.findMany.mockResolvedValue([])
  prismaMock.gestante.findUnique.mockResolvedValue(null)
  prismaMock.gestante.create.mockReset()
  prismaMock.gestante.update.mockReset()
  prismaMock.gestante.delete.mockReset()
  prismaMock.gestante.deleteMany.mockResolvedValue({ count: 0 })

  prismaMock.uBS.findMany.mockResolvedValue([])
  prismaMock.uBS.findUnique.mockResolvedValue(null)
  prismaMock.uBS.create.mockReset()
  prismaMock.uBS.update.mockReset()
  prismaMock.uBS.delete.mockReset()

  prismaMock.enfermeiro.findMany.mockResolvedValue([])
  prismaMock.enfermeiro.findFirst.mockResolvedValue(null)
  prismaMock.enfermeiro.findUnique.mockResolvedValue(null)
  prismaMock.enfermeiro.create.mockReset()
  prismaMock.enfermeiro.update.mockReset()
  prismaMock.enfermeiro.delete.mockReset()
  prismaMock.enfermeiro.count.mockResolvedValue(0)

  prismaMock.gestanteExcluida.create.mockResolvedValue({})
  prismaMock.gestanteExcluida.createMany.mockResolvedValue({ count: 0 })
  prismaMock.gestanteExcluida.findMany.mockResolvedValue([])

  prismaMock.indicadorMunicipal.findUnique.mockResolvedValue(null)
  prismaMock.indicadorMunicipal.upsert.mockReset()
})
