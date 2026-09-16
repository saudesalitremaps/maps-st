"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Pagination } from "@/components/ui/pagination"
import { DashboardSkeleton } from "@/components/ui/loading-skeleton"
import {
  calculateWeeks,
  formatDate,
  getRiscoColor,
  isGestacaoAtiva,
  isPartoEsteMes,
  isPartoUltimos3Meses,
} from "@/lib/formatters"
import type { DashboardStats, GestanteListItem } from "@/types/gestante"
import { getMunicipio } from "@/lib/municipio"
import {
  Plus,
  Edit,
  Users,
  AlertTriangle,
  AlertCircle,
  Baby,
  Trash2,
  Eye,
  Check,
  Filter,
  RefreshCw,
} from "lucide-react"

export default function Dashboard() {
  const { data: session } = useSession()
  const [gestantes, setGestantes] = useState<GestanteListItem[]>([])
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [riskFilter, setRiskFilter] = useState<"all" | "alto" | "intermediario">("all")
  const [partoFilter, setPartoFilter] = useState<"all" | "ultimos3Meses" | "estemes">("all")
  const [stats, setStats] = useState<DashboardStats>({
    totalGestantes: 0,
    gestantesAltoRisco: 0,
    gestantesRiscoIntermediario: 0,
    partosEsteMes: 0,
    partosDosUltimos3Meses: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [cleaning, setCleaning] = useState(false)
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setError(null)
    try {
      const [gestantesRes, statsRes] = await Promise.all([
        fetch("/api/gestantes"),
        fetch("/api/gestantes/stats"),
      ])

      // Verificar se as respostas são JSON válidas
      const gestantesContentType = gestantesRes.headers.get("content-type")
      const statsContentType = statsRes.headers.get("content-type")

      if (!gestantesRes.ok) {
        throw new Error(`Erro ao buscar gestantes: ${gestantesRes.status}`)
      }

      if (!statsRes.ok) {
        throw new Error(`Erro ao buscar estatísticas: ${statsRes.status}`)
      }

      if (!gestantesContentType?.includes("application/json")) {
        const text = await gestantesRes.text()
        console.error("Resposta não é JSON:", text.substring(0, 200))
        throw new Error("Resposta da API não é JSON válido")
      }

      if (!statsContentType?.includes("application/json")) {
        const text = await statsRes.text()
        console.error("Resposta não é JSON:", text.substring(0, 200))
        throw new Error("Resposta da API não é JSON válido")
      }

      const gestantesData = await gestantesRes.json()
      const statsData = await statsRes.json()

      // Verificar se há erro na resposta
      if (gestantesData.error) {
        console.error("Erro da API:", gestantesData)
        if (gestantesData.details) {
          console.error("Detalhes do erro:", gestantesData.details)
        }
        throw new Error(gestantesData.error)
      }

      if (statsData.error) {
        console.error("Erro da API de stats:", statsData)
        if (statsData.details) {
          console.error("Detalhes do erro:", statsData.details)
        }
        throw new Error(statsData.error)
      }

      setGestantes(gestantesData)
      setPage(1)
      setStats(statsData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados. Verifique sua conexão e tente novamente."
      )
      setGestantes([])
      setStats({
        totalGestantes: 0,
        gestantesAltoRisco: 0,
        gestantesRiscoIntermediario: 0,
        partosEsteMes: 0,
        partosDosUltimos3Meses: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredGestantes = gestantes.filter((gestante) => {
    if (!isGestacaoAtiva(gestante.dum)) return false

    const term = searchTerm.trim().toLowerCase()

    const matchesSearch =
      term.length === 0 ||
      gestante.nome.toLowerCase().includes(term) ||
      (gestante.cartaoSus && gestante.cartaoSus.toLowerCase().includes(term))

    const matchesRisco =
      riskFilter === "all" ||
      (riskFilter === "alto" && gestante.risco === "Risco Alto") ||
      (riskFilter === "intermediario" && gestante.risco === "Risco Intermediário")

    const matchesParto =
      partoFilter === "all" || (partoFilter === "ultimos3Meses" && isPartoUltimos3Meses(gestante.dpp)) || (partoFilter === "estemes" && isPartoEsteMes(gestante.dpp))

    return matchesSearch && matchesRisco && matchesParto
  })

  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredGestantes.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedGestantes = filteredGestantes.slice(startIndex, startIndex + itemsPerPage)

  const handleDelete = async (gestanteId: string) => {
    const gestante = gestantes.find((g) => g.id === gestanteId)
    const nome = gestante?.nome ? ` de ${gestante.nome}` : ""
    if (!confirm(`Tem certeza que deseja excluir a gestante${nome}?`)) {
      return
    }

    setDeletingId(gestanteId)
    try {
      const response = await fetch(`/api/gestantes/${gestanteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao excluir gestante")
      }

      await fetchData()
    } catch (error) {
      console.error("Erro ao excluir gestante:", error)
      alert("Não foi possível excluir a gestante. Tente novamente.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleCleanupExGestantes = async () => {
    setShowCleanupConfirm(false)
    setCleaning(true)
    try {
      const response = await fetch("/api/admin/gestantes/cleanup", {
        method: "POST",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao remover ex-gestantes")
      }
      await fetchData()
    } catch (error) {
      console.error("Erro ao remover ex-gestantes:", error)
      alert("Não foi possível remover ex-gestantes. Tente novamente.")
    } finally {
      setCleaning(false)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8">
      {error && (
        <AlertBanner
          message={error}
          action={{ label: "Tentar novamente", onClick: () => { setLoading(true); fetchData() } }}
          onDismiss={() => setError(null)}
        />
      )}
      {showCleanupConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Remover Ex-Gestantes</h2>
              <p className="text-sm text-gray-600 mt-1">
                Isso vai excluir automaticamente todas as gestantes cuja DPP já passou.
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="px-6 py-4 flex flex-col gap-4">
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                Confirme apenas se já registrou o desfecho dessas gestantes. A remoção é definitiva.
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCleanupConfirm(false)}
                  disabled={cleaning}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCleanupExGestantes}
                  disabled={cleaning}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {cleaning ? "Removendo..." : "Confirmar remoção"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Título e Botão de Adicionar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Visão geral</h1>
          <p className="mt-1 text-sm text-gray-600">
            Acompanhe rapidamente o risco, partos previstos e gestantes cadastradas na {getMunicipio().aps}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => { setLoading(true); fetchData() }}
            aria-label="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/gestantes/novo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Gestante
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de Estatísticas - cores sólidas para compatibilidade entre navegadores */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-none bg-emerald-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">
              Total de Gestantes
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{stats.totalGestantes}</div>
            <p className="text-xs text-emerald-800 mt-1">
              Gestantes cadastradas no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-red-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">
              Gestantes de Alto Risco
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              {stats.gestantesAltoRisco}
            </div>
            <p className="text-xs text-red-800 mt-1">
              Requerem atenção especial
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-amber-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">
              Risco Intermediário
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-800">
              {stats.gestantesRiscoIntermediario}
            </div>
            <p className="text-xs text-amber-800 mt-1">
              Monitoramento reforçado
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-cyan-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-900">
              Partos Este Mês
            </CardTitle>
            <Baby className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-700">
              {stats.partosEsteMes}
            </div>
            <p className="text-xs text-cyan-800 mt-1">
              DPP previsto para este mês
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-pink-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-900">
              Partos nos últimos 3 meses
            </CardTitle>
            <Check className="h-4 w-4 text-[#EC008C]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#EC008C]">
              {stats.partosDosUltimos3Meses}
            </div>
            <p className="text-xs text-pink-800 mt-1">
              Partos concluídos nos últimos 3 meses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Gestantes */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-gray-900">Lista de Gestantes</CardTitle>
              <CardDescription className="text-gray-600">
                Visualize e gerencie todas as gestantes cadastradas
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex-1 md:w-64">
                <Input
                  placeholder="Buscar por nome ou cartão do SUS"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
                {(riskFilter !== "all" || partoFilter !== "all") && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRiskFilter("all")
                      setPartoFilter("all")
                      setPage(1)
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              <Button
                type="button"
                variant={riskFilter === "alto" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  setRiskFilter((current) => (current === "alto" ? "all" : "alto"))
                  setPartoFilter("all")
                  setPage(1)
                }}
              >
                Gestantes de alto risco
              </Button>
              <Button
                type="button"
                variant={riskFilter === "intermediario" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  setRiskFilter((current) => (current === "intermediario" ? "all" : "intermediario"))
                  setPartoFilter("all")
                  setPage(1)
                }}
              >
                Gestantes de risco intermediário
              </Button>
              <Button
                type="button"
                variant={partoFilter === "estemes" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  setPartoFilter((current) => (current === "estemes" ? "all" : "estemes"))
                  setRiskFilter("all")
                  setPage(1)
                }}
              >
                Partos Este Mês
              </Button>
              <Button
                type="button"
                variant={partoFilter === "ultimos3Meses" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  setPartoFilter((current) => (current === "ultimos3Meses" ? "all" : "ultimos3Meses"))
                  setRiskFilter("all")
                  setPage(1)
                }}
              >
                Partos nos últimos 3 meses
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {gestantes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">Nenhuma gestante cadastrada ainda.</p>
              <Link href="/gestantes/novo">
                <Button>Cadastrar Primeira Gestante</Button>
              </Link>
            </div>
          ) : filteredGestantes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">Nenhuma gestante encontrada com os filtros atuais.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setRiskFilter("all")
                  setPartoFilter("all")
                  setPage(1)
                }}
              >
                Limpar busca e filtros
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full overflow-hidden rounded-xl border border-border bg-card/60 shadow-sm">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-100">
                    <th className="text-left p-4 text-xs font-semibold tracking-wide uppercase text-gray-900">Nome</th>
                    <th className="text-left p-4 text-xs font-semibold tracking-wide uppercase text-gray-900">DUM</th>
                    <th className="text-left p-4 text-xs font-semibold tracking-wide uppercase text-gray-900">DPP</th>
                    <th className="text-left p-4 text-xs font-semibold tracking-wide uppercase text-gray-900">Semanas de Gestação</th>
                    <th className="text-left p-4 text-xs font-semibold tracking-wide uppercase text-gray-900">Risco</th>
                    {session?.user?.isAdmin && (
                      <th className="text-left p-4 text-xs font-semibold tracking-wide uppercase text-gray-900">UBS</th>
                    )}
                    <th className="text-left p-4 text-xs font-semibold tracking-wide uppercase text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGestantes.map((gestante) => (
                    <tr
                      key={gestante.id}
                      className="border-b border-border odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <td className="p-4 font-medium text-gray-900">{gestante.nome}</td>
                      <td className="p-4 text-gray-800">{formatDate(gestante.dum)}</td>
                      <td className="p-4 text-gray-800">{formatDate(gestante.dpp)}</td>
                      <td className="p-4 text-gray-800">{calculateWeeks(gestante.dum)} semanas</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getRiscoColor(
                            gestante.risco
                          )}`}
                        >
                          {gestante.risco}
                        </span>
                      </td>
                      {session?.user?.isAdmin && (
                        <td className="p-4 font-medium text-gray-900">
                          {gestante.ubs?.nome ?? "—"}
                        </td>
                      )}
                      <td className="p-4 text-gray-800">
                        <div className="flex gap-2">
                          <Link href={`/gestantes/${gestante.id}/visualizar`}>
                            <Button variant="outline" size="sm" className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                              <Eye className="h-3 w-3" />
                              Ver
                            </Button>
                          </Link>
                          <Link href={`/gestantes/${gestante.id}`}>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Edit className="h-3 w-3" />
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDelete(gestante.id)}
                            disabled={deletingId === gestante.id}
                          >
                            <Trash2 className="h-3 w-3" />
                            {deletingId === gestante.id ? "Excluindo..." : "Excluir"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
          {gestantes.length > 0 && filteredGestantes.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredGestantes.length} gestante{filteredGestantes.length !== 1 ? "s" : ""} encontrada{filteredGestantes.length !== 1 ? "s" : ""}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
