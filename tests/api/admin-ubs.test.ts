import { describe, expect, it } from "vitest"
import { GET, POST } from "@/app/api/admin/ubs/route"
import { DELETE, PUT } from "@/app/api/admin/ubs/[id]/route"
import { adminSession, apiRequest, nurseSession, prismaMock, readJson, routeParams, setSession } from "../helpers"

describe("GET /api/admin/ubs", () => {
  it("bloqueia não-admin", async () => {
    setSession(nurseSession)
    const { status, data } = await readJson(await GET(apiRequest("/api/admin/ubs")))
    expect(status).toBe(403)
    expect(String(data.error)).toMatch(/administradores/)
  })

  it("lista UBS com profissionais", async () => {
    setSession(adminSession)
    prismaMock.uBS.findMany.mockResolvedValue([{ id: "ubs-1", nome: "UBS Centro", enfermeiros: [] }])
    const { status, data } = await readJson<unknown[]>(await GET(apiRequest("/api/admin/ubs")))
    expect(status).toBe(200)
    expect(data).toHaveLength(1)
  })
})

describe("POST /api/admin/ubs", () => {
  it("valida nome e endereço", async () => {
    setSession(adminSession)
    const { status, data } = await readJson(
      await POST(apiRequest("/api/admin/ubs", { method: "POST", body: { nome: "  " } }))
    )
    expect(status).toBe(400)
    expect(data.error).toMatch(/nome e o endereço/)
  })

  it("cria UBS", async () => {
    setSession(adminSession)
    prismaMock.uBS.create.mockResolvedValue({ id: "ubs-9", nome: "UBS Nova", endereco: "Rua Nova" })
    const { status, data } = await readJson(
      await POST(
        apiRequest("/api/admin/ubs", { method: "POST", body: { nome: " UBS Nova ", endereco: " Rua Nova " } })
      )
    )
    expect(status).toBe(201)
    expect(data.nome).toBe("UBS Nova")
    expect(prismaMock.uBS.create).toHaveBeenCalledWith({
      data: { nome: "UBS Nova", endereco: "Rua Nova" },
    })
  })
})

describe("PUT /api/admin/ubs/[id]", () => {
  it("atualiza UBS", async () => {
    setSession(adminSession)
    prismaMock.uBS.update.mockResolvedValue({ id: "ubs-1", nome: "UBS Centro 2", endereco: "Rua 2" })
    const { status, data } = await readJson(
      await PUT(
        apiRequest("/api/admin/ubs/ubs-1", {
          method: "PUT",
          body: { nome: "UBS Centro 2", endereco: "Rua 2" },
        }),
        routeParams("ubs-1")
      )
    )
    expect(status).toBe(200)
    expect(data.nome).toBe("UBS Centro 2")
  })
})

describe("DELETE /api/admin/ubs/[id]", () => {
  it("retorna 404 se não existe", async () => {
    setSession(adminSession)
    prismaMock.uBS.findUnique.mockResolvedValue(null)
    const { status } = await readJson(
      await DELETE(apiRequest("/api/admin/ubs/ubs-1", { method: "DELETE" }), routeParams("ubs-1"))
    )
    expect(status).toBe(404)
  })

  it("não exclui UBS com vínculos", async () => {
    setSession(adminSession)
    prismaMock.uBS.findUnique.mockResolvedValue({
      id: "ubs-1",
      _count: { gestantes: 2, enfermeiros: 0 },
    })
    const { status, data } = await readJson(
      await DELETE(apiRequest("/api/admin/ubs/ubs-1", { method: "DELETE" }), routeParams("ubs-1"))
    )
    expect(status).toBe(409)
    expect(String(data.error)).toMatch(/gestantes ou profissionais/)
  })

  it("exclui UBS vazia", async () => {
    setSession(adminSession)
    prismaMock.uBS.findUnique.mockResolvedValue({
      id: "ubs-1",
      _count: { gestantes: 0, enfermeiros: 0 },
    })
    prismaMock.uBS.delete.mockResolvedValue({})
    const { status, data } = await readJson(
      await DELETE(apiRequest("/api/admin/ubs/ubs-1", { method: "DELETE" }), routeParams("ubs-1"))
    )
    expect(status).toBe(200)
    expect(data.ok).toBe(true)
  })
})
