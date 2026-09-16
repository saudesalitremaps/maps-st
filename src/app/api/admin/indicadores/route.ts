import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { requireAdmin } from "../../../../lib/auth-api"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const anoParam = new URL(request.url).searchParams.get("ano")
  const ano = anoParam ? parseInt(anoParam, 10) : new Date().getFullYear()
  if (!ano || Number.isNaN(ano)) {
    return NextResponse.json({ error: "Ano inválido" }, { status: 400 })
  }

  const indicador = await prisma.indicadorMunicipal.findUnique({ where: { ano } })
  return NextResponse.json({
    ano,
    gestantesEstimadas: indicador?.gestantesEstimadas ?? 0,
  })
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const body = await request.json()
  const ano = Number(body.ano)
  const gestantesEstimadas = Number(body.gestantesEstimadas)

  if (!Number.isInteger(ano) || ano < 2000) {
    return NextResponse.json({ error: "Ano inválido" }, { status: 400 })
  }
  if (!Number.isInteger(gestantesEstimadas) || gestantesEstimadas < 0) {
    return NextResponse.json({ error: "Informe um número válido de gestantes estimadas." }, { status: 400 })
  }

  const indicador = await prisma.indicadorMunicipal.upsert({
    where: { ano },
    create: { ano, gestantesEstimadas },
    update: { gestantesEstimadas },
  })

  return NextResponse.json(indicador)
}
