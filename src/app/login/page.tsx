"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {PasswordInput} from "@/components/ui/password-input"
import { Activity } from "lucide-react"
import { getMunicipio } from "@/lib/municipio"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")
    setCarregando(true)

    try {
      const result = await signIn("credentials", {
        email,
        senha,
        redirect: false,
      })

      if (result?.error) {
        setErro("Email ou senha incorretos")
        setCarregando(false)
      } else if (result?.ok) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        window.location.href = "/"
      } else {
        setErro("Erro ao fazer login. Tente novamente.")
        setCarregando(false)
      }
    } catch {
      setErro("Erro ao fazer login. Tente novamente.")
      setCarregando(false)
    }
  }

  const municipio = getMunicipio()

  return (
    <div className={`min-h-screen flex items-center justify-center ${municipio.loginPageBg} p-4`}>
      <Card className={`w-full max-w-md p-8 shadow-xl ${municipio.loginCard}`}>
        <div className="text-center mb-8">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${municipio.loginIcon} shadow-md`}>
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${municipio.loginTitle}`}>{municipio.produto}</h1>
          <p className="text-sm text-black mt-1">{municipio.aps}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {municipio.descricao}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu.email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <PasswordInput value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>

          {erro && (
            <div
              role="alert"
              className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm"
            >
              {erro}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
