import bcrypt from "bcryptjs"
import { describe, expect, it } from "vitest"
import { NextRequest } from "next/server"
import { authOptions } from "@/lib/auth"
import { getAuthSession, requireAdmin, requireAuth } from "@/lib/auth-api"
import { adminSession, nurseSession, prismaMock, setSession } from "../helpers"
import { getServerSessionMock } from "../mocks"

type Authorize = (credentials?: Record<string, string>, req?: unknown) => unknown

function authorize(): Authorize {
  const provider = authOptions.providers[0] as {
    authorize?: Authorize
    options?: { authorize?: Authorize }
  }
  const fn = provider.options?.authorize ?? provider.authorize
  if (!fn) throw new Error("provider sem authorize")
  return fn
}

function authorizeResult(credentials?: Record<string, string>) {
  return Promise.resolve(authorize()(credentials))
}

describe("auth API helpers", () => {
  it("requireAuth retorna 401 sem sessão e null com sessão", async () => {
    const request = new NextRequest("http://localhost/api/x")
    const unauth = await requireAuth(request)
    expect(unauth?.status).toBe(401)

    setSession(nurseSession)
    expect(await requireAuth(request)).toBeNull()
  })

  it("requireAdmin retorna 403 para profissional comum", async () => {
    const request = new NextRequest("http://localhost/api/x")
    setSession(nurseSession)
    const denied = await requireAdmin(request)
    expect(denied?.status).toBe(403)

    setSession(adminSession)
    expect(await requireAdmin(request)).toBeNull()
  })

  it("getAuthSession usa getServerSession", async () => {
    setSession(adminSession)
    await expect(getAuthSession()).resolves.toMatchObject({ user: { id: "admin-1" } })
    expect(getServerSessionMock).toHaveBeenCalled()
  })
})

describe("Credentials authorize", () => {
  it("retorna null sem credenciais, usuário inexistente ou senha inválida", async () => {
    await expect(authorizeResult()).resolves.toBeNull()
    prismaMock.enfermeiro.findFirst.mockResolvedValue(null)
    await expect(authorizeResult({ email: "a@a.com", senha: "x" })).resolves.toBeNull()

    prismaMock.enfermeiro.findFirst.mockResolvedValue({
      id: "1",
      email: "a@a.com",
      nome: "A",
      senha: await bcrypt.hash("certa", 4),
      isAdmin: false,
      ubsId: "ubs-1",
    })
    await expect(authorizeResult({ email: "a@a.com", senha: "errada" })).resolves.toBeNull()
  })

  it("autentica e devolve o usuário", async () => {
    prismaMock.enfermeiro.findFirst.mockResolvedValue({
      id: "enf-1",
      email: "ana@ubs.com",
      nome: "Ana",
      senha: await bcrypt.hash("senha1234", 4),
      isAdmin: false,
      ubsId: "ubs-1",
    })

    await expect(authorizeResult({ email: " Ana@UBS.com ", senha: " senha1234 " })).resolves.toEqual({
      id: "enf-1",
      email: "ana@ubs.com",
      name: "Ana",
      isAdmin: false,
      ubsId: "ubs-1",
    })
  })

  it("callbacks jwt/session copiam id, isAdmin e ubsId", async () => {
    const token = await authOptions.callbacks?.jwt?.({
      token: { id: "", isAdmin: false },
      user: { id: "u1", email: "a@a.com", name: "A", isAdmin: true, ubsId: "ubs-1" },
    } as never)
    expect(token).toMatchObject({ id: "u1", isAdmin: true, ubsId: "ubs-1" })

    const session = await authOptions.callbacks?.session?.({
      session: { user: { email: "a@a.com", name: "A" } },
      token: { id: "u1", isAdmin: true, ubsId: "ubs-1" },
    } as never)
    expect(session).toMatchObject({
      user: { id: "u1", isAdmin: true, ubsId: "ubs-1" },
    })
  })
})
