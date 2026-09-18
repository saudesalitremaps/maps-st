import bcrypt from "bcryptjs"
import { describe, expect, it } from "vitest"
import { PUT } from "@/app/api/conta/senha/route"
import { apiRequest, nurseSession, prismaMock, readJson, setSession } from "../helpers"

describe("PUT /api/conta/senha", () => {
  it("exige autenticação", async () => {
    const { status } = await readJson(await PUT(apiRequest("/api/conta/senha", { method: "PUT", body: {} })))
    expect(status).toBe(401)
  })

  it("exige senha atual e nova senha", async () => {
    setSession(nurseSession)
    const { status } = await readJson(
      await PUT(apiRequest("/api/conta/senha", { method: "PUT", body: { senhaAtual: "", novaSenha: "" } }))
    )
    expect(status).toBe(400)
  })

  it("rejeita nova senha curta", async () => {
    setSession(nurseSession)
    const { status, data } = await readJson(
      await PUT(
        apiRequest("/api/conta/senha", { method: "PUT", body: { senhaAtual: "senha123", novaSenha: "123" } })
      )
    )
    expect(status).toBe(400)
    expect(String(data.error)).toMatch(/8 caracteres/)
  })

  it("rejeita senha atual incorreta", async () => {
    setSession(nurseSession)
    prismaMock.enfermeiro.findUnique.mockResolvedValue({
      senha: await bcrypt.hash("outra-senha", 4),
    })
    const { status, data } = await readJson(
      await PUT(
        apiRequest("/api/conta/senha", {
          method: "PUT",
          body: { senhaAtual: "senha1234", novaSenha: "novasenha1" },
        })
      )
    )
    expect(status).toBe(400)
    expect(data.error).toBe("Senha atual incorreta.")
  })

  it("atualiza a senha quando a atual confere", async () => {
    setSession(nurseSession)
    prismaMock.enfermeiro.findUnique.mockResolvedValue({
      senha: await bcrypt.hash("senha1234", 4),
    })
    prismaMock.enfermeiro.update.mockResolvedValue({})

    const { status, data } = await readJson(
      await PUT(
        apiRequest("/api/conta/senha", {
          method: "PUT",
          body: { senhaAtual: "senha1234", novaSenha: "novasenha1" },
        })
      )
    )

    expect(status).toBe(200)
    expect(data.ok).toBe(true)
    const novaHash = prismaMock.enfermeiro.update.mock.calls[0][0].data.senha
    expect(await bcrypt.compare("novasenha1", novaHash)).toBe(true)
  })
})
