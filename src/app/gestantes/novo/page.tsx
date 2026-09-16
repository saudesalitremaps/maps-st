"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { addDays, format } from "date-fns"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import {
  formatCartaoSus,
  formatTelefone,
  sanitizeCartaoSus,
  sanitizeTelefone,
} from "@/lib/formatters"
import type { UBS } from "@/types/gestante"
import {
  CAMPOS_PLANILHA_INICIAL,
  MonitoramentoPlanilhaFields,
} from "@/components/gestante/monitoramento-planilha-fields"

export default function NovaGestantePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.isAdmin ?? false
  const [loading, setLoading] = useState(false)
  const [ubsList, setUbsList] = useState<UBS[]>([])
  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "",
    cartaoSus: "",
    telefone: "",
    ubsId: "",
    dum: "",
    dpp: "",
    semanasInicioPreNatal: "",
    etnia: "",
    gestacoesAnteriores: "0",
    risco: "",
    descricaoRisco: "",
    motivoAltoRisco: "",
    exames: {
      rotina1: false,
      rotina2: false,
      rotina3: false,
      ultrassom1: false,
      ultrassom2: false,
      ultrassom3: false,
    },
    vacinas: {
      hb: false,
      dt: false,
      influenza: false,
      covid19: false,
      dtpa20Semana: false,
      vsr28Semana: false,
    },
    ...CAMPOS_PLANILHA_INICIAL,
  })

  useEffect(() => {
    fetchUBS()
  }, [])

  useEffect(() => {
    if (!isAdmin && session?.user?.ubsId) {
      setFormData((prev) => ({ ...prev, ubsId: session.user.ubsId! }))
    }
  }, [isAdmin, session?.user?.ubsId])

  const fetchUBS = async () => {
    try {
      const response = await fetch("/api/ubs")
      if (response.ok) {
        const ubs = await response.json()
        setUbsList(ubs)
      }
    } catch (error) {
      console.error("Erro ao buscar UBS:", error)
    }
  }

  const handleCartaoSusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      cartaoSus: formatCartaoSus(e.target.value),
    })
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      telefone: formatTelefone(e.target.value),
    })
  }

  const handleDumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dum = e.target.value
    if (dum) {
      const dpp = addDays(new Date(dum), 280)
      setFormData({
        ...formData,
        dum,
        dpp: format(dpp, "yyyy-MM-dd"),
      })
    } else {
      setFormData({
        ...formData,
        dum,
        dpp: "",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cartaoSus = sanitizeCartaoSus(formData.cartaoSus)
    const telefone = sanitizeTelefone(formData.telefone)

    // Validações
    if (!formData.nome || !formData.dataNascimento || !cartaoSus || !formData.dum || !formData.semanasInicioPreNatal || !formData.etnia || !formData.risco) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    if (isAdmin && !formData.ubsId) {
      alert("Por favor, selecione a UBS.")
      return
    }

    const semanasInicioPreNatalNumero = Number(formData.semanasInicioPreNatal)
    if (!Number.isInteger(semanasInicioPreNatalNumero) || semanasInicioPreNatalNumero < 1 || semanasInicioPreNatalNumero > 45) {
      alert("Semanas de início do pré-natal inválida. Informe um valor entre 1 e 45.")
      return
    }

    if (telefone && (telefone.length < 10 || telefone.length > 11)) {
      alert("Telefone inválido. Informe DDD + número com 10 ou 11 dígitos.")
      return
    }

    if (formData.risco === "Risco Alto" && !formData.motivoAltoRisco) {
      alert("Por favor, informe o motivo do alto risco.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/gestantes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          cartaoSus,
          telefone,
        }),
      })

      if (response.ok) {
        router.push("/")
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Erro ao salvar: ${error.error}`)
      }
    } catch (error) {
      console.error("Erro ao salvar gestante:", error)
      alert("Erro ao salvar gestante. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cadastrar Nova Gestante</h1>
          <p className="text-gray-600 mt-1">Preencha os dados da gestante</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Identificação e Datas */}
        <Card>
          <CardHeader>
            <CardTitle>Identificação e Datas</CardTitle>
            <CardDescription>Dados básicos da gestante</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Gestante *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cartaoSus">Cartão do SUS *</Label>
              <Input
                id="cartaoSus"
                value={formData.cartaoSus}
                onChange={handleCartaoSusChange}
                placeholder="Digite o número do cartão do SUS"
                required
                maxLength={18}
              />
              <p className="text-xs text-gray-500">
                Número do cartão do SUS (obrigatório e único)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                value={formData.telefone}
                onChange={handleTelefoneChange}
                placeholder="(99) 99999-9999"
                maxLength={16}
              />
              <p className="text-xs text-gray-500">
                Opcional. Informe o telefone com DDD (10 ou 11 dígitos) se disponível.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubsId">UBS *</Label>
              {isAdmin ? (
                <Select
                  value={formData.ubsId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, ubsId: value })}
                  required
                >
                  <SelectTrigger id="ubsId">
                    <SelectValue placeholder="Selecione a UBS" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {ubsList.map((ubs) => (
                      <SelectItem key={ubs.id} value={ubs.id}>
                        {ubs.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="ubsId"
                  value={ubsList.find((u) => u.id === formData.ubsId)?.nome ?? "Carregando..."}
                  disabled
                  className="bg-gray-50"
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dum">DUM (Data da Última Menstruação) *</Label>
                <Input
                  id="dum"
                  type="date"
                  value={formData.dum}
                  onChange={handleDumChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dpp">DPP (Data Provável do Parto)</Label>
                <Input
                  id="dpp"
                  type="date"
                  value={formData.dpp}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Calculado automaticamente (DUM + 280 dias)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semanasInicioPreNatal">Semanas no início do pré-natal *</Label>
              <Input
                id="semanasInicioPreNatal"
                type="number"
                min="1"
                max="45"
                value={formData.semanasInicioPreNatal}
                onChange={(e) =>
                  setFormData({ ...formData, semanasInicioPreNatal: e.target.value })
                }
                placeholder="Ex: 12"
                required
              />
              <p className="text-xs text-gray-500">
                Informe com quantas semanas gestacionais iniciou o acompanhamento pré-natal.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Dados Sociais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Sociais</CardTitle>
            <CardDescription>Informações demográficas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="etnia">Etnia *</Label>
              <Select
                value={formData.etnia}
                onValueChange={(value) => setFormData({ ...formData, etnia: value })}
                required
              >
                <SelectTrigger id="etnia">
                  <SelectValue placeholder="Selecione a etnia" />
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
          </CardContent>
        </Card>

        {/* 3. Classificação de Risco */}
        <Card>
          <CardHeader>
            <CardTitle>Classificação de Risco</CardTitle>
            <CardDescription>Classifique o risco da gestação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risco">Nível de Risco *</Label>
                <Select
                  value={formData.risco}
                  onValueChange={(value) => setFormData({ ...formData, risco: value })}
                  required
                >
                  <SelectTrigger id="risco">
                    <SelectValue placeholder="Selecione o risco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Risco Baixo">Risco Baixo</SelectItem>
                    <SelectItem value="Risco Intermediário">Risco Intermediário</SelectItem>
                    <SelectItem value="Risco Alto">Risco Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gestacoesAnteriores">Gestações Anteriores (Quantas?)</Label>
                <Input
                  id="gestacoesAnteriores"
                  type="number"
                  min="0"
                  value={formData.gestacoesAnteriores}
                  onChange={(e) =>
                    setFormData({ ...formData, gestacoesAnteriores: e.target.value })
                  }
                />
              </div>
            </div>

            {formData.risco === "Risco Intermediário" && (
              <div className="space-y-2">
                <Label htmlFor="descricaoRisco">Descrição/Observação</Label>
                <Input
                  id="descricaoRisco"
                  value={formData.descricaoRisco}
                  onChange={(e) =>
                    setFormData({ ...formData, descricaoRisco: e.target.value })
                  }
                  placeholder="Descreva o motivo do risco intermediário"
                />
              </div>
            )}

            {formData.risco === "Risco Alto" && (
              <div className="space-y-2">
                <Label htmlFor="motivoAltoRisco">Porquê? (Motivo do alto risco) *</Label>
                <Input
                  id="motivoAltoRisco"
                  value={formData.motivoAltoRisco}
                  onChange={(e) =>
                    setFormData({ ...formData, motivoAltoRisco: e.target.value })
                  }
                  placeholder="Informe o motivo do alto risco"
                  required={formData.risco === "Risco Alto"}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Monitoramento de Exames */}
        <Card>
          <CardHeader>
            <CardTitle>Monitoramento de Exames</CardTitle>
            <CardDescription>Marque os exames realizados por trimestre</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Exames de Rotina */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Exames de Rotina</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rotina1"
                      checked={formData.exames.rotina1}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, rotina1: checked === true },
                        })
                      }
                      className="shadow-sm shadow-black"
                    />
                    <Label htmlFor="rotina1" className="cursor-pointer">
                      1º Trimestre
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rotina2"
                      checked={formData.exames.rotina2}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, rotina2: checked === true },
                        })
                      }
                      className="shadow-sm shadow-black"
                    />
                    <Label htmlFor="rotina2" className="cursor-pointer">
                      2º Trimestre
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rotina3"
                      checked={formData.exames.rotina3}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, rotina3: checked === true },
                        })
                      }
                      className="shadow-sm shadow-black"
                    />
                    <Label htmlFor="rotina3" className="cursor-pointer">
                      3º Trimestre
                    </Label>
                  </div>
                </div>
              </div>

              {/* Ultrassonografia */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Ultrassonografia</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ultrassom1"
                      checked={formData.exames.ultrassom1}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, ultrassom1: checked === true },
                        })
                      }
                      className="shadow-sm shadow-black"
                    />
                    <Label htmlFor="ultrassom1" className="cursor-pointer">
                      1º Trimestre
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ultrassom2"
                      checked={formData.exames.ultrassom2}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, ultrassom2: checked === true },
                        })
                      }
                      className="shadow-sm shadow-black"
                    />
                    <Label htmlFor="ultrassom2" className="cursor-pointer">
                      2º Trimestre
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ultrassom3"
                      checked={formData.exames.ultrassom3}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, ultrassom3: checked === true },
                        })
                      }
                      className="shadow-sm shadow-black"
                    />
                    <Label htmlFor="ultrassom3" className="cursor-pointer">
                      3º Trimestre
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Monitoramento de Vacinas */}
        <Card>
          <CardHeader>
            <CardTitle>Monitoramento de Vacinas</CardTitle>
            <CardDescription>Marque as vacinas aplicadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vacina-hb"
                  checked={formData.vacinas.hb}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, vacinas: { ...formData.vacinas, hb: checked === true } })
                  }
                  className="shadow-sm shadow-black"
                />
                <Label htmlFor="vacina-hb" className="cursor-pointer">
                  HB - Hepatite B
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vacina-dt"
                  checked={formData.vacinas.dt}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, vacinas: { ...formData.vacinas, dt: checked === true } })
                  }
                  className="shadow-sm shadow-black"
                />
                <Label htmlFor="vacina-dt" className="cursor-pointer">
                  DT - Dupla Adulto
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vacina-influenza"
                  checked={formData.vacinas.influenza}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      vacinas: { ...formData.vacinas, influenza: checked === true },
                    })
                  }
                  className="shadow-sm shadow-black"
                />
                <Label htmlFor="vacina-influenza" className="cursor-pointer">
                  Influenza
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vacina-covid"
                  checked={formData.vacinas.covid19}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      vacinas: { ...formData.vacinas, covid19: checked === true },
                    })
                  }
                  className="shadow-sm shadow-black"
                />
                <Label htmlFor="vacina-covid" className="cursor-pointer">
                  Covid-19
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vacina-dtpa"
                  checked={formData.vacinas.dtpa20Semana}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      vacinas: { ...formData.vacinas, dtpa20Semana: checked === true },
                    })
                  }
                  className="shadow-sm shadow-black"
                />
                <Label htmlFor="vacina-dtpa" className="cursor-pointer">
                  DTPA - 20º semana gestacional
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vacina-vsr"
                  checked={formData.vacinas.vsr28Semana}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      vacinas: { ...formData.vacinas, vsr28Semana: checked === true },
                    })
                  }
                  className="shadow-sm shadow-black"
                />
                <Label htmlFor="vacina-vsr" className="cursor-pointer">
                  VSR - Vírus Sincicial Respiratório 28º semana gestacional
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <MonitoramentoPlanilhaFields
          value={{
            testesRapidos1Trimestre: formData.testesRapidos1Trimestre,
            testesRapidos3Trimestre: formData.testesRapidos3Trimestre,
            numeroConsultas: formData.numeroConsultas,
            planoDeCuidados: formData.planoDeCuidados,
            gestaoDeCaso: formData.gestaoDeCaso,
            vinculadaMaternidade: formData.vinculadaMaternidade,
            nomeMaternidade: formData.nomeMaternidade,
            destinoAAE: formData.destinoAAE,
            statusAAE: formData.statusAAE,
            dataEncaminhamentoAAE: formData.dataEncaminhamentoAAE,
            dataAcessoAAE: formData.dataAcessoAAE,
            desfecho: formData.desfecho,
            dataDesfecho: formData.dataDesfecho,
          }}
          onChange={(planilha) => setFormData({ ...formData, ...planilha })}
        />

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Link href="/">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Salvando..." : "Salvar Gestante"}
          </Button>
        </div>
      </form>
    </div>
  )
}

