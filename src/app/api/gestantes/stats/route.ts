import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"
import { getAuthSession, requireAuth } from "../../../../lib/auth-api"
import { removeGestantesPosTresMeses } from "../../../../lib/gestantes"
import { isAcompanhamentoAtivo } from "../../../../lib/monitoramento"

// GET - Estatísticas das gestantes
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

    await removeGestantesPosTresMeses()

    const gestantes = await prisma.gestante.findMany({
      where: whereClause,
      select: { risco: true, dpp: true, dum: true, desfecho: true },
    })
    const gestantesAtivas = gestantes.filter((g) => isAcompanhamentoAtivo(g.dum, g.desfecho))

    const totalGestantes = gestantesAtivas.length
    const gestantesAltoRisco = gestantesAtivas.filter((g) => g.risco === "Risco Alto").length
    const gestantesRiscoIntermediario = gestantesAtivas.filter(
      (g) => g.risco === "Risco Intermediário"
    ).length

    const inicioMes = startOfMonth(new Date())
    const fimMes = endOfMonth(new Date())
    const hoje = new Date()
    const tresMesesAtras = new Date()
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3)

    const partosEsteMes = gestantesAtivas.filter(
      (g) => g.dpp >= inicioMes && g.dpp <= fimMes
    ).length

    const partosDosUltimos3Meses = gestantesAtivas.filter(
      (g) => g.dpp >= tresMesesAtras && g.dpp <= hoje
    ).length

    return NextResponse.json({
      totalGestantes,
      gestantesAltoRisco,
      gestantesRiscoIntermediario,
      partosEsteMes,
      partosDosUltimos3Meses,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar estatísticas"
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

