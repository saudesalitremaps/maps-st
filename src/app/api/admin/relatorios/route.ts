import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { requireAdmin } from "../../../../lib/auth-api"
import { calculateWeeks, isGestacaoAtiva } from "../../../../lib/formatters"

function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date()
  let idade = hoje.getFullYear() - dataNascimento.getFullYear()
  const mesDiff = hoje.getMonth() - dataNascimento.getMonth()
  if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < dataNascimento.getDate())) {
    idade--
  }
  return idade
}

// GET - Gerar relatórios customizados
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const ubsId = searchParams.get("ubsId")
    const risco = searchParams.get("risco")
    const etnia = searchParams.get("etnia")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")
    
    // Novos filtros
    const dumInicio = searchParams.get("dumInicio")
    const dumFim = searchParams.get("dumFim")
    const dppInicio = searchParams.get("dppInicio")
    const dppFim = searchParams.get("dppFim")
    const gestacoesMin = searchParams.get("gestacoesMin")
    const gestacoesMax = searchParams.get("gestacoesMax")
    const semanasMin = searchParams.get("semanasMin")
    const semanasMax = searchParams.get("semanasMax")
    const idadeMin = searchParams.get("idadeMin")
    const idadeMax = searchParams.get("idadeMax")
    const exameRotina1Trimestre = searchParams.get("exameRotina1Trimestre")
    const exameRotina2Trimestre = searchParams.get("exameRotina2Trimestre")
    const exameRotina3Trimestre = searchParams.get("exameRotina3Trimestre")
    const ultrassom1Trimestre = searchParams.get("ultrassom1Trimestre")
    const ultrassom2Trimestre = searchParams.get("ultrassom2Trimestre")
    const ultrassom3Trimestre = searchParams.get("ultrassom3Trimestre")
    const vacinaHB = searchParams.get("vacinaHB")
    const vacinaDT = searchParams.get("vacinaDT")
    const vacinaInfluenza = searchParams.get("vacinaInfluenza")
    const vacinaCovid19 = searchParams.get("vacinaCovid19")
    const vacinaDTPA20Semana = searchParams.get("vacinaDTPA20Semana")
    const vacinaVSR28Semana = searchParams.get("vacinaVSR28Semana")
    const partoEsteMes = searchParams.get("partoEsteMes")
    const partoProximos3Meses = searchParams.get("partoProximos3Meses")

    // Construir filtros dinâmicos
    const where: any = {}

    if (ubsId) {
      where.ubsId = ubsId
    }

    if (risco) {
      where.risco = risco
    }

    if (etnia) {
      where.etnia = etnia
    }

    // Filtro por data de cadastro
    if (dataInicio || dataFim) {
      where.createdAt = {}
      if (dataInicio) {
        where.createdAt.gte = new Date(dataInicio)
      }
      if (dataFim) {
        where.createdAt.lte = new Date(dataFim)
      }
    }

    // Filtro por DUM
    if (dumInicio || dumFim) {
      where.dum = {}
      if (dumInicio) {
        where.dum.gte = new Date(dumInicio)
      }
      if (dumFim) {
        where.dum.lte = new Date(dumFim)
      }
    }

    // Filtro por DPP
    if (dppInicio || dppFim) {
      if (!where.dpp) {
        where.dpp = {}
      }
      if (dppInicio) {
        where.dpp.gte = new Date(dppInicio)
      }
      if (dppFim) {
        where.dpp.lte = new Date(dppFim)
      }
    }

    // Filtro por gestações anteriores
    if (gestacoesMin || gestacoesMax) {
      where.gestacoesAnteriores = {}
      if (gestacoesMin) {
        where.gestacoesAnteriores.gte = parseInt(gestacoesMin)
      }
      if (gestacoesMax) {
        where.gestacoesAnteriores.lte = parseInt(gestacoesMax)
      }
    }

    // Filtro por exames
    if (exameRotina1Trimestre === "true") {
      where.exameRotina1Trimestre = true
    }
    if (exameRotina2Trimestre === "true") {
      where.exameRotina2Trimestre = true
    }
    if (exameRotina3Trimestre === "true") {
      where.exameRotina3Trimestre = true
    }
    if (ultrassom1Trimestre === "true") {
      where.ultrassom1Trimestre = true
    }
    if (ultrassom2Trimestre === "true") {
      where.ultrassom2Trimestre = true
    }
    if (ultrassom3Trimestre === "true") {
      where.ultrassom3Trimestre = true
    }

    // Filtro por vacinas
    if (vacinaHB === "true") {
      where.vacinaHB = true
    }
    if (vacinaDT === "true") {
      where.vacinaDT = true
    }
    if (vacinaInfluenza === "true") {
      where.vacinaInfluenza = true
    }
    if (vacinaCovid19 === "true") {
      where.vacinaCovid19 = true
    }
    if (vacinaDTPA20Semana === "true") {
      where.vacinaDTPA20Semana = true
    }
    if (vacinaVSR28Semana === "true") {
      where.vacinaVSR28Semana = true
    }

    // Filtro por partos próximos (só aplica se não houver filtro de DPP manual)
    if ((partoEsteMes === "true" || partoProximos3Meses === "true") && !dppInicio && !dppFim) {
      if (partoEsteMes === "true") {
        const hoje = new Date()
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        where.dpp = {
          gte: inicioMes,
          lte: fimMes,
        }
      } else if (partoProximos3Meses === "true") {
        const hoje = new Date()
        const tresMesesFrente = new Date()
        tresMesesFrente.setMonth(hoje.getMonth() + 3)
        where.dpp = {
          gte: hoje,
          lte: tresMesesFrente,
        }
      }
    }

    const gestantes = await prisma.gestante.findMany({
      where,
      include: {
        ubs: {
          select: {
            id: true,
            nome: true,
            endereco: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Filtrar por semanas de gestação (após buscar do banco, pois é calculado)
    // Sempre excluir gestantes com mais de 42 semanas
    let gestantesFiltradas = gestantes.filter((g) => isGestacaoAtiva(g.dum))

    // Aplicar filtros adicionais de semanas se especificados
    if (semanasMin || semanasMax) {
      gestantesFiltradas = gestantesFiltradas.filter((g) => {
        const semanas = calculateWeeks(g.dum)
        if (semanasMin && semanas < parseInt(semanasMin)) return false
        if (semanasMax && semanas > parseInt(semanasMax)) return false
        return true
      })
    }

    if (idadeMin || idadeMax) {
      gestantesFiltradas = gestantesFiltradas.filter((g) => {
        if (!g.dataNascimento) return false
        const idade = calcularIdade(new Date(g.dataNascimento))
        if (idadeMin && idade < parseInt(idadeMin)) return false
        if (idadeMax && idade > parseInt(idadeMax)) return false
        return true
      })
    }

    // Adicionar semanas de gestação calculadas e outras informações úteis
    const gestantesComInfo = gestantesFiltradas.map((g) => ({
      ...g,
      semanasGestacao: calculateWeeks(g.dum),
      idade: g.dataNascimento ? calcularIdade(new Date(g.dataNascimento)) : null,
      nomeUBS: g.ubs.nome,
      enderecoUBS: g.ubs.endereco,
    }))

    // Estatísticas do relatório
    const total = gestantesComInfo.length
    const porRisco = {
      baixo: gestantesComInfo.filter((g) => g.risco === "Risco Baixo").length,
      intermediario: gestantesComInfo.filter((g) => g.risco === "Risco Intermediário").length,
      alto: gestantesComInfo.filter((g) => g.risco === "Risco Alto").length,
    }

    const porEtnia = gestantesComInfo.reduce((acc, g) => {
      acc[g.etnia] = (acc[g.etnia] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Estatísticas de exames e vacinas
    const estatisticasExames = {
      exameRotina1Trimestre: gestantesComInfo.filter((g) => g.exameRotina1Trimestre).length,
      exameRotina2Trimestre: gestantesComInfo.filter((g) => g.exameRotina2Trimestre).length,
      exameRotina3Trimestre: gestantesComInfo.filter((g) => g.exameRotina3Trimestre).length,
      ultrassom1Trimestre: gestantesComInfo.filter((g) => g.ultrassom1Trimestre).length,
      ultrassom2Trimestre: gestantesComInfo.filter((g) => g.ultrassom2Trimestre).length,
      ultrassom3Trimestre: gestantesComInfo.filter((g) => g.ultrassom3Trimestre).length,
    }

    const estatisticasVacinas = {
      vacinaHB: gestantesComInfo.filter((g) => g.vacinaHB).length,
      vacinaDT: gestantesComInfo.filter((g) => g.vacinaDT).length,
      vacinaInfluenza: gestantesComInfo.filter((g) => g.vacinaInfluenza).length,
      vacinaCovid19: gestantesComInfo.filter((g) => g.vacinaCovid19).length,
      vacinaDTPA20Semana: gestantesComInfo.filter((g) => g.vacinaDTPA20Semana).length,
      vacinaVSR28Semana: gestantesComInfo.filter((g) => g.vacinaVSR28Semana).length,
    }

    return NextResponse.json(
      {
        gestantes: gestantesComInfo,
        estatisticas: {
          total,
          porRisco,
          porEtnia,
          exames: estatisticasExames,
          vacinas: estatisticasVacinas,
        },
        filtros: {
          ubsId: ubsId || null,
          risco: risco || null,
          etnia: etnia || null,
          dataInicio: dataInicio || null,
          dataFim: dataFim || null,
          dumInicio: dumInicio || null,
          dumFim: dumFim || null,
          dppInicio: dppInicio || null,
          dppFim: dppFim || null,
          gestacoesMin: gestacoesMin || null,
          gestacoesMax: gestacoesMax || null,
          semanasMin: semanasMin || null,
          semanasMax: semanasMax || null,
          idadeMin: idadeMin || null,
          idadeMax: idadeMax || null,
          exameRotina1Trimestre: exameRotina1Trimestre || null,
          exameRotina2Trimestre: exameRotina2Trimestre || null,
          exameRotina3Trimestre: exameRotina3Trimestre || null,
          ultrassom1Trimestre: ultrassom1Trimestre || null,
          ultrassom2Trimestre: ultrassom2Trimestre || null,
          ultrassom3Trimestre: ultrassom3Trimestre || null,
          vacinaHB: vacinaHB || null,
          vacinaDT: vacinaDT || null,
          vacinaInfluenza: vacinaInfluenza || null,
          vacinaCovid19: vacinaCovid19 || null,
          vacinaDTPA20Semana: vacinaDTPA20Semana || null,
          vacinaVSR28Semana: vacinaVSR28Semana || null,
          partoEsteMes: partoEsteMes || null,
          partoProximos3Meses: partoProximos3Meses || null,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao gerar relatório"
    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
}

