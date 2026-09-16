"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DESTINOS_AAE } from "@/lib/monitoramento"

export interface CamposPlanilhaGestante {
  testesRapidos1Trimestre: boolean
  testesRapidos3Trimestre: boolean
  numeroConsultas: string
  planoDeCuidados: boolean
  gestaoDeCaso: boolean
  vinculadaMaternidade: boolean
  nomeMaternidade: string
  destinoAAE: string
  statusAAE: string
  dataEncaminhamentoAAE: string
  dataAcessoAAE: string
  desfecho: string
  dataDesfecho: string
}

export const CAMPOS_PLANILHA_INICIAL: CamposPlanilhaGestante = {
  testesRapidos1Trimestre: false,
  testesRapidos3Trimestre: false,
  numeroConsultas: "0",
  planoDeCuidados: false,
  gestaoDeCaso: false,
  vinculadaMaternidade: false,
  nomeMaternidade: "",
  destinoAAE: "",
  statusAAE: "nao_encaminhada",
  dataEncaminhamentoAAE: "",
  dataAcessoAAE: "",
  desfecho: "em_andamento",
  dataDesfecho: "",
}

interface Props {
  value: CamposPlanilhaGestante
  onChange: (value: CamposPlanilhaGestante) => void
}

export function MonitoramentoPlanilhaFields({ value, onChange }: Props) {
  const set = <K extends keyof CamposPlanilhaGestante>(key: K, next: CamposPlanilhaGestante[K]) => {
    onChange({ ...value, [key]: next })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Testes rápidos, consultas e cuidado</CardTitle>
          <CardDescription>
            Campos usados na planilha mensal de monitoramento de gestantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="testes-rapidos-1"
                checked={value.testesRapidos1Trimestre}
                onCheckedChange={(checked) => set("testesRapidos1Trimestre", checked === true)}
                className="shadow-sm shadow-black"
              />
              <Label htmlFor="testes-rapidos-1" className="cursor-pointer">
                Testes rápidos no 1º trimestre
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="testes-rapidos-3"
                checked={value.testesRapidos3Trimestre}
                onCheckedChange={(checked) => set("testesRapidos3Trimestre", checked === true)}
                className="shadow-sm shadow-black"
              />
              <Label htmlFor="testes-rapidos-3" className="cursor-pointer">
                Testes rápidos no 3º trimestre
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="plano-cuidados"
                checked={value.planoDeCuidados}
                onCheckedChange={(checked) => set("planoDeCuidados", checked === true)}
                className="shadow-sm shadow-black"
              />
              <Label htmlFor="plano-cuidados" className="cursor-pointer">
                Possui plano de cuidados
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gestao-caso"
                checked={value.gestaoDeCaso}
                onCheckedChange={(checked) => set("gestaoDeCaso", checked === true)}
                className="shadow-sm shadow-black"
              />
              <Label htmlFor="gestao-caso" className="cursor-pointer">
                Em gestão de caso
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numeroConsultas">Nº de consultas realizadas até o parto</Label>
            <Input
              id="numeroConsultas"
              type="number"
              min="0"
              value={value.numeroConsultas}
              onChange={(e) => set("numeroConsultas", e.target.value)}
            />
            <p className="text-xs text-gray-500">
              A planilha conta gestantes com no mínimo 7 consultas.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atenção Ambulatorial Especializada (AAE)</CardTitle>
          <CardDescription>
            Encaminhamento para Policlínica ou Ambulatório Municipal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statusAAE">Situação na AAE</Label>
              <Select value={value.statusAAE} onValueChange={(v) => set("statusAAE", v)}>
                <SelectTrigger id="statusAAE">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_encaminhada">Não encaminhada</SelectItem>
                  <SelectItem value="aguardando_vaga">Aguardando vaga</SelectItem>
                  <SelectItem value="compartilhada">Compartilhada / em acompanhamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinoAAE">Destino</Label>
              <Select
                value={value.destinoAAE || "nenhum"}
                onValueChange={(v) => set("destinoAAE", v === "nenhum" ? "" : v)}
              >
                <SelectTrigger id="destinoAAE">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  {DESTINOS_AAE.map((destino) => (
                    <SelectItem key={destino} value={destino}>
                      {destino}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataEncaminhamentoAAE">Data do encaminhamento</Label>
              <Input
                id="dataEncaminhamentoAAE"
                type="date"
                value={value.dataEncaminhamentoAAE}
                onChange={(e) => set("dataEncaminhamentoAAE", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataAcessoAAE">Data de acesso ao pré-natal especializado</Label>
              <Input
                id="dataAcessoAAE"
                type="date"
                value={value.dataAcessoAAE}
                onChange={(e) => set("dataAcessoAAE", e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Usada para calcular a média de tempo de acesso na planilha.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maternidade e desfecho</CardTitle>
          <CardDescription>Vinculação e encerramento da gestação no ano</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vinculada-maternidade"
              checked={value.vinculadaMaternidade}
              onCheckedChange={(checked) => set("vinculadaMaternidade", checked === true)}
              className="shadow-sm shadow-black"
            />
            <Label htmlFor="vinculada-maternidade" className="cursor-pointer">
              Vinculada à maternidade
            </Label>
          </div>
          {value.vinculadaMaternidade && (
            <div className="space-y-2">
              <Label htmlFor="nomeMaternidade">Nome da maternidade</Label>
              <Input
                id="nomeMaternidade"
                value={value.nomeMaternidade}
                onChange={(e) => set("nomeMaternidade", e.target.value)}
                placeholder="Ex: Maternidade municipal"
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="desfecho">Desfecho</Label>
              <Select value={value.desfecho} onValueChange={(v) => set("desfecho", v)}>
                <SelectTrigger id="desfecho">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="nascido">Nascido vivo</SelectItem>
                  <SelectItem value="obito_fetal">Óbito fetal</SelectItem>
                  <SelectItem value="obito_infantil">Óbito infantil</SelectItem>
                  <SelectItem value="obito_materno">Óbito materno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {value.desfecho !== "em_andamento" && (
              <div className="space-y-2">
                <Label htmlFor="dataDesfecho">Data do desfecho</Label>
                <Input
                  id="dataDesfecho"
                  type="date"
                  value={value.dataDesfecho}
                  onChange={(e) => set("dataDesfecho", e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
