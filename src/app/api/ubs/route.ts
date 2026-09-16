import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"
import { requireAuth } from "../../../lib/auth-api"

// GET - Listar todas as UBS (para uso em formulários)
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const ubs = await prisma.uBS.findMany({
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

