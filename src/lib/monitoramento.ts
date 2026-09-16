import { differenceInCalendarDays } from "date-fns"
import { isGestacaoAtiva } from "./formatters"

export const DESTINOS_AAE = ["Policlínica", "Ambulatório Municipal"] as const
export const STATUS_AAE = ["nao_encaminhada", "aguardando_vaga", "compartilhada"] as const
export const DESFECHOS = [
  "em_andamento",
  "nascido",
  "obito_fetal",
  "obito_infantil",
  "obito_materno",
] as const

export type DestinoAAE = (typeof DESTINOS_AAE)[number]
export type StatusAAE = (typeof STATUS_AAE)[number]
export type Desfecho = (typeof DESFECHOS)[number]

export function isAcompanhamentoAtivo(dum: string | Date, desfecho?: string | null): boolean {
  return isGestacaoAtiva(dum) && (!desfecho || desfecho === "em_andamento")
}

export function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === "") return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

export function parseMonitoramentoFields(body: Record<string, unknown>) {
  const numeroConsultasRaw = body.numeroConsultas
  let numeroConsultas: number | undefined
  if (numeroConsultasRaw !== undefined && numeroConsultasRaw !== null && numeroConsultasRaw !== "") {
    const parsed = Number(numeroConsultasRaw)
    numeroConsultas = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
  }

  const statusAAE =
    typeof body.statusAAE === "string" && STATUS_AAE.includes(body.statusAAE as StatusAAE)
      ? body.statusAAE
      : undefined

  const destinoAAERaw = body.destinoAAE
  const destinoAAE =
    destinoAAERaw === "" || destinoAAERaw === null
      ? null
      : typeof destinoAAERaw === "string" && DESTINOS_AAE.includes(destinoAAERaw as DestinoAAE)
        ? destinoAAERaw
        : undefined

  const desfecho =
    typeof body.desfecho === "string" && DESFECHOS.includes(body.desfecho as Desfecho)
      ? body.desfecho
      : undefined

  return {
    testesRapidos1Trimestre:
      body.testesRapidos1Trimestre !== undefined ? Boolean(body.testesRapidos1Trimestre) : undefined,
    testesRapidos3Trimestre:
      body.testesRapidos3Trimestre !== undefined ? Boolean(body.testesRapidos3Trimestre) : undefined,
    numeroConsultas,
    planoDeCuidados: body.planoDeCuidados !== undefined ? Boolean(body.planoDeCuidados) : undefined,
    gestaoDeCaso: body.gestaoDeCaso !== undefined ? Boolean(body.gestaoDeCaso) : undefined,
    vinculadaMaternidade:
      body.vinculadaMaternidade !== undefined ? Boolean(body.vinculadaMaternidade) : undefined,
    nomeMaternidade:
      body.nomeMaternidade !== undefined
        ? String(body.nomeMaternidade || "").trim() || null
        : undefined,
    destinoAAE,
    statusAAE,
    dataEncaminhamentoAAE: parseOptionalDate(body.dataEncaminhamentoAAE),
    dataAcessoAAE: parseOptionalDate(body.dataAcessoAAE),
    desfecho,
    dataDesfecho: parseOptionalDate(body.dataDesfecho),
  }
}

export function compactDefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>
}

type GestanteMonitoramento = {
  dum: Date
  desfecho: string
  dataDesfecho: Date | null
  createdAt: Date
  semanasInicioPreNatal: number
  numeroConsultas: number
  exameRotina1Trimestre: boolean
  exameRotina3Trimestre: boolean
  testesRapidos1Trimestre: boolean
  testesRapidos3Trimestre: boolean
  risco: string
  planoDeCuidados: boolean
  gestaoDeCaso: boolean
  vinculadaMaternidade: boolean
  destinoAAE: string | null
  statusAAE: string
  dataEncaminhamentoAAE: Date | null
  dataAcessoAAE: Date | null
}

function mediaDiasAcesso(
  gestantes: GestanteMonitoramento[],
  risco: string,
  destino: DestinoAAE
): number | null {
  const dias = gestantes
    .filter(
      (g) =>
        g.risco === risco &&
        g.destinoAAE === destino &&
        g.dataEncaminhamentoAAE &&
        g.dataAcessoAAE
    )
    .map((g) => differenceInCalendarDays(g.dataAcessoAAE!, g.dataEncaminhamentoAAE!))
    .filter((n) => n >= 0)

  if (dias.length === 0) return null
  return Math.round(dias.reduce((acc, n) => acc + n, 0) / dias.length)
}

function countAae(
  gestantes: GestanteMonitoramento[],
  risco: string,
  destino: DestinoAAE,
  status: StatusAAE
) {
  return gestantes.filter(
    (g) => g.risco === risco && g.destinoAAE === destino && g.statusAAE === status
  ).length
}

function countDesfechoNoAno(
  registros: { desfecho: string; dataDesfecho: Date | null }[],
  desfecho: Desfecho,
  inicioAno: Date,
  fim: Date
) {
  return registros.filter((g) => {
    if (g.desfecho !== desfecho || !g.dataDesfecho) return false
    return g.dataDesfecho >= inicioAno && g.dataDesfecho <= fim
  }).length
}

export function montarPlanilhaMonitoramento(
  gestantes: GestanteMonitoramento[],
  excluidas: { desfecho: string; dataDesfecho: Date | null }[],
  gestantesEstimadas: number,
  inicioAno: Date,
  fim: Date
) {
  const acompanhadas = gestantes.filter((g) => isAcompanhamentoAtivo(g.dum, g.desfecho))
  const desfechos = [...gestantes, ...excluidas]

  const intermediario = "Risco Intermediário"
  const alto = "Risco Alto"

  return {
    gestantesEstimadas,
    totalGestantesAteOMomento: acompanhadas.length,
    nascidosNoAno: countDesfechoNoAno(desfechos, "nascido", inicioAno, fim),
    obitosFetaisNoAno: countDesfechoNoAno(desfechos, "obito_fetal", inicioAno, fim),
    obitosInfantisNoAno: countDesfechoNoAno(desfechos, "obito_infantil", inicioAno, fim),
    obitosMaternosNoAno: countDesfechoNoAno(desfechos, "obito_materno", inicioAno, fim),
    acompanhadasPreNatalUbs: acompanhadas.length,
    captadasAte12Semanas: acompanhadas.filter((g) => g.semanasInicioPreNatal <= 12).length,
    comMinimo7Consultas: acompanhadas.filter((g) => g.numeroConsultas >= 7).length,
    exames1Trimestre: acompanhadas.filter((g) => g.exameRotina1Trimestre).length,
    exames3Trimestre: acompanhadas.filter((g) => g.exameRotina3Trimestre).length,
    testesRapidos1Trimestre: acompanhadas.filter((g) => g.testesRapidos1Trimestre).length,
    testesRapidos3Trimestre: acompanhadas.filter((g) => g.testesRapidos3Trimestre).length,
    estratificadas: acompanhadas.length,
    riscoBaixo: acompanhadas.filter((g) => g.risco === "Risco Baixo").length,
    riscoIntermediario: acompanhadas.filter((g) => g.risco === intermediario).length,
    riscoAlto: acompanhadas.filter((g) => g.risco === alto).length,
    comPlanoDeCuidados: acompanhadas.filter((g) => g.planoDeCuidados).length,
    emGestaoDeCaso: acompanhadas.filter((g) => g.gestaoDeCaso).length,
    riscoIntermediarioCompartilhadas: {
      policlinica: countAae(acompanhadas, intermediario, "Policlínica", "compartilhada"),
      ambulatorioMunicipal: countAae(
        acompanhadas,
        intermediario,
        "Ambulatório Municipal",
        "compartilhada"
      ),
    },
    riscoIntermediarioAguardandoVaga: {
      policlinica: countAae(acompanhadas, intermediario, "Policlínica", "aguardando_vaga"),
      ambulatorioMunicipal: countAae(
        acompanhadas,
        intermediario,
        "Ambulatório Municipal",
        "aguardando_vaga"
      ),
    },
    mediaDiasAcessoRiscoIntermediario: {
      policlinica: mediaDiasAcesso(acompanhadas, intermediario, "Policlínica"),
      ambulatorioMunicipal: mediaDiasAcesso(acompanhadas, intermediario, "Ambulatório Municipal"),
    },
    riscoAltoCompartilhadas: {
      policlinica: countAae(acompanhadas, alto, "Policlínica", "compartilhada"),
      ambulatorioMunicipal: countAae(acompanhadas, alto, "Ambulatório Municipal", "compartilhada"),
    },
    riscoAltoAguardandoVaga: {
      policlinica: countAae(acompanhadas, alto, "Policlínica", "aguardando_vaga"),
      ambulatorioMunicipal: countAae(acompanhadas, alto, "Ambulatório Municipal", "aguardando_vaga"),
    },
    mediaDiasAcessoRiscoAlto: {
      policlinica: mediaDiasAcesso(acompanhadas, alto, "Policlínica"),
      ambulatorioMunicipal: mediaDiasAcesso(acompanhadas, alto, "Ambulatório Municipal"),
    },
    vinculadasMaternidade: acompanhadas.filter((g) => g.vinculadaMaternidade).length,
  }
}
