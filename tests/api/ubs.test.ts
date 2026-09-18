import { describe, expect, it } from "vitest"
import { GET } from "@/app/api/ubs/route"
import { adminSession, apiRequest, prismaMock, readJson, setSession } from "../helpers"

describe("GET /api/ubs", () => {
  it("retorna 401 sem autenticação", async () => {
    const { status, data } = await readJson(await GET(apiRequest("/api/ubs")))
    expect(status).toBe(401)
    expect(data.error).toBe("Não autenticado")
  })

  it("lista UBS autenticado", async () => {
    setSession(adminSession)
    prismaMock.uBS.findMany.mockResolvedValue([
      { id: "ubs-1", nome: "UBS Centro", endereco: "Rua 1" },
    ])
    const { status, data } = await readJson<unknown[]>(await GET(apiRequest("/api/ubs")))
    expect(status).toBe(200)
    expect(data).toHaveLength(1)
    expect(prismaMock.uBS.findMany).toHaveBeenCalledWith({ orderBy: { nome: "asc" } })
  })

  it("retorna 500 em erro de banco", async () => {
    setSession(adminSession)
    prismaMock.uBS.findMany.mockRejectedValue(new Error("timeout"))
    const { status, data } = await readJson(await GET(apiRequest("/api/ubs")))
    expect(status).toBe(500)
    expect(data.error).toBe("timeout")
  })
})
