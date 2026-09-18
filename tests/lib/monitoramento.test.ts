import { describe, expect, it } from "vitest"
import {
  compactDefined,
  isAcompanhamentoAtivo,
  montarPlanilhaMonitoramento,
  parseMonitoramentoFields,
  parseOptionalDate,
} from "@/lib/monitoramento"

describe("monitoramento", () => {
  it("isAcompanhamentoAtivo exige gestação ativa e desfecho em andamento", () => {
    const dum = new Date()
    dum.setDate(dum.getDate() - 30)
    expect(isAcompanhamentoAtivo(dum, "em_andamento")).toBe(true)
    expect(isAcompanhamentoAtivo(dum, "nascido")).toBe(false)
  })

  it("parseOptionalDate trata vazio e inválido", () => {
    expect(parseOptionalDate(undefined)).toBeUndefined()
    expect(parseOptionalDate("")).toBeNull()
    expect(parseOptionalDate("2026-01-02")).toBeInstanceOf(Date)
    expect(parseOptionalDate("não-é-data")).toBeNull()
  })

  it("parseMonitoramentoFields ignora valores inválidos e compacta defined", () => {
    const parsed = parseMonitoramentoFields({
      numeroConsultas: "7.9",
      statusAAE: "invalido",
      destinoAAE: "Policlínica",
      desfecho: "nascido",
      testesRapidos1Trimestre: 1,
      nomeMaternidade: "  Santa Casa  ",
    })
    expect(parsed.numeroConsultas).toBe(7)
    expect(parsed.statusAAE).toBeUndefined()
    expect(parsed.destinoAAE).toBe("Policlínica")
    expect(parsed.desfecho).toBe("nascido")
    expect(parsed.nomeMaternidade).toBe("Santa Casa")
    expect(compactDefined(parsed).statusAAE).toBeUndefined()
  })

  it("montarPlanilhaMonitoramento agrega acompanhadas e desfechos", () => {
    const dum = new Date()
    dum.setDate(dum.getDate() - 40)
    const inicioAno = new Date(2026, 0, 1)
    const fim = new Date(2026, 8, 30)
    const planilha = montarPlanilhaMonitoramento(
      [
        {
          dum,
          desfecho: "em_andamento",
          dataDesfecho: null,
          createdAt: new Date(),
          semanasInicioPreNatal: 10,
          numeroConsultas: 8,
          exameRotina1Trimestre: true,
          exameRotina3Trimestre: false,
          testesRapidos1Trimestre: true,
          testesRapidos3Trimestre: false,
          risco: "Risco Alto",
          planoDeCuidados: true,
          gestaoDeCaso: true,
          vinculadaMaternidade: true,
          destinoAAE: "Policlínica",
          statusAAE: "compartilhada",
          dataEncaminhamentoAAE: new Date("2026-02-01"),
          dataAcessoAAE: new Date("2026-02-11"),
        },
      ],
      [{ desfecho: "nascido", dataDesfecho: new Date("2026-03-01") }],
      100,
      inicioAno,
      fim
    )

    expect(planilha.gestantesEstimadas).toBe(100)
    expect(planilha.totalGestantesAteOMomento).toBe(1)
    expect(planilha.nascidosNoAno).toBe(1)
    expect(planilha.comMinimo7Consultas).toBe(1)
    expect(planilha.riscoAltoCompartilhadas.policlinica).toBe(1)
    expect(planilha.mediaDiasAcessoRiscoAlto.policlinica).toBe(10)
  })
})
