import { describe, expect, it } from "vitest"
import { DELETE, GET, PUT } from "@/app/api/gestantes/[id]/route"
import {
  adminSession,
  apiRequest,
  makeGestante,
  nurseOtherUbsSession,
  nurseSession,
  prismaMock,
  readJson,
  routeParams,
  setSession,
} from "../helpers"

describe("GET /api/gestantes/[id]", () => {
  it("retorna 401 sem sessão", async () => {
    const { status } = await readJson(await GET(apiRequest("/api/gestantes/g-1"), routeParams("g-1")))
    expect(status).toBe(401)
  })

  it("retorna 404 quando não existe", async () => {
    setSession(adminSession)
    prismaMock.gestante.findUnique.mockResolvedValue(null)
    const { status, data } = await readJson(await GET(apiRequest("/api/gestantes/g-1"), routeParams("g-1")))
    expect(status).toBe(404)
    expect(data.error).toBe("Gestante não encontrada")
  })

  it("bloqueia profissional de outra UBS", async () => {
    setSession(nurseOtherUbsSession)
    prismaMock.gestante.findUnique.mockResolvedValue(makeGestante({ ubsId: "ubs-1" }))
    const { status, data } = await readJson(await GET(apiRequest("/api/gestantes/g-1"), routeParams("g-1")))
    expect(status).toBe(403)
    expect(data.error).toBe("Acesso negado à gestante")
  })

  it("retorna a gestante para admin", async () => {
    setSession(adminSession)
    prismaMock.gestante.findUnique.mockResolvedValue(makeGestante())
    const { status, data } = await readJson(await GET(apiRequest("/api/gestantes/g-1"), routeParams("g-1")))
    expect(status).toBe(200)
    expect(data.id).toBe("g-1")
  })
})

describe("PUT /api/gestantes/[id]", () => {
  it("retorna 404 se a gestante não existe", async () => {
    setSession(nurseSession)
    prismaMock.gestante.findUnique.mockResolvedValue(null)
    const { status } = await readJson(
      await PUT(apiRequest("/api/gestantes/g-1", { method: "PUT", body: { nome: "Novo" } }), routeParams("g-1"))
    )
    expect(status).toBe(404)
  })

  it("valida telefone e semanas", async () => {
    setSession(nurseSession)
    prismaMock.gestante.findUnique.mockResolvedValue(makeGestante())

    const tel = await readJson(
      await PUT(apiRequest("/api/gestantes/g-1", { method: "PUT", body: { telefone: "99" } }), routeParams("g-1"))
    )
    expect(tel.status).toBe(400)

    const semanas = await readJson(
      await PUT(
        apiRequest("/api/gestantes/g-1", { method: "PUT", body: { semanasInicioPreNatal: 0 } }),
        routeParams("g-1")
      )
    )
    expect(semanas.status).toBe(400)
  })

  it("atualiza gestante da própria UBS e recalcula DPP", async () => {
    setSession(nurseSession)
    const atual = makeGestante()
    prismaMock.gestante.findUnique.mockResolvedValue(atual)
    prismaMock.gestante.update.mockResolvedValue({ ...atual, nome: "Maria Atualizada" })

    const { status, data } = await readJson(
      await PUT(
        apiRequest("/api/gestantes/g-1", {
          method: "PUT",
          body: {
            nome: "Maria Atualizada",
            dum: "2026-04-01",
            telefone: "",
            exames: { rotina2: true },
            vacinas: { influenza: true },
          },
        }),
        routeParams("g-1")
      )
    )

    expect(status).toBe(200)
    expect(data.nome).toBe("Maria Atualizada")
    const payload = prismaMock.gestante.update.mock.calls[0][0].data
    expect(payload.dpp).toBeInstanceOf(Date)
    expect(payload.telefone).toBeNull()
    expect(payload.ubsId).toBeUndefined()
  })

  it("só admin pode trocar a UBS", async () => {
    setSession(adminSession)
    prismaMock.gestante.findUnique.mockResolvedValue(makeGestante())
    prismaMock.gestante.update.mockResolvedValue(makeGestante({ ubsId: "ubs-2" }))

    await PUT(
      apiRequest("/api/gestantes/g-1", { method: "PUT", body: { ubsId: "ubs-2" } }),
      routeParams("g-1")
    )
    expect(prismaMock.gestante.update.mock.calls[0][0].data.ubsId).toBe("ubs-2")
  })
})

describe("DELETE /api/gestantes/[id]", () => {
  it("registra auditoria e remove a gestante", async () => {
    setSession(nurseSession)
    prismaMock.gestante.findUnique.mockResolvedValue(makeGestante())
    prismaMock.gestanteExcluida.create.mockResolvedValue({})
    prismaMock.gestante.delete.mockResolvedValue({})

    const { status, data } = await readJson(
      await DELETE(apiRequest("/api/gestantes/g-1", { method: "DELETE" }), routeParams("g-1"))
    )

    expect(status).toBe(200)
    expect(data.message).toMatch(/deletada/)
    expect(prismaMock.gestanteExcluida.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          enfermeiroId: "enf-1",
          motivoExclusao: "manual",
          cartaoSus: "898000000000001",
        }),
      })
    )
    expect(prismaMock.gestante.delete).toHaveBeenCalledWith({ where: { id: "g-1" } })
  })

  it("ainda exclui se a auditoria falhar", async () => {
    setSession(adminSession)
    prismaMock.gestante.findUnique.mockResolvedValue(makeGestante())
    prismaMock.gestanteExcluida.create.mockRejectedValue(new Error("audit fail"))
    prismaMock.gestante.delete.mockResolvedValue({})

    const { status } = await readJson(
      await DELETE(apiRequest("/api/gestantes/g-1", { method: "DELETE" }), routeParams("g-1"))
    )
    expect(status).toBe(200)
    expect(prismaMock.gestante.delete).toHaveBeenCalled()
  })

  it("nega exclusão de outra UBS", async () => {
    setSession(nurseOtherUbsSession)
    prismaMock.gestante.findUnique.mockResolvedValue(makeGestante({ ubsId: "ubs-1" }))
    const { status } = await readJson(
      await DELETE(apiRequest("/api/gestantes/g-1", { method: "DELETE" }), routeParams("g-1"))
    )
    expect(status).toBe(403)
    expect(prismaMock.gestante.delete).not.toHaveBeenCalled()
  })
})
