"use client"

import { usePathname } from "next/navigation"
import { Header } from "./header"
import { Footer } from "./footer"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 bg-white">
        {children}
      </main>
      <Footer />
    </>
  )
}
