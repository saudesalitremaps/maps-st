export interface MunicipioConfig {
  id: "salitre"
  produto: string
  nome: string
  uf: string
  aps: string
  descricao: string
  headerGradient: string
  headerSubtitle: string
  headerSessionLabel: string
  loginPageBg: string
  loginCard: string
  loginIcon: string
  loginTitle: string
}

const SALITRE: MunicipioConfig = {
  id: "salitre",
  produto: "MAPS-ST",
  nome: "Salitre",
  uf: "CE",
  aps: "APS Salitre",
  descricao: "Monitoramento da Atenção Primária em Saúde — Salitre",
  headerGradient: "bg-gradient-to-r from-[#EC008C] via-emerald-700 to-cyan-500",
  headerSubtitle: "text-pink-100/95",
  headerSessionLabel: "text-pink-100/80",
  loginPageBg: "bg-gradient-to-br from-emerald-50 via-pink-50 to-cyan-50",
  loginCard: "border-pink-200",
  loginIcon: "bg-gradient-to-br from-[#EC008C] via-emerald-600 to-cyan-500",
  loginTitle: "text-[#EC008C]",
}

export function getMunicipio(): MunicipioConfig {
  return SALITRE
}
