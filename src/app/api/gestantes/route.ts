import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"
import { addDays } from "date-fns"
import { getAuthSession, requireAuth } from "../../../lib/auth-api"
import { removeGestantesPosTresMeses } from "../../../lib/gestantes"
import { compactDefined, isAcompanhamentoAtivo, parseMonitoramentoFields } from "../../../lib/monitoramento"

// GET - Listar todas as gestantes
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
    }

    if (!session.user.isAdmin && !session.user.ubsId) {
      return NextResponse.json(
        { error: "Profissional sem UBS associada" },
        { status: 400 }
      )
    }

    const whereClause = session.user.isAdmin
      ? undefined
      : { ubsId: session.user.ubsId! }

    try {
      await removeGestantesPosTresMeses()
    } catch (cleanupError) {
      console.error("Falha ao executar limpeza automática de ex-gestantes:", cleanupError)
      // Não bloqueia a listagem caso a limpeza falhe em produção.
    }
    const gestantes = await prisma.gestante.findMany({
      where: whereClause,
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
    const gestantesAtivas = gestantes.filter((g) => isAcompanhamentoAtivo(g.dum, g.desfecho))
    return NextResponse.json(gestantesAtivas, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Erro ao buscar gestantes:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A")
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar gestantes"
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack,
    } : { error: String(error) }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

// POST - Criar nova gestante
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
    }

    const body = await request.json()
    const {
      nome,
      dataNascimento,
      cartaoSus,
      telefone,
      ubsId,
      dum,
      semanasInicioPreNatal,
      etnia,
      gestacoesAnteriores,
      risco,
      descricaoRisco,
      motivoAltoRisco,
      exames,
      vacinas,
    } = body

    // Validações
    if (!cartaoSus) {
      return NextResponse.json(
        { error: "Cartão do SUS é obrigatório" },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    if (!dataNascimento) {
      return NextResponse.json(
        { error: "Data de nascimento é obrigatória" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

    const semanasInicioPreNatalNumero = Number(semanasInicioPreNatal)
    if (!Number.isInteger(semanasInicioPreNatalNumero) || semanasInicioPreNatalNumero < 1 || semanasInicioPreNatalNumero > 45) {
      return NextResponse.json(
        { error: "Semanas de início do pré-natal inválida. Informe um valor entre 1 e 45." },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }
    
    let telefoneValue: string | null = null
    if (telefone !== undefined && telefone !== null) {
      const digits = String(telefone).replace(/\D/g, "")
      if (digits.length > 0) {
        if (digits.length < 10 || digits.length > 11) {
          return NextResponse.json(
            { error: "Telefone inválido. Informe DDD + número com 10 ou 11 dígitos." },
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        }
        telefoneValue = digits
      }
    }

    const ubsDestino = session.user.isAdmin ? ubsId : session.user.ubsId

    if (!ubsDestino) {
      return NextResponse.json(
        { error: "UBS é obrigatória" },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Calcular DPP (DUM + 280 dias)
    const dpp = addDays(new Date(dum), 280)
    const monitoramento = compactDefined(parseMonitoramentoFields(body))

    const gestante = await prisma.gestante.create({
      data: {
        nome,
        dataNascimento: new Date(dataNascimento),
        cartaoSus,
        telefone: telefoneValue,
        ubsId: ubsDestino,
        dum: new Date(dum),
        dpp,
        semanasInicioPreNatal: semanasInicioPreNatalNumero,
        etnia,
        gestacoesAnteriores: parseInt(gestacoesAnteriores) || 0,
        risco,
        descricaoRisco: descricaoRisco || null,
        motivoAltoRisco: motivoAltoRisco || null,
        exameRotina1Trimestre: exames?.rotina1 || false,
        exameRotina2Trimestre: exames?.rotina2 || false,
        exameRotina3Trimestre: exames?.rotina3 || false,
        ultrassom1Trimestre: exames?.ultrassom1 || false,
        ultrassom2Trimestre: exames?.ultrassom2 || false,
        ultrassom3Trimestre: exames?.ultrassom3 || false,
        vacinaHB: vacinas?.hb || false,
        vacinaDT: vacinas?.dt || false,
        vacinaInfluenza: vacinas?.influenza || false,
        vacinaCovid19: vacinas?.covid19 || false,
        vacinaDTPA20Semana: vacinas?.dtpa20Semana || false,
        vacinaVSR28Semana: vacinas?.vsr28Semana || false,
        ...monitoramento,
      },
    })

    return NextResponse.json(gestante, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Erro ao criar gestante:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao criar gestante"
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

