import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { addDays } from "date-fns"
import { getAuthSession, requireAuth } from "../../../../lib/auth-api"
import { compactDefined, parseMonitoramentoFields } from "../../../../lib/monitoramento"
import { snapshotExclusao } from "../../../../lib/gestantes"

// GET - Buscar gestante por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError
  const session = await getAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
  }

  try {
    const { id } = await params
    const gestante = await prisma.gestante.findUnique({
      where: { id },
      include: {
        ubs: {
          select: { id: true, nome: true, endereco: true },
        },
      },
    })

    if (!gestante) {
      return NextResponse.json(
        { error: "Gestante não encontrada" },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    if (!session.user.isAdmin && gestante.ubsId !== session.user.ubsId) {
      return NextResponse.json(
        { error: "Acesso negado à gestante" },
        { status: 403 }
      )
    }

    return NextResponse.json(gestante, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Erro ao buscar gestante:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar gestante"
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

// PUT - Atualizar gestante
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError
  const session = await getAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
  }

  try {
    const { id } = await params
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

    // Calcular DPP se DUM foi alterada
    let dpp = undefined
    if (dum) {
      dpp = addDays(new Date(dum), 280)
    }

    const gestanteAtual = await prisma.gestante.findUnique({ where: { id } })
    if (!gestanteAtual) {
      return NextResponse.json({ error: "Gestante não encontrada" }, { status: 404 })
    }

    if (!session.user.isAdmin && gestanteAtual.ubsId !== session.user.ubsId) {
      return NextResponse.json(
        { error: "Acesso negado à gestante" },
        { status: 403 }
      )
    }

    let telefoneValue: string | null | undefined
    if (telefone !== undefined) {
      const digits = String(telefone).replace(/\D/g, "")
      if (digits.length === 0) {
        // usuário limpou o telefone -> gravar como null
        telefoneValue = null
      } else {
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

    let semanasInicioPreNatalValue: number | undefined
    if (semanasInicioPreNatal !== undefined) {
      const parsedSemanasInicioPreNatal = Number(semanasInicioPreNatal)
      if (!Number.isInteger(parsedSemanasInicioPreNatal) || parsedSemanasInicioPreNatal < 1 || parsedSemanasInicioPreNatal > 45) {
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
      semanasInicioPreNatalValue = parsedSemanasInicioPreNatal
    }

    const gestante = await prisma.gestante.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(dataNascimento && { dataNascimento: new Date(dataNascimento) }),
        ...(cartaoSus && { cartaoSus }),
        ...(telefoneValue !== undefined && { telefone: telefoneValue }),
        ...(session.user.isAdmin && ubsId && { ubsId }),
        ...(dum && { dum: new Date(dum) }),
        ...(dpp && { dpp }),
        ...(semanasInicioPreNatalValue !== undefined && { semanasInicioPreNatal: semanasInicioPreNatalValue }),
        ...(etnia && { etnia }),
        ...(gestacoesAnteriores !== undefined && { gestacoesAnteriores: parseInt(gestacoesAnteriores) }),
        ...(risco && { risco }),
        ...(descricaoRisco !== undefined && { descricaoRisco }),
        ...(motivoAltoRisco !== undefined && { motivoAltoRisco }),
        ...(exames && {
          exameRotina1Trimestre: exames.rotina1 ?? undefined,
          exameRotina2Trimestre: exames.rotina2 ?? undefined,
          exameRotina3Trimestre: exames.rotina3 ?? undefined,
          ultrassom1Trimestre: exames.ultrassom1 ?? undefined,
          ultrassom2Trimestre: exames.ultrassom2 ?? undefined,
          ultrassom3Trimestre: exames.ultrassom3 ?? undefined,
        }),
        ...(vacinas && {
          vacinaHB: vacinas.hb ?? undefined,
          vacinaDT: vacinas.dt ?? undefined,
          vacinaInfluenza: vacinas.influenza ?? undefined,
          vacinaCovid19: vacinas.covid19 ?? undefined,
          vacinaDTPA20Semana: vacinas.dtpa20Semana ?? undefined,
          vacinaVSR28Semana: vacinas.vsr28Semana ?? undefined,
        }),
        ...compactDefined(parseMonitoramentoFields(body)),
      },
    })

    return NextResponse.json(gestante, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Erro ao atualizar gestante:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar gestante"
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

// DELETE - Deletar gestante
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError
  const session = await getAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
  }

  try {
    const { id } = await params
    const gestanteAtual = await prisma.gestante.findUnique({ where: { id } })
    if (!gestanteAtual) {
      return NextResponse.json({ error: "Gestante não encontrada" }, { status: 404 })
    }

    if (!session.user.isAdmin && gestanteAtual.ubsId !== session.user.ubsId) {
      return NextResponse.json(
        { error: "Acesso negado à gestante" },
        { status: 403 }
      )
    }

    // Registrar a exclusão antes de deletar
    try {
      await prisma.gestanteExcluida.create({
        data: {
          ...snapshotExclusao(gestanteAtual),
          enfermeiroId: session.user.id,
          motivoExclusao: "manual",
        },
      })
    } catch (auditError) {
      console.error("Erro ao registrar exclusão na auditoria:", auditError)
      // Se o modelo não existe, pode ser que o Prisma Client não foi regenerado
      // ou o servidor precisa ser reiniciado
      if (auditError instanceof Error && auditError.message.includes("undefined")) {
        throw new Error("Prisma Client não atualizado. Execute 'npx prisma generate' e reinicie o servidor.")
      }
      // Continuar com a exclusão mesmo se falhar o registro de auditoria
      // para não bloquear a funcionalidade
    }

    await prisma.gestante.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Gestante deletada com sucesso" },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error("Erro ao deletar gestante:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao deletar gestante"
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

