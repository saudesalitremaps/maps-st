import { getMunicipio } from "@/lib/municipio"

export function Footer() {
  const municipio = getMunicipio()
  return (
    <footer className="border-t-2 border-emerald-700/40 bg-background/90 backdrop-blur-sm py-4 mt-8">
      <div className="container mx-auto px-4 flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
        <p className="font-medium tracking-wide text-emerald-800">
          {municipio.produto} — {municipio.aps}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Foco em cuidado contínuo, acompanhamento humanizado e tomada de decisão baseada em dados.
        </p>
      </div>
    </footer>
  )
}

