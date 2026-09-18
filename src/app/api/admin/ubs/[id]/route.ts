import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../../lib/prisma"
import { requireAdmin } from "../../../../../lib/auth-api"

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { id } = await context.params
    const body = await request.json()
    const nome = String(body.nome || "").trim()
    const endereco = String(body.endereco || "").trim()

    if (!nome || !endereco) {
      return NextResponse.json(
        { error: "Informe o nome e o endereço da UBS." },
        { status: 400 }
      )
    }

    const ubs = await prisma.uBS.update({
      where: { id },
      data: { nome, endereco },
    })

    return NextResponse.json(ubs)
  } catch (error) {
    console.error("Erro ao atualizar UBS:", error)
    return NextResponse.json({ error: "Erro ao atualizar UBS" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { id } = await context.params
    const ubs = await prisma.uBS.findUnique({
      where: { id },
      include: {
        _count: { select: { gestantes: true, enfermeiros: true } },
      },
    })

    if (!ubs) {
      return NextResponse.json({ error: "UBS não encontrada" }, { status: 404 })
    }

    if (ubs._count.gestantes > 0 || ubs._count.enfermeiros > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir uma UBS com gestantes ou profissionais vinculados. Realoque-os antes.",
        },
        { status: 409 }
      )
    }

    await prisma.uBS.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Erro ao excluir UBS:", error)
    return NextResponse.json({ error: "Erro ao excluir UBS" }, { status: 500 })
  }
}
