import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { requireAdmin } from "../../../../lib/auth-api"

// GET - Listar todas as UBS
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const ubs = await prisma.uBS.findMany({
      include: {
        enfermeiros: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    })

    return NextResponse.json(ubs, {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Erro ao buscar UBS:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao buscar UBS"
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

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const nome = String(body.nome || "").trim()
    const endereco = String(body.endereco || "").trim()

    if (!nome || !endereco) {
      return NextResponse.json(
        { error: "Informe o nome e o endereço da UBS." },
        { status: 400 }
      )
    }

    const ubs = await prisma.uBS.create({
      data: { nome, endereco },
    })

    return NextResponse.json(ubs, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar UBS:", error)
    return NextResponse.json({ error: "Erro ao criar UBS" }, { status: 500 })
  }
}

