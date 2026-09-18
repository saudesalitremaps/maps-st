import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "../../../../../lib/prisma"
import { getAuthSession, requireAdmin } from "../../../../../lib/auth-api"

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { id } = await context.params
    const body = await request.json()
    const nome = String(body.nome || "").trim()
    const email = String(body.email || "").trim().toLowerCase()
    const senha = body.senha ? String(body.senha) : ""
    const isAdmin = Boolean(body.isAdmin)
    const ubsId = body.ubsId ? String(body.ubsId) : null

    if (!nome || !email) {
      return NextResponse.json({ error: "Informe nome e e-mail." }, { status: 400 })
    }

    if (senha && senha.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      )
    }

    if (!isAdmin && !ubsId) {
      return NextResponse.json(
        { error: "Profissionais de saúde precisam estar vinculados a uma UBS." },
        { status: 400 }
      )
    }

    const atual = await prisma.enfermeiro.findUnique({ where: { id } })
    if (!atual) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 })
    }

    if (atual.isAdmin && !isAdmin) {
      const admins = await prisma.enfermeiro.count({ where: { isAdmin: true } })
      if (admins <= 1) {
        return NextResponse.json(
          { error: "Não é possível remover o último administrador." },
          { status: 409 }
        )
      }
    }

    const emailEmUso = await prisma.enfermeiro.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        NOT: { id },
      },
    })
    if (emailEmUso) {
      return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 409 })
    }

    const enfermeiro = await prisma.enfermeiro.update({
      where: { id },
      data: {
        nome,
        email,
        isAdmin,
        ubsId,
        ...(senha ? { senha: await bcrypt.hash(senha, 10) } : {}),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        isAdmin: true,
        ubsId: true,
        ubs: { select: { id: true, nome: true } },
      },
    })

    return NextResponse.json(enfermeiro)
  } catch (error) {
    console.error("Erro ao atualizar profissional:", error)
    return NextResponse.json({ error: "Erro ao atualizar profissional" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const session = await getAuthSession()
    const { id } = await context.params

    if (session?.user.id === id) {
      return NextResponse.json(
        { error: "Você não pode excluir o próprio usuário." },
        { status: 409 }
      )
    }

    const atual = await prisma.enfermeiro.findUnique({ where: { id } })
    if (!atual) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 })
    }

    if (atual.isAdmin) {
      const admins = await prisma.enfermeiro.count({ where: { isAdmin: true } })
      if (admins <= 1) {
        return NextResponse.json(
          { error: "Não é possível excluir o último administrador." },
          { status: 409 }
        )
      }
    }

    await prisma.enfermeiro.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Erro ao excluir profissional:", error)
    return NextResponse.json({ error: "Erro ao excluir profissional" }, { status: 500 })
  }
}
