import { describe, expect, it } from "vitest"
import { POST } from "@/app/api/admin/gestantes/cleanup/route"
import { adminSession, apiRequest, nurseSession, prismaMock, readJson, setSession } from "../helpers"

describe("POST /api/admin/gestantes/cleanup", () => {
  it("exige admin", async () => {
    setSession(nurseSession)
    const { status } = await readJson(await POST(apiRequest("/api/admin/gestantes/cleanup", { method: "POST" })))
    expect(status).toBe(403)
  })

  it("remove gestantes com DPP antiga e registra auditoria", async () => {
    setSession(adminSession)
    const antiga = {
      ...{
        nome: "Ex",
        dataNascimento: null,
        cartaoSus: "1",
        telefone: null,
        ubsId: "ubs-1",
        dum: new Date("2024-01-01"),
        dpp: new Date("2024-10-01"),
        semanasInicioPreNatal: 8,
        etnia: "Pardo",
        gestacoesAnteriores: 0,
        risco: "Risco Baixo",
        descricaoRisco: null,
        motivoAltoRisco: null,
        exameRotina1Trimestre: false,
        exameRotina2Trimestre: false,
        exameRotina3Trimestre: false,
        ultrassom1Trimestre: false,
        ultrassom2Trimestre: false,
        ultrassom3Trimestre: false,
        vacinaHB: false,
        vacinaDT: false,
        vacinaInfluenza: false,
        vacinaCovid19: false,
        vacinaDTPA20Semana: false,
        vacinaVSR28Semana: false,
        testesRapidos1Trimestre: false,
        testesRapidos3Trimestre: false,
        numeroConsultas: 0,
        planoDeCuidados: false,
        gestaoDeCaso: false,
        vinculadaMaternidade: false,
        nomeMaternidade: null,
        destinoAAE: null,
        statusAAE: "nao_encaminhada",
        dataEncaminhamentoAAE: null,
        dataAcessoAAE: null,
        desfecho: "em_andamento",
        dataDesfecho: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }
    prismaMock.gestante.findMany.mockResolvedValue([antiga])
    prismaMock.gestanteExcluida.createMany.mockResolvedValue({ count: 1 })
    prismaMock.gestante.deleteMany.mockResolvedValue({ count: 1 })

    const { status, data } = await readJson(
      await POST(apiRequest("/api/admin/gestantes/cleanup", { method: "POST" }))
    )
    expect(status).toBe(200)
    expect(data.removidas).toBe(1)
    expect(prismaMock.gestanteExcluida.createMany).toHaveBeenCalled()
    const auditoria = prismaMock.gestanteExcluida.createMany.mock.calls[0][0].data[0]
    expect(auditoria.motivoExclusao).toBe("automatica")
    expect(auditoria.enfermeiroId).toBeNull()
  })

  it("retorna 500 se a limpeza falhar", async () => {
    setSession(adminSession)
    prismaMock.gestante.findMany.mockRejectedValue(new Error("falha"))
    const { status, data } = await readJson(
      await POST(apiRequest("/api/admin/gestantes/cleanup", { method: "POST" }))
    )
    expect(status).toBe(500)
    expect(data.error).toBe("falha")
  })
})
