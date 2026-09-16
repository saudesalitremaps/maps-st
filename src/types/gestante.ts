export interface UBS {
  id: string
  nome: string
  endereco: string
}

export interface GestanteListItem {
  id: string
  nome: string
  cartaoSus?: string
  dum: string
  dpp: string
  etnia: string
  risco: string
  createdAt: string
  ubsId: string
  ubs?: UBS
}

export interface GestanteDetail {
  id: string
  nome: string
  dataNascimento: string | null
  cartaoSus: string
  telefone: string | null
  ubsId: string
  ubs?: UBS
  dum: string
  dpp: string
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
  dataEncaminhamentoAAE: string | null
  dataAcessoAAE: string | null
  desfecho: string
  dataDesfecho: string | null
}

export interface DashboardStats {
  totalGestantes: number
  gestantesAltoRisco: number
  gestantesRiscoIntermediario: number
  partosEsteMes: number
  partosDosUltimos3Meses: number
}
