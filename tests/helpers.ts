import { NextRequest } from "next/server"

import { getServerSessionMock, prismaMock } from "./mocks"

export { prismaMock }

export const adminSession = {
  user: {
    id: "admin-1",
    email: "admin@maps.com",
    name: "Administradora",
    isAdmin: true,
  },
}

export const nurseSession = {
  user: {
    id: "enf-1",
    email: "ana.ferreira@ubs.com",
    name: "Ana Paula Ferreira",
    isAdmin: false,
    ubsId: "ubs-1",
  },
}

export const nurseOtherUbsSession = {
  user: {
    id: "enf-2",
    email: "beatriz.lima@ubs.com",
    name: "Beatriz Lima",
    isAdmin: false,
    ubsId: "ubs-2",
  },
}

export const nurseWithoutUbsSession = {
  user: {
    id: "enf-3",
    email: "sem.ubs@ubs.com",
    name: "Profissional Sem UBS",
    isAdmin: false,
  },
}

export function setSession(session: typeof adminSession | typeof nurseSession | typeof nurseOtherUbsSession | typeof nurseWithoutUbsSession | null) {
  getServerSessionMock.mockResolvedValue(session as never)
}

export function apiRequest(path: string, init?: RequestInit & { body?: unknown }) {
  const { body, headers, ...rest } = init ?? {}
  const serialized = body === undefined || typeof body === "string" || body instanceof FormData
    ? body
    : JSON.stringify(body)

  return new NextRequest(new URL(path, "http://localhost:3000"), {
    ...rest,
    headers: {
      ...(serialized && typeof serialized === "string" ? { "content-type": "application/json" } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body: serialized as BodyInit | undefined,
  })
}

export async function readJson<T = Record<string, unknown>>(response: Response) {
  return {
    status: response.status,
    data: (await response.json()) as T,
  }
}

export function routeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

export function makeGestante(overrides: Record<string, unknown> = {}) {
  const dum = new Date()
  dum.setDate(dum.getDate() - 100)
  const dpp = new Date(dum)
  dpp.setDate(dpp.getDate() + 280)

  return {
    id: "g-1",
    nome: "Maria Silva Santos",
    dataNascimento: new Date("1998-03-12"),
    cartaoSus: "898000000000001",
    telefone: "88998877665",
    ubsId: "ubs-1",
    dum,
    dpp,
    semanasInicioPreNatal: 8,
    etnia: "Pardo",
    gestacoesAnteriores: 1,
    risco: "Risco Baixo",
    descricaoRisco: null,
    motivoAltoRisco: null,
    exameRotina1Trimestre: true,
    exameRotina2Trimestre: false,
    exameRotina3Trimestre: false,
    ultrassom1Trimestre: true,
    ultrassom2Trimestre: false,
    ultrassom3Trimestre: false,
    vacinaHB: true,
    vacinaDT: true,
    vacinaInfluenza: false,
    vacinaCovid19: false,
    vacinaDTPA20Semana: false,
    vacinaVSR28Semana: false,
    testesRapidos1Trimestre: true,
    testesRapidos3Trimestre: false,
    numeroConsultas: 4,
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
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-15"),
    ubs: { id: "ubs-1", nome: "UBS Centro", endereco: "Rua 1" },
    ...overrides,
  }
}

export function stubCleanupEmpty() {
  prismaMock.gestante.findMany.mockImplementation(async (args?: { where?: { dpp?: { lt?: Date } }; select?: unknown }) => {
    if (args?.where?.dpp?.lt) return []
    return []
  })
  prismaMock.gestante.deleteMany.mockResolvedValue({ count: 0 })
}
