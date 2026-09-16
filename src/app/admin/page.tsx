"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown, Filter, BarChart3, ChevronDown, ChevronUp, FileText } from "lucide-react"
import Link from "next/link"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface UBS {
  id: string
  nome: string
  endereco: string
}

interface RelatorioData {
  gestantes: any[]
  estatisticas: {
    total: number
    porRisco: {
      baixo: number
      intermediario: number
      alto: number
    }
    porEtnia: Record<string, number>
    exames?: {
      exameRotina1Trimestre: number
      exameRotina2Trimestre: number
      exameRotina3Trimestre: number
      ultrassom1Trimestre: number
      ultrassom2Trimestre: number
      ultrassom3Trimestre: number
    }
    vacinas?: {
      vacinaHB: number
      vacinaDT: number
      vacinaInfluenza: number
      vacinaCovid19: number
      vacinaDTPA20Semana: number
      vacinaVSR28Semana: number
    }
  }
  filtros: {
    ubsId: string | null
    risco: string | null
    etnia: string | null
    dataInicio: string | null
    dataFim: string | null
    [key: string]: string | null
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ubsList, setUbsList] = useState<UBS[]>([])
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null)
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false)
  const [showFiltrosExames, setShowFiltrosExames] = useState(false)
  const [showFiltrosVacinas, setShowFiltrosVacinas] = useState(false)
  const [filtros, setFiltros] = useState({
    ubsId: "",
    risco: "",
    etnia: "",
    dataInicio: "",
    dataFim: "",
    dumInicio: "",
    dumFim: "",
    dppInicio: "",
    dppFim: "",
    gestacoesMin: "",
    gestacoesMax: "",
    semanasMin: "",
    semanasMax: "",
    idadeMin: "",
    idadeMax: "",
    exameRotina1Trimestre: "",
    exameRotina2Trimestre: "",
    exameRotina3Trimestre: "",
    ultrassom1Trimestre: "",
    ultrassom2Trimestre: "",
    ultrassom3Trimestre: "",
    vacinaHB: "",
    vacinaDT: "",
    vacinaInfluenza: "",
    vacinaCovid19: "",
    vacinaDTPA20Semana: "",
    vacinaVSR28Semana: "",
    partoEsteMes: "",
    partoProximos3Meses: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/")
      return
    }
    if (status === "authenticated") {
      fetchUBS()
    }
  }, [status, session, router])

  const fetchUBS = async () => {
    try {
      const response = await fetch("/api/admin/ubs")
      if (response.ok) {
        const ubs = await response.json()
        setUbsList(ubs)
      }
    } catch (error) {
      console.error("Erro ao buscar UBS:", error)
    }
  }

  const gerarRelatorio = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtros.ubsId) params.append("ubsId", filtros.ubsId)
      if (filtros.risco) params.append("risco", filtros.risco)
      if (filtros.etnia) params.append("etnia", filtros.etnia)
      if (filtros.dataInicio) params.append("dataInicio", filtros.dataInicio)
      if (filtros.dataFim) params.append("dataFim", filtros.dataFim)
      if (filtros.dumInicio) params.append("dumInicio", filtros.dumInicio)
      if (filtros.dumFim) params.append("dumFim", filtros.dumFim)
      if (filtros.dppInicio) params.append("dppInicio", filtros.dppInicio)
      if (filtros.dppFim) params.append("dppFim", filtros.dppFim)
      if (filtros.gestacoesMin) params.append("gestacoesMin", filtros.gestacoesMin)
      if (filtros.gestacoesMax) params.append("gestacoesMax", filtros.gestacoesMax)
      if (filtros.semanasMin) params.append("semanasMin", filtros.semanasMin)
      if (filtros.semanasMax) params.append("semanasMax", filtros.semanasMax)
      if (filtros.idadeMin) params.append("idadeMin", filtros.idadeMin)
      if (filtros.idadeMax) params.append("idadeMax", filtros.idadeMax)
      if (filtros.exameRotina1Trimestre === "true") params.append("exameRotina1Trimestre", "true")
      if (filtros.exameRotina2Trimestre === "true") params.append("exameRotina2Trimestre", "true")
      if (filtros.exameRotina3Trimestre === "true") params.append("exameRotina3Trimestre", "true")
      if (filtros.ultrassom1Trimestre === "true") params.append("ultrassom1Trimestre", "true")
      if (filtros.ultrassom2Trimestre === "true") params.append("ultrassom2Trimestre", "true")
      if (filtros.ultrassom3Trimestre === "true") params.append("ultrassom3Trimestre", "true")
      if (filtros.vacinaHB === "true") params.append("vacinaHB", "true")
      if (filtros.vacinaDT === "true") params.append("vacinaDT", "true")
      if (filtros.vacinaInfluenza === "true") params.append("vacinaInfluenza", "true")
      if (filtros.vacinaCovid19 === "true") params.append("vacinaCovid19", "true")
      if (filtros.vacinaDTPA20Semana === "true") params.append("vacinaDTPA20Semana", "true")
      if (filtros.vacinaVSR28Semana === "true") params.append("vacinaVSR28Semana", "true")
      if (filtros.partoEsteMes === "true") params.append("partoEsteMes", "true")
      if (filtros.partoProximos3Meses === "true") params.append("partoProximos3Meses", "true")

      const response = await fetch(`/api/admin/relatorios?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setRelatorio(data)
      } else {
        alert("Erro ao gerar relatório")
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      alert("Erro ao gerar relatório")
    } finally {
      setLoading(false)
    }
  }

  const limparFiltros = () => {
    setFiltros({
      ubsId: "",
      risco: "",
      etnia: "",
      dataInicio: "",
      dataFim: "",
      dumInicio: "",
      dumFim: "",
      dppInicio: "",
      dppFim: "",
      gestacoesMin: "",
      gestacoesMax: "",
      semanasMin: "",
      semanasMax: "",
      idadeMin: "",
      idadeMax: "",
      exameRotina1Trimestre: "",
      exameRotina2Trimestre: "",
      exameRotina3Trimestre: "",
      ultrassom1Trimestre: "",
      ultrassom2Trimestre: "",
      ultrassom3Trimestre: "",
      vacinaHB: "",
      vacinaDT: "",
      vacinaInfluenza: "",
      vacinaCovid19: "",
      vacinaDTPA20Semana: "",
      vacinaVSR28Semana: "",
      partoEsteMes: "",
      partoProximos3Meses: "",
    })
    setRelatorio(null)
  }

  const exportarCSV = () => {
    if (!relatorio) return

    const headers = [
      "Nome",
      "Cartão SUS",
      "Data de Nascimento",
      "Idade",
      "UBS",
      "Endereço UBS",
      "DUM",
      "DPP",
      "Semanas de Gestação",
      "Etnia",
      "Gestações Anteriores",
      "Risco",
      "Descrição Risco",
      "Motivo Alto Risco",
      "Exame Rotina 1º Trimestre",
      "Exame Rotina 2º Trimestre",
      "Exame Rotina 3º Trimestre",
      "Ultrassom 1º Trimestre",
      "Ultrassom 2º Trimestre",
      "Ultrassom 3º Trimestre",
      "Vacina HB",
      "Vacina DT",
      "Vacina Influenza",
      "Vacina COVID-19",
      "Vacina DTPA (20 semanas)",
      "Vacina VSR (28 semanas)",
      "Data de Cadastro",
    ]

    const rows = relatorio.gestantes.map((g) => [
      g.nome,
      g.cartaoSus,
      g.dataNascimento ? new Date(g.dataNascimento).toLocaleDateString("pt-BR") : "",
      g.idade ?? "",
      g.nomeUBS || g.ubs?.nome || "",
      g.enderecoUBS || g.ubs?.endereco || "",
      new Date(g.dum).toLocaleDateString("pt-BR"),
      new Date(g.dpp).toLocaleDateString("pt-BR"),
      g.semanasGestacao || "",
      g.etnia,
      g.gestacoesAnteriores,
      g.risco,
      g.descricaoRisco || "",
      g.motivoAltoRisco || "",
      g.exameRotina1Trimestre ? "Sim" : "Não",
      g.exameRotina2Trimestre ? "Sim" : "Não",
      g.exameRotina3Trimestre ? "Sim" : "Não",
      g.ultrassom1Trimestre ? "Sim" : "Não",
      g.ultrassom2Trimestre ? "Sim" : "Não",
      g.ultrassom3Trimestre ? "Sim" : "Não",
      g.vacinaHB ? "Sim" : "Não",
      g.vacinaDT ? "Sim" : "Não",
      g.vacinaInfluenza ? "Sim" : "Não",
      g.vacinaCovid19 ? "Sim" : "Não",
      g.vacinaDTPA20Semana ? "Sim" : "Não",
      g.vacinaVSR28Semana ? "Sim" : "Não",
      new Date(g.createdAt).toLocaleDateString("pt-BR"),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio_gestantes_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportarPDF = () => {
    if (!relatorio) return

    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 10
    let yPos = margin

    // Cabeçalho
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Relatório de Gestantes", pageWidth / 2, yPos, { align: "center" })
    yPos += 8

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth / 2,
      yPos,
      { align: "center" }
    )
    yPos += 10

    // Estatísticas
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Estatísticas do Relatório", margin, yPos)
    yPos += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Total de gestantes: ${relatorio.estatisticas.total}`, margin, yPos)
    yPos += 5
    doc.text(
      `Risco Baixo: ${relatorio.estatisticas.porRisco.baixo} | Risco Intermediário: ${relatorio.estatisticas.porRisco.intermediario} | Risco Alto: ${relatorio.estatisticas.porRisco.alto}`,
      margin,
      yPos
    )
    yPos += 8

    // Tabela de gestantes
    const tableData = relatorio.gestantes.map((g) => [
      g.nome || "-",
      g.cartaoSus || "-",
      g.dataNascimento ? new Date(g.dataNascimento).toLocaleDateString("pt-BR") : "-",
      g.idade !== undefined && g.idade !== null ? `${g.idade}` : "-",
      (g.nomeUBS || g.ubs?.nome || "-").substring(0, 20),
      new Date(g.dum).toLocaleDateString("pt-BR"),
      new Date(g.dpp).toLocaleDateString("pt-BR"),
      g.semanasGestacao?.toString() || "-",
      g.etnia || "-",
      g.gestacoesAnteriores?.toString() || "0",
      g.risco || "-",
      g.exameRotina1Trimestre ? "Sim" : "Não",
      g.exameRotina2Trimestre ? "Sim" : "Não",
      g.exameRotina3Trimestre ? "Sim" : "Não",
      g.ultrassom1Trimestre ? "Sim" : "Não",
      g.ultrassom2Trimestre ? "Sim" : "Não",
      g.ultrassom3Trimestre ? "Sim" : "Não",
      g.vacinaHB ? "Sim" : "Não",
      g.vacinaDT ? "Sim" : "Não",
      g.vacinaInfluenza ? "Sim" : "Não",
      g.vacinaCovid19 ? "Sim" : "Não",
      g.vacinaDTPA20Semana ? "Sim" : "Não",
      g.vacinaVSR28Semana ? "Sim" : "Não",
    ])

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          "Nome",
          "Cartão SUS",
          "Nascimento",
          "Idade",
          "UBS",
          "DUM",
          "DPP",
          "Semanas",
          "Etnia",
          "Gest. Ant.",
          "Risco",
          "Ex. Rot. 1º",
          "Ex. Rot. 2º",
          "Ex. Rot. 3º",
          "USG 1º",
          "USG 2º",
          "USG 3º",
          "Vac. HB",
          "Vac. DT",
          "Vac. Inf.",
          "Vac. COVID",
          "Vac. DTPA",
          "Vac. VSR",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [47, 122, 68], textColor: 255, fontStyle: "bold", fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      styles: { cellPadding: 1.5, overflow: "linebreak" },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 20 },
        7: { cellWidth: 15 },
        8: { cellWidth: 20 },
        9: { cellWidth: 15 },
        10: { cellWidth: 15 },
        11: { cellWidth: 15 },
        12: { cellWidth: 15 },
        13: { cellWidth: 15 },
        14: { cellWidth: 15 },
        15: { cellWidth: 15 },
        16: { cellWidth: 15 },
        17: { cellWidth: 15 },
        18: { cellWidth: 15 },
        19: { cellWidth: 15 },
        20: { cellWidth: 15 },
        21: { cellWidth: 15 },
        22: { cellWidth: 15 },
      },
    })

    // Rodapé em todas as páginas
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont("helvetica", "italic")
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - margin,
        { align: "center" }
      )
    }

    // Salvar PDF
    const fileName = `relatorio_gestantes_${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(fileName)
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!session?.user?.isAdmin) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-200">Área Administrativa</h1>
          <p className=" dark:text-gray-100 mt-1">Relatórios customizados de gestantes</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/relatorios">
            <Button variant="outline">Relatório Mensal</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
          <CardDescription>Configure os filtros para gerar relatórios personalizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ubsId">UBS</Label>
              <Select
                value={filtros.ubsId || undefined}
                onValueChange={(value) => setFiltros({ ...filtros, ubsId: value })}
              >
                <SelectTrigger id="ubsId">
                  <SelectValue placeholder="Todas as UBS" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {ubsList.map((ubs) => (
                    <SelectItem key={ubs.id} value={ubs.id}>
                      {ubs.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risco">Nível de Risco</Label>
              <Select
                value={filtros.risco || undefined}
                onValueChange={(value) => setFiltros({ ...filtros, risco: value })}
              >
                <SelectTrigger id="risco">
                  <SelectValue placeholder="Todos os riscos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Risco Baixo">Risco Baixo</SelectItem>
                  <SelectItem value="Risco Intermediário">Risco Intermediário</SelectItem>
                  <SelectItem value="Risco Alto">Risco Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="etnia">Etnia</Label>
              <Select
                value={filtros.etnia || undefined}
                onValueChange={(value) => setFiltros({ ...filtros, etnia: value })}
              >
                <SelectTrigger id="etnia">
                  <SelectValue placeholder="Todas as etnias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Branco">Branco</SelectItem>
                  <SelectItem value="Preto">Preto</SelectItem>
                  <SelectItem value="Pardo">Pardo</SelectItem>
                  <SelectItem value="Indígena">Indígena</SelectItem>
                  <SelectItem value="Amarelo">Amarelo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim (Cadastro)</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              />
            </div>
          </div>

          {/* Filtros Avançados - Datas e Gestação */}
          <div className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
              className="w-full justify-between"
            >
              <span className="font-medium">Filtros Avançados - Datas e Gestação</span>
              {showFiltrosAvancados ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {showFiltrosAvancados && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="dumInicio">DUM Início</Label>
                  <Input
                    id="dumInicio"
                    type="date"
                    value={filtros.dumInicio}
                    onChange={(e) => setFiltros({ ...filtros, dumInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dumFim">DUM Fim</Label>
                  <Input
                    id="dumFim"
                    type="date"
                    value={filtros.dumFim}
                    onChange={(e) => setFiltros({ ...filtros, dumFim: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dppInicio">DPP Início</Label>
                  <Input
                    id="dppInicio"
                    type="date"
                    value={filtros.dppInicio}
                    onChange={(e) => setFiltros({ ...filtros, dppInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dppFim">DPP Fim</Label>
                  <Input
                    id="dppFim"
                    type="date"
                    value={filtros.dppFim}
                    onChange={(e) => setFiltros({ ...filtros, dppFim: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gestacoesMin">Gestações Anteriores (Mín)</Label>
                  <Input
                    id="gestacoesMin"
                    type="number"
                    min="0"
                    value={filtros.gestacoesMin}
                    onChange={(e) => setFiltros({ ...filtros, gestacoesMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gestacoesMax">Gestações Anteriores (Máx)</Label>
                  <Input
                    id="gestacoesMax"
                    type="number"
                    min="0"
                    value={filtros.gestacoesMax}
                    onChange={(e) => setFiltros({ ...filtros, gestacoesMax: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semanasMin">Semanas de Gestação (Mín)</Label>
                  <Input
                    id="semanasMin"
                    type="number"
                    min="0"
                    max="42"
                    value={filtros.semanasMin}
                    onChange={(e) => setFiltros({ ...filtros, semanasMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semanasMax">Semanas de Gestação (Máx)</Label>
                  <Input
                    id="semanasMax"
                    type="number"
                    min="0"
                    max="42"
                    value={filtros.semanasMax}
                    onChange={(e) => setFiltros({ ...filtros, semanasMax: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idadeMin">Idade (Mín)</Label>
                  <Input
                    id="idadeMin"
                    type="number"
                    min="10"
                    max="60"
                    value={filtros.idadeMin}
                    onChange={(e) => setFiltros({ ...filtros, idadeMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idadeMax">Idade (Máx)</Label>
                  <Input
                    id="idadeMax"
                    type="number"
                    min="10"
                    max="60"
                    value={filtros.idadeMax}
                    onChange={(e) => setFiltros({ ...filtros, idadeMax: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partoEsteMes">Parto Este Mês</Label>
                  <Select
                    value={filtros.partoEsteMes ? filtros.partoEsteMes : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, partoEsteMes: value === "none" ? "" : value, partoProximos3Meses: "" })}
                  >
                    <SelectTrigger id="partoEsteMes">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partoProximos3Meses">Parto Próximos 3 Meses</Label>
                  <Select
                    value={filtros.partoProximos3Meses ? filtros.partoProximos3Meses : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, partoProximos3Meses: value === "none" ? "" : value, partoEsteMes: "" })}
                  >
                    <SelectTrigger id="partoProximos3Meses">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Filtros de Exames */}
          <div className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowFiltrosExames(!showFiltrosExames)}
              className="w-full justify-between"
            >
              <span className="font-medium">Filtros de Exames</span>
              {showFiltrosExames ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {showFiltrosExames && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="exameRotina1Trimestre">Exame Rotina 1º Trimestre</Label>
                  <Select
                    value={filtros.exameRotina1Trimestre ? filtros.exameRotina1Trimestre : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, exameRotina1Trimestre: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="exameRotina1Trimestre">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Realizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exameRotina2Trimestre">Exame Rotina 2º Trimestre</Label>
                  <Select
                    value={filtros.exameRotina2Trimestre ? filtros.exameRotina2Trimestre : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, exameRotina2Trimestre: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="exameRotina2Trimestre">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Realizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exameRotina3Trimestre">Exame Rotina 3º Trimestre</Label>
                  <Select
                    value={filtros.exameRotina3Trimestre ? filtros.exameRotina3Trimestre : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, exameRotina3Trimestre: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="exameRotina3Trimestre">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Realizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ultrassom1Trimestre">Ultrassom 1º Trimestre</Label>
                  <Select
                    value={filtros.ultrassom1Trimestre ? filtros.ultrassom1Trimestre : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, ultrassom1Trimestre: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="ultrassom1Trimestre">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Realizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ultrassom2Trimestre">Ultrassom 2º Trimestre</Label>
                  <Select
                    value={filtros.ultrassom2Trimestre ? filtros.ultrassom2Trimestre : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, ultrassom2Trimestre: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="ultrassom2Trimestre">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Realizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ultrassom3Trimestre">Ultrassom 3º Trimestre</Label>
                  <Select
                    value={filtros.ultrassom3Trimestre ? filtros.ultrassom3Trimestre : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, ultrassom3Trimestre: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="ultrassom3Trimestre">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Realizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Filtros de Vacinas */}
          <div className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowFiltrosVacinas(!showFiltrosVacinas)}
              className="w-full justify-between"
            >
              <span className="font-medium">Filtros de Vacinas</span>
              {showFiltrosVacinas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {showFiltrosVacinas && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="vacinaHB">Vacina HB</Label>
                  <Select
                    value={filtros.vacinaHB ? filtros.vacinaHB : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, vacinaHB: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="vacinaHB">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Aplicada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacinaDT">Vacina DT</Label>
                  <Select
                    value={filtros.vacinaDT ? filtros.vacinaDT : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, vacinaDT: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="vacinaDT">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Aplicada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacinaInfluenza">Vacina Influenza</Label>
                  <Select
                    value={filtros.vacinaInfluenza ? filtros.vacinaInfluenza : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, vacinaInfluenza: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="vacinaInfluenza">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Aplicada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacinaCovid19">Vacina COVID-19</Label>
                  <Select
                    value={filtros.vacinaCovid19 ? filtros.vacinaCovid19 : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, vacinaCovid19: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="vacinaCovid19">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Aplicada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacinaDTPA20Semana">Vacina DTPA (20 semanas)</Label>
                  <Select
                    value={filtros.vacinaDTPA20Semana ? filtros.vacinaDTPA20Semana : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, vacinaDTPA20Semana: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="vacinaDTPA20Semana">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Aplicada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacinaVSR28Semana">Vacina VSR (28 semanas)</Label>
                  <Select
                    value={filtros.vacinaVSR28Semana ? filtros.vacinaVSR28Semana : undefined}
                    onValueChange={(value) => setFiltros({ ...filtros, vacinaVSR28Semana: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="vacinaVSR28Semana">
                      <SelectValue placeholder="Não filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não filtrar</SelectItem>
                      <SelectItem value="true">Aplicada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-6">
            <Button onClick={gerarRelatorio} disabled={loading} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {loading ? "Gerando..." : "Gerar Relatório"}
            </Button>
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {relatorio && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Estatísticas do Relatório</CardTitle>
                  <CardDescription>
                    {relatorio.estatisticas.total} gestante(s) encontrada(s)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportarPDF} variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                  <Button onClick={exportarCSV} variant="outline" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {relatorio.estatisticas.total}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Risco Baixo</p>
                    <p className="text-2xl font-bold text-green-600">
                      {relatorio.estatisticas.porRisco.baixo}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Risco Intermediário</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {relatorio.estatisticas.porRisco.intermediario}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Risco Alto</p>
                    <p className="text-2xl font-bold text-red-600">
                      {relatorio.estatisticas.porRisco.alto}
                    </p>
                  </div>
                </div>
                {relatorio.estatisticas.exames && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600">Ex. Rotina 1º</p>
                      <p className="text-lg font-bold text-purple-600">
                        {relatorio.estatisticas.exames.exameRotina1Trimestre}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600">Ex. Rotina 2º</p>
                      <p className="text-lg font-bold text-purple-600">
                        {relatorio.estatisticas.exames.exameRotina2Trimestre}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600">Ex. Rotina 3º</p>
                      <p className="text-lg font-bold text-purple-600">
                        {relatorio.estatisticas.exames.exameRotina3Trimestre}
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-gray-600">USG 1º</p>
                      <p className="text-lg font-bold text-indigo-600">
                        {relatorio.estatisticas.exames.ultrassom1Trimestre}
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-gray-600">USG 2º</p>
                      <p className="text-lg font-bold text-indigo-600">
                        {relatorio.estatisticas.exames.ultrassom2Trimestre}
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-gray-600">USG 3º</p>
                      <p className="text-lg font-bold text-indigo-600">
                        {relatorio.estatisticas.exames.ultrassom3Trimestre}
                      </p>
                    </div>
                  </div>
                )}
                {relatorio.estatisticas.vacinas && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-xs text-gray-600">Vacina HB</p>
                      <p className="text-lg font-bold text-teal-600">
                        {relatorio.estatisticas.vacinas.vacinaHB}
                      </p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-xs text-gray-600">Vacina DT</p>
                      <p className="text-lg font-bold text-teal-600">
                        {relatorio.estatisticas.vacinas.vacinaDT}
                      </p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-xs text-gray-600">Vacina Influenza</p>
                      <p className="text-lg font-bold text-teal-600">
                        {relatorio.estatisticas.vacinas.vacinaInfluenza}
                      </p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-xs text-gray-600">Vacina COVID-19</p>
                      <p className="text-lg font-bold text-teal-600">
                        {relatorio.estatisticas.vacinas.vacinaCovid19}
                      </p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-xs text-gray-600">Vacina DTPA</p>
                      <p className="text-lg font-bold text-teal-600">
                        {relatorio.estatisticas.vacinas.vacinaDTPA20Semana}
                      </p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-xs text-gray-600">Vacina VSR</p>
                      <p className="text-lg font-bold text-teal-600">
                        {relatorio.estatisticas.vacinas.vacinaVSR28Semana}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Gestantes */}
          <Card>
            <CardHeader>
              <CardTitle>Gestantes do Relatório</CardTitle>
              <CardDescription>
                Role horizontalmente para ver todas as informações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1400px]">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2 font-semibold text-sm sticky left-0 bg-gray-50 z-10">Nome</th>
                      <th className="text-left p-2 font-semibold text-sm">Cartão SUS</th>
                      <th className="text-left p-2 font-semibold text-sm">Nascimento</th>
                      <th className="text-left p-2 font-semibold text-sm">Idade</th>
                      <th className="text-left p-2 font-semibold text-sm">UBS</th>
                      <th className="text-left p-2 font-semibold text-sm">DUM</th>
                      <th className="text-left p-2 font-semibold text-sm">DPP</th>
                      <th className="text-left p-2 font-semibold text-sm">Semanas</th>
                      <th className="text-left p-2 font-semibold text-sm">Etnia</th>
                      <th className="text-left p-2 font-semibold text-sm">Gest. Ant.</th>
                      <th className="text-left p-2 font-semibold text-sm">Risco</th>
                      <th className="text-left p-2 font-semibold text-sm">Ex. Rot. 1º</th>
                      <th className="text-left p-2 font-semibold text-sm">Ex. Rot. 2º</th>
                      <th className="text-left p-2 font-semibold text-sm">Ex. Rot. 3º</th>
                      <th className="text-left p-2 font-semibold text-sm">USG 1º</th>
                      <th className="text-left p-2 font-semibold text-sm">USG 2º</th>
                      <th className="text-left p-2 font-semibold text-sm">USG 3º</th>
                      <th className="text-left p-2 font-semibold text-sm">Vac. HB</th>
                      <th className="text-left p-2 font-semibold text-sm">Vac. DT</th>
                      <th className="text-left p-2 font-semibold text-sm">Vac. Inf.</th>
                      <th className="text-left p-2 font-semibold text-sm">Vac. COVID</th>
                      <th className="text-left p-2 font-semibold text-sm">Vac. DTPA</th>
                      <th className="text-left p-2 font-semibold text-sm">Vac. VSR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.gestantes.map((gestante) => (
                      <tr key={gestante.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium sticky left-0 bg-white z-10">{gestante.nome}</td>
                        <td className="p-2 text-sm">{gestante.cartaoSus}</td>
                        <td className="p-2 text-sm">
                          {gestante.dataNascimento
                            ? new Date(gestante.dataNascimento).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>
                        <td className="p-2 text-sm">{gestante.idade ?? "-"}</td>
                        <td className="p-2 text-sm">{gestante.nomeUBS || gestante.ubs?.nome || "-"}</td>
                        <td className="p-2 text-sm">
                          {new Date(gestante.dum).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="p-2 text-sm">
                          {new Date(gestante.dpp).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="p-2 text-sm font-medium">
                          {gestante.semanasGestacao !== undefined ? `${gestante.semanasGestacao} sem` : "-"}
                        </td>
                        <td className="p-2 text-sm">{gestante.etnia}</td>
                        <td className="p-2 text-sm text-center">{gestante.gestacoesAnteriores}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              gestante.risco === "Risco Alto"
                                ? "bg-red-100 text-red-800"
                                : gestante.risco === "Risco Intermediário"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {gestante.risco}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          {gestante.exameRotina1Trimestre ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gestante.exameRotina2Trimestre ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gestante.exameRotina3Trimestre ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gestante.ultrassom1Trimestre ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gestante.ultrassom2Trimestre ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gestante.ultrassom3Trimestre ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gestante.vacinaHB ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gestante.vacinaDT ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gestante.vacinaInfluenza ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gestante.vacinaCovid19 ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gestante.vacinaDTPA20Semana ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gestante.vacinaVSR28Semana ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

