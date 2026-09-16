import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.senha) {
            console.error("Credenciais incompletas")
            return null
          }

          const emailNormalizado = credentials.email.trim().toLowerCase()
          const senhaInformada = credentials.senha.trim()

          const enfermeiro = await prisma.enfermeiro.findFirst({
            where: {
              email: {
                equals: emailNormalizado,
                mode: "insensitive",
              },
            },
            select: {
              id: true,
              email: true,
              nome: true,
              senha: true,
              isAdmin: true,
              ubsId: true,
            },
          })

          if (!enfermeiro) {
            console.error("Enfermeiro não encontrado:", emailNormalizado)
            return null
          }

          const senhaValida = await bcrypt.compare(senhaInformada, enfermeiro.senha)

          if (!senhaValida) {
            console.error("Senha inválida para:", emailNormalizado)
            return null
          }

          const ubsId = enfermeiro.ubsId ?? undefined

          return {
            id: enfermeiro.id,
            email: enfermeiro.email,
            name: enfermeiro.nome,
            isAdmin: enfermeiro.isAdmin,
            ubsId,
          }
        } catch (error) {
          console.error("Erro no authorize:", error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = user.isAdmin
        token.ubsId = user.ubsId ?? undefined
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
        session.user.ubsId = token.ubsId as string | undefined
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
}

