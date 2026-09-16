import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../../lib/prisma"
import { requireAdmin } from "../../../../../lib/auth-api"
import { startOfMonth, endOfMonth, startOfYear } from "date-fns"
import { isGestacaoAtiva } from "../../../../../lib/formatters"
import { montarPlanilhaMonitoramento } from "../../../../../lib/monitoramento"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const LABELS_EXAMES: Record<string, string> = {
  exameRotina1Trimestre: "Exame Rotina 1º Trimestre",
  exameRotina2Trimestre: "Exame Rotina 2º Trimestre",
  exameRotina3Trimestre: "Exame Rotina 3º Trimestre",
  ultrassom1Trimestre: "Ultrassom 1º Trimestre",
  ultrassom2Trimestre: "Ultrassom 2º Trimestre",
  ultrassom3Trimestre: "Ultrassom 3º Trimestre",
  vacinaHB: "Vacina HB",
  vacinaDT: "Vacina DT",
  vacinaInfluenza: "Vacina Influenza",
  vacinaCovid19: "Vacina COVID-19",
  vacinaDTPA20Semana: "Vacina DTPA (20 semanas)",
  vacinaVSR28Semana: "Vacina VSR (28 semanas)",
}

// GET - Relatório mensal completo (tudo que aconteceu no mês)
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const mesParam = searchParams.get("mes")
    const anoParam = searchParams.get("ano")

    const mes = mesParam ? parseInt(mesParam, 10) : new Date().getMonth() + 1
    const ano = anoParam ? parseInt(anoParam, 10) : new Date().getFullYear()

    if (mes < 1 || mes > 12 || !ano) {
      return NextResponse.json(
        { error: "Mês e ano inválidos" },
        { status: 400 }
      )
    }

    const inicio = startOfMonth(new Date(ano, mes - 1, 1))
    const fim = endOfMonth(new Date(ano, mes - 1, 1))
    const inicioAno = startOfYear(new Date(ano, 0, 1))

    const [gestantesMonitoramento, excluidasDesfecho, indicador] = await Promise.all([
      prisma.gestante.findMany({
        select: {
          dum: true,
          desfecho: true,
          dataDesfecho: true,
          createdAt: true,
          semanasInicioPreNatal: true,
          numeroConsultas: true,
          exameRotina1Trimestre: true,
          exameRotina3Trimestre: true,
          testesRapidos1Trimestre: true,
          testesRapidos3Trimestre: true,
          risco: true,
          planoDeCuidados: true,
          gestaoDeCaso: true,
          vinculadaMaternidade: true,
          destinoAAE: true,
          statusAAE: true,
          dataEncaminhamentoAAE: true,
          dataAcessoAAE: true,
        },
      }),
      prisma.gestanteExcluida.findMany({
        where: {
          desfecho: { not: "em_andamento" },
          dataDesfecho: { gte: inicioAno, lte: fim },
        },
        select: { desfecho: true, dataDesfecho: true },
      }),
      prisma.indicadorMunicipal.findUnique({ where: { ano } }),
    ])

    const planilhaMonitoramento = montarPlanilhaMonitoramento(
      gestantesMonitoramento,
      excluidasDesfecho,
      indicador?.gestantesEstimadas ?? 0,
      inicioAno,
      fim
    )

    // 1. Gestantes CADASTRADAS no mês (excluindo >42 semanas)
    const gestantesCadastradasRaw = await prisma.gestante.findMany({
      where: { createdAt: { gte: inicio, lte: fim } },
      include: { ubs: { select: { nome: true } } },
    })
    const gestantesCadastradas = gestantesCadastradasRaw.filter((g) => isGestacaoAtiva(g.dum))

    // 2. Gestantes ATUALIZADAS no mês (excluindo cadastros do mesmo mês e >42 semanas)
    const gestantesAtualizadasRaw = await prisma.gestante.findMany({
      where: {
        updatedAt: { gte: inicio, lte: fim },
        createdAt: { lt: inicio }, // cadastradas antes do mês
      },
    })
    const gestantesAtualizadas = gestantesAtualizadasRaw.filter((g) => isGestacaoAtiva(g.dum))

    // 3. Partos no mês (DPP no mês, excluindo >42 semanas)
    const partosNoMesRaw = await prisma.gestante.findMany({
      where: {
        dpp: { gte: inicio, lte: fim },
      },
      select: { dum: true },
    })
    const partosNoMes = partosNoMesRaw.filter((g) => isGestacaoAtiva(g.dum)).length

    // 4. Exames e vacinas (entre gestantes com atividade no mês: cadastradas OU atualizadas)
    const gestantesComAtividadeRaw = await prisma.gestante.findMany({
      where: {
        OR: [
          { createdAt: { gte: inicio, lte: fim } },
          {
            updatedAt: { gte: inicio, lte: fim },
            createdAt: { lt: inicio },
          },
        ],
      },
      select: {
        dum: true,
        exameRotina1Trimestre: true,
        exameRotina2Trimestre: true,
        exameRotina3Trimestre: true,
        ultrassom1Trimestre: true,
        ultrassom2Trimestre: true,
        ultrassom3Trimestre: true,
        vacinaHB: true,
        vacinaDT: true,
        vacinaInfluenza: true,
        vacinaCovid19: true,
        vacinaDTPA20Semana: true,
        vacinaVSR28Semana: true,
      },
    })
    const gestantesComAtividade = gestantesComAtividadeRaw.filter((g) => isGestacaoAtiva(g.dum))

    const examesKeys = [
      "exameRotina1Trimestre", "exameRotina2Trimestre", "exameRotina3Trimestre",
      "ultrassom1Trimestre", "ultrassom2Trimestre", "ultrassom3Trimestre",
      "vacinaHB", "vacinaDT", "vacinaInfluenza", "vacinaCovid19",
      "vacinaDTPA20Semana", "vacinaVSR28Semana",
    ] as const

    const contagens: Record<string, number> = {}
    examesKeys.forEach((key) => {
      contagens[key] = gestantesComAtividade.filter((g) => g[key]).length
    })

    const totalExamesVacinas = Object.values(contagens).reduce((a, b) => a + b, 0)

    const examesPorTipo = examesKeys
      .filter((key) => contagens[key] > 0)
      .map((key) => ({
        tipo: LABELS_EXAMES[key],
        quantidade: contagens[key],
        percentual: totalExamesVacinas > 0
          ? ((contagens[key] / totalExamesVacinas) * 100).toFixed(1)
          : "0",
      }))
    examesPorTipo.sort((a, b) => b.quantidade - a.quantidade)

    // 5. Distribuição por risco (gestantes cadastradas no mês)
    const porRisco = {
      baixo: gestantesCadastradas.filter((g) => g.risco === "Risco Baixo").length,
      intermediario: gestantesCadastradas.filter((g) => g.risco === "Risco Intermediário").length,
      alto: gestantesCadastradas.filter((g) => g.risco === "Risco Alto").length,
    }

    // 6. Distribuição por etnia (gestantes cadastradas no mês)
    const porEtnia = gestantesCadastradas.reduce((acc, g) => {
      acc[g.etnia] = (acc[g.etnia] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 7. Por UBS (gestantes cadastradas no mês)
    const porUBS = gestantesCadastradas.reduce((acc, g) => {
      const nome = g.ubs?.nome || "Sem UBS"
      acc[nome] = (acc[nome] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const nomeMes = MESES[mes - 1]

    return NextResponse.json({
      periodo: { mes, ano, nomeMes },
      resumo: {
        novosCadastros: gestantesCadastradas.length,
        prontuariosAtualizados: gestantesAtualizadas.length,
        partosNoMes,
        totalExamesVacinas,
      },
      porRisco,
      porEtnia: Object.entries(porEtnia).map(([etnia, qtd]) => ({ etnia, quantidade: qtd })),
      porUBS: Object.entries(porUBS).map(([ubs, qtd]) => ({ ubs, quantidade: qtd })),
      examesPorTipo,
      planilhaMonitoramento,
    })
  } catch (error) {
    console.error("Erro ao gerar relatório mensal:", error)
    return NextResponse.json(
      { error: "Erro ao gerar relatório mensal" },
      { status: 500 }
    )
  }
}
