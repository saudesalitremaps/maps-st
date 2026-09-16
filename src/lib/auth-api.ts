import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "./auth"

export async function getAuthSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth(request: NextRequest) {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    )
  }
  return null
}

export async function requireAdmin(request: NextRequest) {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    )
  }
  if (!session.user.isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores podem acessar esta área." },
      { status: 403 }
    )
  }
  return null
}
