import { prisma } from "./prisma"
import { startOfDay } from "date-fns"

function snapshotExclusao(gestante: {
  nome: string
  dataNascimento: Date | null
  cartaoSus: string
  telefone: string | null
  ubsId: string
  dum: Date
  dpp: Date
  semanasInicioPreNatal: number
  etnia: string
  gestacoesAnteriores: number
  risco: string
  descricaoRisco: string | null
  motivoAltoRisco: string | null
  exameRotina1Trimestre: boolean
  exameRotina2Trimestre: boolean
  exameRotina3Trimestre: boolean
  ultrassom1Trimestre: boolean
  ultrassom2Trimestre: boolean
  ultrassom3Trimestre: boolean
  vacinaHB: boolean
  vacinaDT: boolean
  vacinaInfluenza: boolean
  vacinaCovid19: boolean
  vacinaDTPA20Semana: boolean
  vacinaVSR28Semana: boolean
  testesRapidos1Trimestre: boolean
  testesRapidos3Trimestre: boolean
  numeroConsultas: number
  planoDeCuidados: boolean
  gestaoDeCaso: boolean
  vinculadaMaternidade: boolean
  nomeMaternidade: string | null
  destinoAAE: string | null
  statusAAE: string
  dataEncaminhamentoAAE: Date | null
  dataAcessoAAE: Date | null
  desfecho: string
  dataDesfecho: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    nome: gestante.nome,
    dataNascimento: gestante.dataNascimento,
    cartaoSus: gestante.cartaoSus,
    telefone: gestante.telefone,
    ubsId: gestante.ubsId,
    dum: gestante.dum,
    dpp: gestante.dpp,
    semanasInicioPreNatal: gestante.semanasInicioPreNatal,
    etnia: gestante.etnia,
    gestacoesAnteriores: gestante.gestacoesAnteriores,
    risco: gestante.risco,
    descricaoRisco: gestante.descricaoRisco,
    motivoAltoRisco: gestante.motivoAltoRisco,
    exameRotina1Trimestre: gestante.exameRotina1Trimestre,
    exameRotina2Trimestre: gestante.exameRotina2Trimestre,
    exameRotina3Trimestre: gestante.exameRotina3Trimestre,
    ultrassom1Trimestre: gestante.ultrassom1Trimestre,
    ultrassom2Trimestre: gestante.ultrassom2Trimestre,
    ultrassom3Trimestre: gestante.ultrassom3Trimestre,
    vacinaHB: gestante.vacinaHB,
    vacinaDT: gestante.vacinaDT,
    vacinaInfluenza: gestante.vacinaInfluenza,
    vacinaCovid19: gestante.vacinaCovid19,
    vacinaDTPA20Semana: gestante.vacinaDTPA20Semana,
    vacinaVSR28Semana: gestante.vacinaVSR28Semana,
    testesRapidos1Trimestre: gestante.testesRapidos1Trimestre,
    testesRapidos3Trimestre: gestante.testesRapidos3Trimestre,
    numeroConsultas: gestante.numeroConsultas,
    planoDeCuidados: gestante.planoDeCuidados,
    gestaoDeCaso: gestante.gestaoDeCaso,
    vinculadaMaternidade: gestante.vinculadaMaternidade,
    nomeMaternidade: gestante.nomeMaternidade,
    destinoAAE: gestante.destinoAAE,
    statusAAE: gestante.statusAAE,
    dataEncaminhamentoAAE: gestante.dataEncaminhamentoAAE,
    dataAcessoAAE: gestante.dataAcessoAAE,
    desfecho: gestante.desfecho,
    dataDesfecho: gestante.dataDesfecho,
    createdAtOriginal: gestante.createdAt,
    updatedAtOriginal: gestante.updatedAt,
  }
}

export async function removeGestantesPosTresMeses() {
  const hoje = startOfDay(new Date())
  const tresMesesAtras = new Date(
    hoje.getFullYear(),
    hoje.getMonth() - 3,
    hoje.getDate()
  )

  const gestantesParaExcluir = await prisma.gestante.findMany({
    where: {
      dpp: {
        lt: tresMesesAtras,
      },
    },
  })

  if (gestantesParaExcluir.length > 0) {
    await prisma.gestanteExcluida.createMany({
      data: gestantesParaExcluir.map((gestante) => ({
        ...snapshotExclusao(gestante),
        enfermeiroId: null,
        motivoExclusao: "automatica",
      })),
    })
  }

  const result = await prisma.gestante.deleteMany({
    where: {
      dpp: {
        lt: tresMesesAtras,
      },
    },
  })
  return result.count
}

export { snapshotExclusao }
