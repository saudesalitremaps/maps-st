import { describe, expect, it } from "vitest"
import { GET, PUT } from "@/app/api/admin/indicadores/route"
import { adminSession, apiRequest, nurseSession, prismaMock, readJson, setSession } from "../helpers"

describe("GET /api/admin/indicadores", () => {
  it("exige admin", async () => {
    setSession(nurseSession)
    const { status } = await readJson(await GET(apiRequest("/api/admin/indicadores")))
    expect(status).toBe(403)
  })

  it("rejeita ano inválido", async () => {
    setSession(adminSession)
    const { status } = await readJson(await GET(apiRequest("/api/admin/indicadores?ano=abc")))
    expect(status).toBe(400)
  })

  it("retorna zero quando não há indicador", async () => {
    setSession(adminSession)
    prismaMock.indicadorMunicipal.findUnique.mockResolvedValue(null)
    const { status, data } = await readJson(await GET(apiRequest("/api/admin/indicadores?ano=2026")))
    expect(status).toBe(200)
    expect(data).toEqual({ ano: 2026, gestantesEstimadas: 0 })
  })
})

describe("PUT /api/admin/indicadores", () => {
  it("valida ano e quantidade", async () => {
    setSession(adminSession)
    const ano = await readJson(
      await PUT(apiRequest("/api/admin/indicadores", { method: "PUT", body: { ano: 1999, gestantesEstimadas: 10 } }))
    )
    expect(ano.status).toBe(400)

    const qtd = await readJson(
      await PUT(apiRequest("/api/admin/indicadores", { method: "PUT", body: { ano: 2026, gestantesEstimadas: -1 } }))
    )
    expect(qtd.status).toBe(400)
  })

  it("faz upsert do indicador", async () => {
    setSession(adminSession)
    prismaMock.indicadorMunicipal.upsert.mockResolvedValue({
      ano: 2026,
      gestantesEstimadas: 120,
    })
    const { status, data } = await readJson(
      await PUT(
        apiRequest("/api/admin/indicadores", { method: "PUT", body: { ano: 2026, gestantesEstimadas: 120 } })
      )
    )
    expect(status).toBe(200)
    expect(data.gestantesEstimadas).toBe(120)
    expect(prismaMock.indicadorMunicipal.upsert).toHaveBeenCalledWith({
      where: { ano: 2026 },
      create: { ano: 2026, gestantesEstimadas: 120 },
      update: { gestantesEstimadas: 120 },
    })
  })
})
