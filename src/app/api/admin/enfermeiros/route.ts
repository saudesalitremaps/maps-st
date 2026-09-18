import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "../../../../lib/prisma"
import { requireAdmin } from "../../../../lib/auth-api"

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase()
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const enfermeiros = await prisma.enfermeiro.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        isAdmin: true,
        ubsId: true,
        createdAt: true,
        ubs: { select: { id: true, nome: true } },
      },
      orderBy: { nome: "asc" },
    })

    return NextResponse.json(enfermeiros)
  } catch (error) {
    console.error("Erro ao listar profissionais:", error)
    return NextResponse.json({ error: "Erro ao listar profissionais" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const nome = String(body.nome || "").trim()
    const email = normalizeEmail(body.email)
    const senha = String(body.senha || "")
    const isAdmin = Boolean(body.isAdmin)
    const ubsId = body.ubsId ? String(body.ubsId) : null

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: "Informe nome, e-mail e senha." },
        { status: 400 }
      )
    }

    if (senha.length < 8) {
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

    const existente = await prisma.enfermeiro.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    })
    if (existente) {
      return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 409 })
    }

    const enfermeiro = await prisma.enfermeiro.create({
      data: {
        nome,
        email,
        senha: await bcrypt.hash(senha, 10),
        isAdmin,
        ubsId,
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

    return NextResponse.json(enfermeiro, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar profissional:", error)
    return NextResponse.json({ error: "Erro ao criar profissional" }, { status: 500 })
  }
}
