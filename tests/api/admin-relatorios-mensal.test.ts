import { describe, expect, it } from "vitest"
import { GET } from "@/app/api/admin/relatorios/mensal/route"
import { adminSession, apiRequest, makeGestante, prismaMock, readJson, setSession } from "../helpers"

describe("GET /api/admin/relatorios/mensal", () => {
  it("rejeita mês inválido", async () => {
    setSession(adminSession)
    const { status, data } = await readJson(await GET(apiRequest("/api/admin/relatorios/mensal?mes=13&ano=2026")))
    expect(status).toBe(400)
    expect(data.error).toBe("Mês e ano inválidos")
  })

  it("retorna resumo e planilha de monitoramento", async () => {
    setSession(adminSession)
    const dum = new Date()
    dum.setDate(dum.getDate() - 60)
    const ativa = makeGestante({ dum, createdAt: new Date(2026, 8, 5), risco: "Risco Baixo" })

    prismaMock.gestante.findMany.mockResolvedValue([ativa])
    prismaMock.gestanteExcluida.findMany.mockResolvedValue([])
    prismaMock.indicadorMunicipal.findUnique.mockResolvedValue({ ano: 2026, gestantesEstimadas: 120 })

    const { status, data } = await readJson<{
      periodo: { mes: number; ano: number; nomeMes: string }
      resumo: { novosCadastros: number }
      planilhaMonitoramento: { gestantesEstimadas: number; totalGestantesAteOMomento: number }
    }>(await GET(apiRequest("/api/admin/relatorios/mensal?mes=9&ano=2026")))

    expect(status).toBe(200)
    expect(data.periodo).toEqual({ mes: 9, ano: 2026, nomeMes: "Setembro" })
    expect(data.resumo.novosCadastros).toBeGreaterThanOrEqual(0)
    expect(data.planilhaMonitoramento.gestantesEstimadas).toBe(120)
    expect(data.planilhaMonitoramento.totalGestantesAteOMomento).toBeGreaterThanOrEqual(0)
  })

  it("retorna 500 se o banco falhar", async () => {
    setSession(adminSession)
    prismaMock.gestante.findMany.mockRejectedValue(new Error("db"))
    const { status, data } = await readJson(await GET(apiRequest("/api/admin/relatorios/mensal")))
    expect(status).toBe(500)
    expect(data.error).toBe("Erro ao gerar relatório mensal")
  })
})
