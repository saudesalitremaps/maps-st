import { describe, expect, it } from "vitest"
import { GET } from "@/app/api/admin/relatorios/route"
import { adminSession, apiRequest, makeGestante, nurseSession, prismaMock, readJson, setSession } from "../helpers"

describe("GET /api/admin/relatorios", () => {
  it("exige admin", async () => {
    setSession(nurseSession)
    const { status } = await readJson(await GET(apiRequest("/api/admin/relatorios")))
    expect(status).toBe(403)
  })

  it("monta relatório com estatísticas e filtros", async () => {
    setSession(adminSession)
    const dum = new Date()
    dum.setDate(dum.getDate() - 80)
    prismaMock.gestante.findMany.mockResolvedValue([
      makeGestante({ dum, risco: "Risco Alto", etnia: "Pardo", exameRotina1Trimestre: true, vacinaHB: true }),
      makeGestante({
        id: "g-velha",
        dum: new Date("2020-01-01"),
        risco: "Risco Baixo",
        etnia: "Branco",
      }),
    ])

    const { status, data } = await readJson<{
      gestantes: { id: string; semanasGestacao: number }[]
      estatisticas: { total: number; porRisco: { alto: number }; porEtnia: Record<string, number> }
      filtros: { risco: string | null; ubsId: string | null }
    }>(await GET(apiRequest("/api/admin/relatorios?ubsId=ubs-1&risco=Risco Alto&vacinaHB=true")))

    expect(status).toBe(200)
    expect(data.gestantes).toHaveLength(1)
    expect(data.gestantes[0].id).toBe("g-1")
    expect(data.gestantes[0].semanasGestacao).toBeGreaterThan(0)
    expect(data.estatisticas.total).toBe(1)
    expect(data.estatisticas.porRisco.alto).toBe(1)
    expect(data.estatisticas.porEtnia.Pardo).toBe(1)
    expect(data.filtros.ubsId).toBe("ubs-1")
    expect(data.filtros.risco).toBe("Risco Alto")
    expect(prismaMock.gestante.findMany.mock.calls[0][0].where).toMatchObject({
      ubsId: "ubs-1",
      risco: "Risco Alto",
      vacinaHB: true,
    })
  })

  it("filtra por idade", async () => {
    setSession(adminSession)
    const jovem = makeGestante({
      dataNascimento: new Date(new Date().getFullYear() - 18, 0, 1),
    })
    const maisVelha = makeGestante({
      id: "g-idade",
      dataNascimento: new Date(new Date().getFullYear() - 40, 0, 1),
    })
    prismaMock.gestante.findMany.mockResolvedValue([jovem, maisVelha])

    const { data } = await readJson<{ gestantes: { id: string }[] }>(
      await GET(apiRequest("/api/admin/relatorios?idadeMin=30&idadeMax=45"))
    )
    expect(data.gestantes.map((g) => g.id)).toEqual(["g-idade"])
  })
})
