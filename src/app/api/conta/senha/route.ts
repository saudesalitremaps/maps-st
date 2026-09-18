import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "../../../../lib/prisma"
import { getAuthSession, requireAuth } from "../../../../lib/auth-api"

export async function PUT(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
    }

    const body = await request.json()
    const senhaAtual = String(body.senhaAtual || "")
    const novaSenha = String(body.novaSenha || "")

    if (!senhaAtual || !novaSenha) {
      return NextResponse.json(
        { error: "Informe a senha atual e a nova senha." },
        { status: 400 }
      )
    }

    if (novaSenha.length < 8) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      )
    }

    const usuario = await prisma.enfermeiro.findUnique({
      where: { id: session.user.id },
      select: { senha: true },
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const valida = await bcrypt.compare(senhaAtual, usuario.senha)
    if (!valida) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 })
    }

    await prisma.enfermeiro.update({
      where: { id: session.user.id },
      data: { senha: await bcrypt.hash(novaSenha, 10) },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Erro ao alterar senha:", error)
    return NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 })
  }
}
