import { describe, expect, it } from "vitest"
import { GET } from "@/app/api/gestantes/stats/route"
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

describe("GET /api/gestantes/stats", () => {
  it("retorna 401 sem sessão", async () => {
    const { status } = await readJson(await GET(apiRequest("/api/gestantes/stats")))
    expect(status).toBe(401)
  })

  it("retorna 400 sem UBS para profissional", async () => {
    setSession(nurseWithoutUbsSession)
    const { status } = await readJson(await GET(apiRequest("/api/gestantes/stats")))
    expect(status).toBe(400)
  })

  it("calcula totais das gestantes ativas da UBS", async () => {
    setSession(nurseSession)
    const dumRecente = new Date()
    dumRecente.setDate(dumRecente.getDate() - 70)
    const dppEsteMes = new Date()
    dppEsteMes.setDate(15)

    prismaMock.gestante.findMany.mockImplementation(async (args?: { where?: { dpp?: { lt?: Date }; ubsId?: string } }) => {
      if (args?.where?.dpp?.lt) return []
      expect(args?.where).toEqual({ ubsId: "ubs-1" })
      return [
        makeGestante({ risco: "Risco Alto", dum: dumRecente, dpp: dppEsteMes, desfecho: "em_andamento" }),
        makeGestante({
          id: "g-2",
          risco: "Risco Intermediário",
          dum: dumRecente,
          dpp: new Date("2028-01-01"),
          desfecho: "em_andamento",
        }),
        makeGestante({ id: "g-3", risco: "Risco Baixo", desfecho: "nascido", dum: dumRecente }),
      ]
    })

    const { status, data } = await readJson<{
      totalGestantes: number
      gestantesAltoRisco: number
      gestantesRiscoIntermediario: number
      partosEsteMes: number
    }>(await GET(apiRequest("/api/gestantes/stats")))

    expect(status).toBe(200)
    expect(data.totalGestantes).toBe(2)
    expect(data.gestantesAltoRisco).toBe(1)
    expect(data.gestantesRiscoIntermediario).toBe(1)
    expect(data.partosEsteMes).toBe(1)
  })

  it("admin não filtra por UBS", async () => {
    setSession(adminSession)
    prismaMock.gestante.findMany.mockImplementation(async (args?: { where?: unknown }) => {
      if ((args?.where as { dpp?: unknown } | undefined)?.dpp) return []
      expect(args?.where).toBeUndefined()
      return []
    })
    const { status, data } = await readJson(await GET(apiRequest("/api/gestantes/stats")))
    expect(status).toBe(200)
    expect(data.totalGestantes).toBe(0)
  })
})
