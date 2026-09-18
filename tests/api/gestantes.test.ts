import { describe, expect, it } from "vitest"
import { GET, POST } from "@/app/api/gestantes/route"
import {
  adminSession,
  apiRequest,
  makeGestante,
  nurseSession,
  nurseWithoutUbsSession,
  prismaMock,
  readJson,
  setSession,
} from "../helpers"

function novaGestanteBody(overrides: Record<string, unknown> = {}) {
  return {
    nome: "Joana Costa",
    dataNascimento: "1999-05-20",
    cartaoSus: "898000000000099",
    telefone: "(88) 99999-1111",
    ubsId: "ubs-1",
    dum: "2026-03-01",
    semanasInicioPreNatal: 6,
    etnia: "Pardo",
    gestacoesAnteriores: 0,
    risco: "Risco Baixo",
    exames: { rotina1: true, ultrassom1: true },
    vacinas: { hb: true },
    ...overrides,
  }
}

describe("GET /api/gestantes", () => {
  it("retorna 401 sem sessão", async () => {
    const { status, data } = await readJson(await GET(apiRequest("/api/gestantes")))
    expect(status).toBe(401)
    expect(data.error).toBe("Não autenticado")
  })

  it("retorna 400 se profissional não tem UBS", async () => {
    setSession(nurseWithoutUbsSession)
    const { status, data } = await readJson(await GET(apiRequest("/api/gestantes")))
    expect(status).toBe(400)
    expect(data.error).toBe("Profissional sem UBS associada")
  })

  it("lista apenas gestantes ativas da UBS do profissional", async () => {
    setSession(nurseSession)
    const ativa = makeGestante()
    const encerrada = makeGestante({
      id: "g-2",
      desfecho: "nascido",
      dum: new Date("2025-01-01"),
    })
    prismaMock.gestante.findMany.mockImplementation(async (args?: { where?: { ubsId?: string } }) => {
      if (args?.where?.dpp?.lt) return []
      expect(args?.where).toEqual({ ubsId: "ubs-1" })
      return [ativa, encerrada]
    })

    const { status, data } = await readJson<typeof ativa[]>(await GET(apiRequest("/api/gestantes")))
    expect(status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe("g-1")
  })

  it("admin lista todas as UBS", async () => {
    setSession(adminSession)
    prismaMock.gestante.findMany.mockImplementation(async (args?: { where?: unknown }) => {
      if ((args?.where as { dpp?: unknown } | undefined)?.dpp) return []
      expect(args?.where).toBeUndefined()
      return [makeGestante()]
    })

    const { status, data } = await readJson<unknown[]>(await GET(apiRequest("/api/gestantes")))
    expect(status).toBe(200)
    expect(data).toHaveLength(1)
  })

  it("não falha a listagem se a limpeza automática quebrar", async () => {
    setSession(adminSession)
    prismaMock.gestante.findMany
      .mockRejectedValueOnce(new Error("falha na limpeza"))
      .mockResolvedValueOnce([makeGestante()])

    const { status } = await readJson(await GET(apiRequest("/api/gestantes")))
    expect(status).toBe(200)
  })

  it("retorna 500 quando o banco falha", async () => {
    setSession(adminSession)
    prismaMock.gestante.findMany.mockRejectedValue(new Error("db down"))
    const { status, data } = await readJson(await GET(apiRequest("/api/gestantes")))
    expect(status).toBe(500)
    expect(data.error).toBe("db down")
  })
})

describe("POST /api/gestantes", () => {
  it("retorna 401 sem sessão", async () => {
    const { status } = await readJson(
      await POST(apiRequest("/api/gestantes", { method: "POST", body: novaGestanteBody() }))
    )
    expect(status).toBe(401)
  })

  it("exige cartão do SUS", async () => {
    setSession(adminSession)
    const { status, data } = await readJson(
      await POST(apiRequest("/api/gestantes", { method: "POST", body: novaGestanteBody({ cartaoSus: "" }) }))
    )
    expect(status).toBe(400)
    expect(data.error).toBe("Cartão do SUS é obrigatório")
  })

  it("exige data de nascimento", async () => {
    setSession(adminSession)
    const { status, data } = await readJson(
      await POST(
        apiRequest("/api/gestantes", { method: "POST", body: novaGestanteBody({ dataNascimento: undefined }) })
      )
    )
    expect(status).toBe(400)
    expect(data.error).toBe("Data de nascimento é obrigatória")
  })

  it("valida semanas de início do pré-natal", async () => {
    setSession(adminSession)
    const { status, data } = await readJson(
      await POST(
        apiRequest("/api/gestantes", { method: "POST", body: novaGestanteBody({ semanasInicioPreNatal: 50 }) })
      )
    )
    expect(status).toBe(400)
    expect(String(data.error)).toMatch(/Semanas de início/)
  })

  it("valida telefone", async () => {
    setSession(adminSession)
    const { status, data } = await readJson(
      await POST(apiRequest("/api/gestantes", { method: "POST", body: novaGestanteBody({ telefone: "123" }) }))
    )
    expect(status).toBe(400)
    expect(String(data.error)).toMatch(/Telefone inválido/)
  })

  it("exige UBS quando admin não informa ubsId", async () => {
    setSession(adminSession)
    const { status, data } = await readJson(
      await POST(apiRequest("/api/gestantes", { method: "POST", body: novaGestanteBody({ ubsId: undefined }) }))
    )
    expect(status).toBe(400)
    expect(data.error).toBe("UBS é obrigatória")
  })

  it("cria gestante na UBS do profissional e calcula DPP", async () => {
    setSession(nurseSession)
    const criada = makeGestante({ nome: "Joana Costa" })
    prismaMock.gestante.create.mockResolvedValue(criada)

    const { status, data } = await readJson(
      await POST(
        apiRequest("/api/gestantes", {
          method: "POST",
          body: novaGestanteBody({ ubsId: "ubs-outra" }),
        })
      )
    )

    expect(status).toBe(201)
    expect(data.nome).toBe("Joana Costa")
    const payload = prismaMock.gestante.create.mock.calls[0][0].data
    expect(payload.ubsId).toBe("ubs-1")
    expect(payload.dpp).toBeInstanceOf(Date)
    expect(payload.telefone).toBe("88999991111")
  })

  it("retorna 500 quando a criação falha", async () => {
    setSession(adminSession)
    prismaMock.gestante.create.mockRejectedValue(new Error("unique constraint"))
    const { status, data } = await readJson(
      await POST(apiRequest("/api/gestantes", { method: "POST", body: novaGestanteBody() }))
    )
    expect(status).toBe(500)
    expect(data.error).toBe("unique constraint")
  })
})
