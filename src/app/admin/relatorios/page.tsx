"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Printer, UserPlus, FileEdit, Baby, Syringe } from "lucide-react"
import Link from "next/link"
import { getMunicipio } from "@/lib/municipio"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

interface PlanilhaMonitoramento {
  gestantesEstimadas: number
  totalGestantesAteOMomento: number
  nascidosNoAno: number
  obitosFetaisNoAno: number
  obitosInfantisNoAno: number
  obitosMaternosNoAno: number
  acompanhadasPreNatalUbs: number
  captadasAte12Semanas: number
  comMinimo7Consultas: number
  exames1Trimestre: number
  exames3Trimestre: number
  testesRapidos1Trimestre: number
  testesRapidos3Trimestre: number
  estratificadas: number
  riscoBaixo: number
  riscoIntermediario: number
  riscoAlto: number
  comPlanoDeCuidados: number
  emGestaoDeCaso: number
  riscoIntermediarioCompartilhadas: { policlinica: number; ambulatorioMunicipal: number }
  riscoIntermediarioAguardandoVaga: { policlinica: number; ambulatorioMunicipal: number }
  mediaDiasAcessoRiscoIntermediario: { policlinica: number | null; ambulatorioMunicipal: number | null }
  riscoAltoCompartilhadas: { policlinica: number; ambulatorioMunicipal: number }
  riscoAltoAguardandoVaga: { policlinica: number; ambulatorioMunicipal: number }
  mediaDiasAcessoRiscoAlto: { policlinica: number | null; ambulatorioMunicipal: number | null }
  vinculadasMaternidade: number
}

interface RelatorioMensalData {
  periodo: { mes: number; ano: number; nomeMes: string }
  resumo: {
    novosCadastros: number
    prontuariosAtualizados: number
    partosNoMes: number
    totalExamesVacinas: number
  }
  porRisco: { baixo: number; intermediario: number; alto: number }
  porEtnia: { etnia: string; quantidade: number }[]
  porUBS: { ubs: string; quantidade: number }[]
  examesPorTipo: { tipo: string; quantidade: number; percentual: string }[]
  planilhaMonitoramento: PlanilhaMonitoramento
}

export default function RelatoriosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [relatorio, setRelatorio] = useState<RelatorioMensalData | null>(null)
  const [mes, setMes] = useState(() => (new Date().getMonth() + 1).toString())
  const [ano, setAno] = useState(() => new Date().getFullYear().toString())
  const [gestantesEstimadas, setGestantesEstimadas] = useState("0")
  const [savingEstimadas, setSavingEstimadas] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/")
      return
    }
  }, [status, session, router])

  const gerarRelatorio = async () => {
    setLoading(true)
    setRelatorio(null)
    try {
      const params = new URLSearchParams({ mes, ano })
      const response = await fetch(`/api/admin/relatorios/mensal?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRelatorio(data)
        if (data.planilhaMonitoramento) {
          setGestantesEstimadas(String(data.planilhaMonitoramento.gestantesEstimadas ?? 0))
        }
      } else {
        const err = await response.json()
        alert(err.error || "Erro ao gerar relatório")
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      alert("Erro ao gerar relatório")
    }     finally {
      setLoading(false)
    }
  }

  const salvarEstimadas = async () => {
    const valor = Number(gestantesEstimadas)
    if (!Number.isInteger(valor) || valor < 0) {
      alert("Informe um número válido de gestantes estimadas.")
      return
    }
    setSavingEstimadas(true)
    try {
      const response = await fetch("/api/admin/indicadores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano: Number(ano), gestantesEstimadas: valor }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Erro ao salvar")
      }
      await gerarRelatorio()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Erro ao salvar gestantes estimadas")
    } finally {
      setSavingEstimadas(false)
    }
  }

  const mediaLabel = (valor: number | null | undefined) => (valor == null ? "—" : String(valor))

  const imprimirOuPDF = () => {
    if (!relatorio) return

    const doc = new jsPDF("portrait", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    let yPos = margin

    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text(
      `Relatório Mensal - ${relatorio.periodo.nomeMes} de ${relatorio.periodo.ano}`,
      pageWidth / 2,
      yPos,
      { align: "center" }
    )
    yPos += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth / 2,
      yPos,
      { align: "center" }
    )
    yPos += 14

    // Resumo
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Resumo do Mês", margin, yPos)
    yPos += 6
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`• Novos cadastros: ${relatorio.resumo.novosCadastros} gestante(s)`, margin, yPos)
    yPos += 5
    doc.text(`• Prontuários atualizados: ${relatorio.resumo.prontuariosAtualizados}`, margin, yPos)
    yPos += 5
    doc.text(`• Partos no mês: ${relatorio.resumo.partosNoMes}`, margin, yPos)
    yPos += 5
    doc.text(`• Exames e vacinas realizados: ${relatorio.resumo.totalExamesVacinas}`, margin, yPos)
    yPos += 12

    if (relatorio.planilhaMonitoramento) {
      const p = relatorio.planilhaMonitoramento
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`Planilha de monitoramento (${getMunicipio().nome})`, margin, yPos)
      yPos += 6

      autoTable(doc, {
        startY: yPos,
        head: [["Indicador", "Valor"]],
        body: [
          ["Gestantes estimadas no ano", String(p.gestantesEstimadas)],
          ["Total de gestantes até o momento", String(p.totalGestantesAteOMomento)],
          ["Nascidos no ano", String(p.nascidosNoAno)],
          ["Óbitos fetais no ano", String(p.obitosFetaisNoAno)],
          ["Óbitos infantis no ano", String(p.obitosInfantisNoAno)],
          ["Óbitos maternos no ano", String(p.obitosMaternosNoAno)],
          ["Acompanhadas no pré-natal na UBS", String(p.acompanhadasPreNatalUbs)],
          ["Captadas até a 12ª semana", String(p.captadasAte12Semanas)],
          ["Com no mínimo 7 consultas", String(p.comMinimo7Consultas)],
          ["Exames realizados 1º trimestre", String(p.exames1Trimestre)],
          ["Exames realizados 3º trimestre", String(p.exames3Trimestre)],
          ["Testes rápidos 1º trimestre", String(p.testesRapidos1Trimestre)],
          ["Testes rápidos 3º trimestre", String(p.testesRapidos3Trimestre)],
          ["Estratificadas", String(p.estratificadas)],
          ["Baixo risco", String(p.riscoBaixo)],
          ["Risco intermediário", String(p.riscoIntermediario)],
          ["Alto risco", String(p.riscoAlto)],
          ["Com plano de cuidados", String(p.comPlanoDeCuidados)],
          ["Em gestão de caso", String(p.emGestaoDeCaso)],
          ["RI compartilhada - Policlínica", String(p.riscoIntermediarioCompartilhadas.policlinica)],
          ["RI compartilhada - Ambulatório Municipal", String(p.riscoIntermediarioCompartilhadas.ambulatorioMunicipal)],
          ["RI aguardando vaga - Policlínica", String(p.riscoIntermediarioAguardandoVaga.policlinica)],
          ["RI aguardando vaga - Ambulatório Municipal", String(p.riscoIntermediarioAguardandoVaga.ambulatorioMunicipal)],
          ["Média dias acesso RI - Policlínica", mediaLabel(p.mediaDiasAcessoRiscoIntermediario.policlinica)],
          ["Média dias acesso RI - Ambulatório Municipal", mediaLabel(p.mediaDiasAcessoRiscoIntermediario.ambulatorioMunicipal)],
          ["AR compartilhada - Policlínica", String(p.riscoAltoCompartilhadas.policlinica)],
          ["AR compartilhada - Ambulatório Municipal", String(p.riscoAltoCompartilhadas.ambulatorioMunicipal)],
          ["AR aguardando vaga - Policlínica", String(p.riscoAltoAguardandoVaga.policlinica)],
          ["AR aguardando vaga - Ambulatório Municipal", String(p.riscoAltoAguardandoVaga.ambulatorioMunicipal)],
          ["Média dias acesso AR - Policlínica", mediaLabel(p.mediaDiasAcessoRiscoAlto.policlinica)],
          ["Média dias acesso AR - Ambulatório Municipal", mediaLabel(p.mediaDiasAcessoRiscoAlto.ambulatorioMunicipal)],
          ["Vinculadas à maternidade", String(p.vinculadasMaternidade)],
        ],
        theme: "striped",
        headStyles: { fillColor: [47, 122, 68], textColor: 255, fontStyle: "bold" },
        margin: { left: margin, right: margin },
      })
      const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      yPos = (lastTable?.finalY ?? yPos) + 10
    }

    // Por risco
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Gestantes por Risco (novos cadastros)", margin, yPos)
    yPos += 6
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Baixo: ${relatorio.porRisco.baixo} | Intermediário: ${relatorio.porRisco.intermediario} | Alto: ${relatorio.porRisco.alto}`, margin, yPos)
    yPos += 10

    // Por etnia (se houver)
    if (relatorio.porEtnia.length > 0) {
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Por Etnia", margin, yPos)
      yPos += 6
      relatorio.porEtnia.forEach((e) => {
        doc.setFont("helvetica", "normal")
        doc.text(`• ${e.etnia}: ${e.quantidade}`, margin, yPos)
        yPos += 5
      })
      yPos += 5
    }

    // Exames por tipo
    if (relatorio.examesPorTipo.length > 0) {
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Exames e Vacinas por Tipo", margin, yPos)
      yPos += 6

      const tableData = relatorio.examesPorTipo.map((item) => [
        item.tipo,
        String(item.quantidade),
        `${item.percentual}%`,
      ])

      autoTable(doc, {
        startY: yPos,
        head: [["TIPO", "QUANTIDADE", "PERCENTUAL"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [47, 122, 68], textColor: 255, fontStyle: "bold" },
        margin: { left: margin, right: margin },
      })
    }

    doc.save(`relatorio_mensal_${relatorio.periodo.mes}_${relatorio.periodo.ano}.pdf`)
  }

  const anos = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i)

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!session?.user?.isAdmin) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Gere relatórios mensais de tudo que aconteceu no período
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Voltar ao Admin</Button>
        </Link>
      </div>

      {/* Selecionar Período */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Período</CardTitle>
          <CardDescription>Escolha o mês e ano para gerar o relatório</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 min-w-[140px]">
              <label className="text-sm font-medium">Mês</label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((nome, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 min-w-[120px]">
              <label className="text-sm font-medium">Ano</label>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={String(a)}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={gerarRelatorio} disabled={loading} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {loading ? "Gerando..." : "Gerar Relatório"}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div className="space-y-2 min-w-[220px]">
              <label className="text-sm font-medium">Gestantes estimadas no ano</label>
              <Input
                type="number"
                min="0"
                value={gestantesEstimadas}
                onChange={(e) => setGestantesEstimadas(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" onClick={salvarEstimadas} disabled={savingEstimadas}>
              {savingEstimadas ? "Salvando..." : "Salvar estimativa do ano"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Relatório gerado */}
      {relatorio && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Relatório - {relatorio.periodo.nomeMes} de {relatorio.periodo.ano}</CardTitle>
                <CardDescription>Resumo completo do que aconteceu no mês</CardDescription>
              </div>
              <Button onClick={imprimirOuPDF} variant="outline" className="gap-2 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 border-green-200 dark:border-green-800">
                <Printer className="h-4 w-4" />
                Imprimir/PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {relatorio.planilhaMonitoramento && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Planilha de monitoramento — {getMunicipio().nome}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Totais acumulados até {relatorio.periodo.nomeMes}/{relatorio.periodo.ano}, no formato da planilha oficial.
                </p>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <tbody>
                      {[
                        ["Gestantes estimadas no ano", relatorio.planilhaMonitoramento.gestantesEstimadas],
                        ["Total de gestantes até o momento", relatorio.planilhaMonitoramento.totalGestantesAteOMomento],
                        ["Nascidos no ano", relatorio.planilhaMonitoramento.nascidosNoAno],
                        ["Óbitos fetais no ano", relatorio.planilhaMonitoramento.obitosFetaisNoAno],
                        ["Óbitos infantis no ano", relatorio.planilhaMonitoramento.obitosInfantisNoAno],
                        ["Óbitos maternos no ano", relatorio.planilhaMonitoramento.obitosMaternosNoAno],
                        ["Acompanhadas no pré-natal na UBS no momento", relatorio.planilhaMonitoramento.acompanhadasPreNatalUbs],
                        ["Captadas até a 12ª semana", relatorio.planilhaMonitoramento.captadasAte12Semanas],
                        ["Com no mínimo 7 consultas", relatorio.planilhaMonitoramento.comMinimo7Consultas],
                        ["Exames realizados 1º trimestre", relatorio.planilhaMonitoramento.exames1Trimestre],
                        ["Exames realizados 3º trimestre", relatorio.planilhaMonitoramento.exames3Trimestre],
                        ["Testes rápidos 1º trimestre", relatorio.planilhaMonitoramento.testesRapidos1Trimestre],
                        ["Testes rápidos 3º trimestre", relatorio.planilhaMonitoramento.testesRapidos3Trimestre],
                        ["Estratificadas", relatorio.planilhaMonitoramento.estratificadas],
                        ["Baixo risco", relatorio.planilhaMonitoramento.riscoBaixo],
                        ["Risco intermediário", relatorio.planilhaMonitoramento.riscoIntermediario],
                        ["Alto risco", relatorio.planilhaMonitoramento.riscoAlto],
                        ["Com plano de cuidados", relatorio.planilhaMonitoramento.comPlanoDeCuidados],
                        ["Em gestão de caso", relatorio.planilhaMonitoramento.emGestaoDeCaso],
                        ["RI compartilhada — Policlínica", relatorio.planilhaMonitoramento.riscoIntermediarioCompartilhadas.policlinica],
                        ["RI compartilhada — Ambulatório Municipal", relatorio.planilhaMonitoramento.riscoIntermediarioCompartilhadas.ambulatorioMunicipal],
                        ["RI aguardando vaga — Policlínica", relatorio.planilhaMonitoramento.riscoIntermediarioAguardandoVaga.policlinica],
                        ["RI aguardando vaga — Ambulatório Municipal", relatorio.planilhaMonitoramento.riscoIntermediarioAguardandoVaga.ambulatorioMunicipal],
                        ["Média de dias de acesso RI — Policlínica", mediaLabel(relatorio.planilhaMonitoramento.mediaDiasAcessoRiscoIntermediario.policlinica)],
                        ["Média de dias de acesso RI — Ambulatório Municipal", mediaLabel(relatorio.planilhaMonitoramento.mediaDiasAcessoRiscoIntermediario.ambulatorioMunicipal)],
                        ["AR compartilhada — Policlínica", relatorio.planilhaMonitoramento.riscoAltoCompartilhadas.policlinica],
                        ["AR compartilhada — Ambulatório Municipal", relatorio.planilhaMonitoramento.riscoAltoCompartilhadas.ambulatorioMunicipal],
                        ["AR aguardando vaga — Policlínica", relatorio.planilhaMonitoramento.riscoAltoAguardandoVaga.policlinica],
                        ["AR aguardando vaga — Ambulatório Municipal", relatorio.planilhaMonitoramento.riscoAltoAguardandoVaga.ambulatorioMunicipal],
                        ["Média de dias de acesso AR — Policlínica", mediaLabel(relatorio.planilhaMonitoramento.mediaDiasAcessoRiscoAlto.policlinica)],
                        ["Média de dias de acesso AR — Ambulatório Municipal", mediaLabel(relatorio.planilhaMonitoramento.mediaDiasAcessoRiscoAlto.ambulatorioMunicipal)],
                        ["Vinculadas à maternidade", relatorio.planilhaMonitoramento.vinculadasMaternidade],
                      ].map(([label, valor]) => (
                        <tr key={String(label)} className="border-t">
                          <td className="p-3 text-muted-foreground">{label}</td>
                          <td className="p-3 text-right font-semibold">{valor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resumo do mês */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Resumo do Mês</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <UserPlus className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Novos Cadastros</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{relatorio.resumo.novosCadastros}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <FileEdit className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Prontuários Atualizados</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{relatorio.resumo.prontuariosAtualizados}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <Baby className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Partos no Mês</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{relatorio.resumo.partosNoMes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800">
                  <Syringe className="h-7 w-7 text-[#EC008C]" />
                  <div>
                    <p className="text-xs font-medium text-pink-800 dark:text-pink-200">Exames e Vacinas</p>
                    <p className="text-xl font-bold text-[#EC008C]">{relatorio.resumo.totalExamesVacinas}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Por risco e etnia */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">Gestantes por Risco (novos cadastros)</h3>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-200 text-sm">
                    Baixo: {relatorio.porRisco.baixo}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-200 text-sm">
                    Intermediário: {relatorio.porRisco.intermediario}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 text-sm">
                    Alto: {relatorio.porRisco.alto}
                  </span>
                </div>
              </div>
              {relatorio.porEtnia.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Por Etnia</h3>
                  <div className="flex flex-wrap gap-2">
                    {relatorio.porEtnia.map((e) => (
                      <span key={e.etnia} className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm">
                        {e.etnia}: {e.quantidade}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Por UBS */}
            {relatorio.porUBS.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Cadastros por UBS</h3>
                <div className="flex flex-wrap gap-2">
                  {relatorio.porUBS.map((u) => (
                    <span key={u.ubs} className="px-3 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-200 text-sm">
                      {u.ubs}: {u.quantidade}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Exames e vacinas por tipo */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Exames e Vacinas por Tipo</h3>
              {relatorio.examesPorTipo.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-3 font-semibold">TIPO</th>
                        <th className="text-right p-3 font-semibold">QUANTIDADE</th>
                        <th className="text-right p-3 font-semibold">PERCENTUAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorio.examesPorTipo.map((item) => (
                        <tr key={item.tipo} className="border-t">
                          <td className="p-3">{item.tipo}</td>
                          <td className="p-3 text-right font-medium">{item.quantidade}</td>
                          <td className="p-3 text-right">{item.percentual}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground py-4">Nenhum exame ou vacina registrado entre as gestantes cadastradas no período.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
