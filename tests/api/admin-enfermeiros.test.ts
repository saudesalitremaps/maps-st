import { describe, expect, it } from "vitest"
import { GET, POST } from "@/app/api/admin/enfermeiros/route"
import { DELETE, PUT } from "@/app/api/admin/enfermeiros/[id]/route"
import { adminSession, apiRequest, nurseSession, prismaMock, readJson, routeParams, setSession } from "../helpers"

describe("GET /api/admin/enfermeiros", () => {
  it("exige admin", async () => {
    const { status } = await readJson(await GET(apiRequest("/api/admin/enfermeiros")))
    expect(status).toBe(401)
    setSession(nurseSession)
    const denied = await readJson(await GET(apiRequest("/api/admin/enfermeiros")))
    expect(denied.status).toBe(403)
  })

  it("lista profissionais", async () => {
    setSession(adminSession)
    prismaMock.enfermeiro.findMany.mockResolvedValue([
      { id: "enf-1", nome: "Ana", email: "ana@ubs.com", isAdmin: false },
    ])
    const { status, data } = await readJson<unknown[]>(await GET(apiRequest("/api/admin/enfermeiros")))
    expect(status).toBe(200)
    expect(data).toHaveLength(1)
  })
})

describe("POST /api/admin/enfermeiros", () => {
  it("valida campos obrigatórios e senha curta", async () => {
    setSession(adminSession)
    const vazio = await readJson(
      await POST(apiRequest("/api/admin/enfermeiros", { method: "POST", body: { nome: "" } }))
    )
    expect(vazio.status).toBe(400)

    const senha = await readJson(
      await POST(
        apiRequest("/api/admin/enfermeiros", {
          method: "POST",
          body: { nome: "Ana", email: "ana@ubs.com", senha: "123", ubsId: "ubs-1" },
        })
      )
    )
    expect(senha.status).toBe(400)
    expect(String(senha.data.error)).toMatch(/8 caracteres/)
  })

  it("exige UBS para profissional não-admin", async () => {
    setSession(adminSession)
    const { status, data } = await readJson(
      await POST(
        apiRequest("/api/admin/enfermeiros", {
          method: "POST",
          body: { nome: "Ana", email: "ana@ubs.com", senha: "senha1234", isAdmin: false },
        })
      )
    )
    expect(status).toBe(400)
    expect(String(data.error)).toMatch(/vinculados a uma UBS/)
  })

  it("não permite e-mail duplicado", async () => {
    setSession(adminSession)
    prismaMock.enfermeiro.findFirst.mockResolvedValue({ id: "x" })
    const { status } = await readJson(
      await POST(
        apiRequest("/api/admin/enfermeiros", {
          method: "POST",
          body: { nome: "Ana", email: "ana@ubs.com", senha: "senha1234", ubsId: "ubs-1" },
        })
      )
    )
    expect(status).toBe(409)
  })

  it("cria profissional com senha hasheada", async () => {
    setSession(adminSession)
    prismaMock.enfermeiro.findFirst.mockResolvedValue(null)
    prismaMock.enfermeiro.create.mockResolvedValue({
      id: "enf-9",
      nome: "Ana",
      email: "ana@ubs.com",
      isAdmin: false,
      ubsId: "ubs-1",
    })

    const { status, data } = await readJson(
      await POST(
        apiRequest("/api/admin/enfermeiros", {
          method: "POST",
          body: { nome: " Ana ", email: "Ana@UBS.com", senha: "senha1234", ubsId: "ubs-1" },
        })
      )
    )

    expect(status).toBe(201)
    expect(data.email).toBe("ana@ubs.com")
    const payload = prismaMock.enfermeiro.create.mock.calls[0][0].data
    expect(payload.email).toBe("ana@ubs.com")
    expect(payload.senha).not.toBe("senha1234")
    expect(payload.senha.length).toBeGreaterThan(20)
  })
})

describe("PUT /api/admin/enfermeiros/[id]", () => {
  it("não remove o último administrador", async () => {
    setSession(adminSession)
    prismaMock.enfermeiro.findUnique.mockResolvedValue({
      id: "admin-1",
      isAdmin: true,
      email: "admin@maps.com",
    })
    prismaMock.enfermeiro.count.mockResolvedValue(1)

    const { status, data } = await readJson(
      await PUT(
        apiRequest("/api/admin/enfermeiros/admin-1", {
          method: "PUT",
          body: { nome: "Admin", email: "admin@maps.com", isAdmin: false, ubsId: "ubs-1" },
        }),
        routeParams("admin-1")
      )
    )
    expect(status).toBe(409)
    expect(String(data.error)).toMatch(/último administrador/)
  })

  it("atualiza profissional", async () => {
    setSession(adminSession)
    prismaMock.enfermeiro.findUnique.mockResolvedValue({ id: "enf-1", isAdmin: false })
    prismaMock.enfermeiro.findFirst.mockResolvedValue(null)
    prismaMock.enfermeiro.update.mockResolvedValue({
      id: "enf-1",
      nome: "Ana Paula",
      email: "ana@ubs.com",
      isAdmin: false,
      ubsId: "ubs-1",
    })

    const { status, data } = await readJson(
      await PUT(
        apiRequest("/api/admin/enfermeiros/enf-1", {
          method: "PUT",
          body: { nome: "Ana Paula", email: "ana@ubs.com", ubsId: "ubs-1" },
        }),
        routeParams("enf-1")
      )
    )
    expect(status).toBe(200)
    expect(data.nome).toBe("Ana Paula")
  })
})

describe("DELETE /api/admin/enfermeiros/[id]", () => {
  it("impede excluir a si mesmo", async () => {
    setSession(adminSession)
    const { status, data } = await readJson(
      await DELETE(
        apiRequest("/api/admin/enfermeiros/admin-1", { method: "DELETE" }),
        routeParams("admin-1")
      )
    )
    expect(status).toBe(409)
    expect(String(data.error)).toMatch(/próprio usuário/)
  })

  it("impede excluir o último admin", async () => {
    setSession(adminSession)
    prismaMock.enfermeiro.findUnique.mockResolvedValue({ id: "admin-2", isAdmin: true })
    prismaMock.enfermeiro.count.mockResolvedValue(1)
    const { status } = await readJson(
      await DELETE(
        apiRequest("/api/admin/enfermeiros/admin-2", { method: "DELETE" }),
        routeParams("admin-2")
      )
    )
    expect(status).toBe(409)
  })

  it("exclui profissional", async () => {
    setSession(adminSession)
    prismaMock.enfermeiro.findUnique.mockResolvedValue({ id: "enf-1", isAdmin: false })
    prismaMock.enfermeiro.delete.mockResolvedValue({})
    const { status, data } = await readJson(
      await DELETE(apiRequest("/api/admin/enfermeiros/enf-1", { method: "DELETE" }), routeParams("enf-1"))
    )
    expect(status).toBe(200)
    expect(data.ok).toBe(true)
  })
})
