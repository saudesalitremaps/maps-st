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
  headerGradient:
    "bg-[linear-gradient(90deg,#047857_25%,#DC2626_45%,#EC008C_60%,#06B6D4_100%)]",
  headerSubtitle: "text-emerald-50/95",
  headerSessionLabel: "text-emerald-100/85",
  loginPageBg: "bg-gradient-to-br from-emerald-50 via-red-50 to-cyan-50",
  loginCard: "border-emerald-200",
  loginIcon: "bg-gradient-to-br from-[#EC008C] via-emerald-600 to-cyan-500",  
  loginTitle: "text-emerald-800",
}

export function getMunicipio(): MunicipioConfig {
  return SALITRE
}
