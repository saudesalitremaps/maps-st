import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "../../../../../lib/auth-api"
import { removeGestantesPosTresMeses } from "../../../../../lib/gestantes"

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const removidas = await removeGestantesPosTresMeses()
    return NextResponse.json(
      { removidas, message: "Gestantes com DPP vencida removidas" },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error("Erro ao remover gestantes com DPP vencida:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao remover gestantes"
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

