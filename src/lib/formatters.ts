export function formatCartaoSus(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 15)
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push(digits.slice(3, 7))
  if (digits.length > 7) parts.push(digits.slice(7, 11))
  if (digits.length > 11) parts.push(digits.slice(11, 15))
  return parts.join(" ")
}

export function sanitizeCartaoSus(value: string): string {
  return value.replace(/\D/g, "").slice(0, 15)
}

export function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function sanitizeTelefone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

export const MAX_SEMANAS_GESTACAO = 42

export function calculateWeeks(dum: string | Date): number {
  const dumDate = typeof dum === "string" ? new Date(dum) : dum
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - dumDate.getTime()) / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(diffDays / 7)
  return weeks >= 0 ? weeks : 0
}

export function isGestacaoAtiva(dum: string | Date): boolean {
  return calculateWeeks(dum) <= MAX_SEMANAS_GESTACAO
}

export function getRiscoColor(risco: string): string {
  switch (risco) {
    case "Risco Baixo":
      return "bg-green-100 text-green-800 border-green-300"
    case "Risco Intermediário":
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    case "Risco Alto":
      return "bg-red-100 text-red-800 border-red-300"
    default:
      return "bg-gray-100 text-gray-800 border-gray-300"
  }
}

export function yesNo(value: boolean): string {
  return value ? "Sim" : "Não"
}

export function isPartoUltimos3Meses(dpp: string): boolean {
  const dppDate = new Date(dpp)
  const today = new Date()
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(today.getMonth() - 3)
  return dppDate >= threeMonthsAgo && dppDate <= today
}

export function isPartoEsteMes(dpp: string): boolean {
  const dppDate = new Date(dpp)
  const today = new Date()
  return dppDate.getMonth() === today.getMonth() && dppDate.getFullYear() === today.getFullYear()
}
