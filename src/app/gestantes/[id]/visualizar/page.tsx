"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import {
  calculateWeeks,
  formatCartaoSus,
  formatDate,
  formatTelefone,
  getRiscoColor,
  yesNo,
} from "@/lib/formatters"
import type { GestanteDetail } from "@/types/gestante"

export default function VisualizarGestantePage() {
  const params = useParams()
  const id = params.id as string
  const [gestante, setGestante] = useState<GestanteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGestante = async () => {
      try {
        const response = await fetch(`/api/gestantes/${id}`)
        if (!response.ok) {
          throw new Error("Gestante não encontrada")
        }
        const data = await response.json()
        setGestante(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar gestante")
      } finally {
        setLoading(false)
      }
    }

    fetchGestante()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando gestante...</p>
        </div>
      </div>
    )
  }

  if (error || !gestante) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-foreground">{error || "Gestante não encontrada"}</p>
        <Link href="/">
          <Button variant="outline">Voltar ao dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{gestante.nome}</h1>
            <p className="text-muted-foreground">Informações completas do cadastro</p>
          </div>
        </div>
        <Link href={`/gestantes/${id}`}>
          <Button variant="secondary" className="gap-2">
            <Edit className="h-4 w-4" />
            Editar cadastro
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
          <CardDescription>Dados básicos e datas</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Nome" value={gestante.nome} />
          <InfoItem label="Cartão SUS" value={formatCartaoSus(gestante.cartaoSus || "")} />
          <InfoItem label="Data de Nascimento" value={gestante.dataNascimento ? formatDate(gestante.dataNascimento) : "-"} />
          <InfoItem label="Telefone" value={gestante.telefone ? formatTelefone(gestante.telefone) : "-"} />
          <InfoItem label="DUM" value={formatDate(gestante.dum)} />
          <InfoItem label="DPP" value={formatDate(gestante.dpp)} />
          <InfoItem label="Início do Pré-natal" value={`${gestante.semanasInicioPreNatal} semanas`} />
          <InfoItem label="Semanas de Gestação" value={`${calculateWeeks(gestante.dum)} semanas`} />
          <InfoItem label="UBS" value={gestante.ubs?.nome ?? "—"} />
          <InfoItem label="Etnia" value={gestante.etnia} />
          <InfoItem label="Gestações Anteriores" value={gestante.gestacoesAnteriores.toString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classificação de Risco</CardTitle>
          <CardDescription>Informações clínicas</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col rounded-lg border border-border p-3">
            <span className="text-sm text-muted-foreground">Nível de Risco</span>
            <span
              className={`mt-1 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium ${getRiscoColor(gestante.risco)}`}
            >
              {gestante.risco}
            </span>
          </div>
          <InfoItem label="Descrição/Observação" value={gestante.descricaoRisco || "-"} />
          <InfoItem label="Motivo Alto Risco" value={gestante.motivoAltoRisco || "-"} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Exames de Rotina</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <InfoItem label="Rotina 1º trimestre" value={yesNo(gestante.exameRotina1Trimestre)} />
            <InfoItem label="Rotina 2º trimestre" value={yesNo(gestante.exameRotina2Trimestre)} />
            <InfoItem label="Rotina 3º trimestre" value={yesNo(gestante.exameRotina3Trimestre)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ultrassom</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <InfoItem label="Ultrassom 1º trimestre" value={yesNo(gestante.ultrassom1Trimestre)} />
            <InfoItem label="Ultrassom 2º trimestre" value={yesNo(gestante.ultrassom2Trimestre)} />
            <InfoItem label="Ultrassom 3º trimestre" value={yesNo(gestante.ultrassom3Trimestre)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vacinas</CardTitle>
          <CardDescription>Status de aplicação</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="HB - Hepatite B" value={yesNo(gestante.vacinaHB)} />
          <InfoItem label="DT - Dupla Adulto" value={yesNo(gestante.vacinaDT)} />
          <InfoItem label="Influenza" value={yesNo(gestante.vacinaInfluenza)} />
          <InfoItem label="Covid-19" value={yesNo(gestante.vacinaCovid19)} />
          <InfoItem label="DTPA 20ª semana" value={yesNo(gestante.vacinaDTPA20Semana)} />
          <InfoItem label="VSR 28ª semana" value={yesNo(gestante.vacinaVSR28Semana)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planilha de monitoramento</CardTitle>
          <CardDescription>Consultas, testes rápidos, AAE, maternidade e desfecho</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Testes rápidos 1º trimestre" value={yesNo(gestante.testesRapidos1Trimestre)} />
          <InfoItem label="Testes rápidos 3º trimestre" value={yesNo(gestante.testesRapidos3Trimestre)} />
          <InfoItem label="Nº de consultas" value={String(gestante.numeroConsultas ?? 0)} />
          <InfoItem label="Plano de cuidados" value={yesNo(gestante.planoDeCuidados)} />
          <InfoItem label="Gestão de caso" value={yesNo(gestante.gestaoDeCaso)} />
          <InfoItem label="Vinculada à maternidade" value={yesNo(gestante.vinculadaMaternidade)} />
          <InfoItem label="Maternidade" value={gestante.nomeMaternidade || "-"} />
          <InfoItem
            label="Situação na AAE"
            value={
              gestante.statusAAE === "compartilhada"
                ? "Compartilhada"
                : gestante.statusAAE === "aguardando_vaga"
                  ? "Aguardando vaga"
                  : "Não encaminhada"
            }
          />
          <InfoItem label="Destino AAE" value={gestante.destinoAAE || "-"} />
          <InfoItem
            label="Data do encaminhamento"
            value={gestante.dataEncaminhamentoAAE ? formatDate(gestante.dataEncaminhamentoAAE) : "-"}
          />
          <InfoItem
            label="Data de acesso à AAE"
            value={gestante.dataAcessoAAE ? formatDate(gestante.dataAcessoAAE) : "-"}
          />
          <InfoItem
            label="Desfecho"
            value={
              gestante.desfecho === "nascido"
                ? "Nascido vivo"
                : gestante.desfecho === "obito_fetal"
                  ? "Óbito fetal"
                  : gestante.desfecho === "obito_infantil"
                    ? "Óbito infantil"
                    : gestante.desfecho === "obito_materno"
                      ? "Óbito materno"
                      : "Em andamento"
            }
          />
          <InfoItem
            label="Data do desfecho"
            value={gestante.dataDesfecho ? formatDate(gestante.dataDesfecho) : "-"}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg border border-border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base font-semibold text-foreground">{value}</span>
    </div>
  )
}
