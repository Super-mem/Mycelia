import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { HypergraphProvider } from "@/components/HypergraphProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mycelia - Unified AI Agent Memory",
  description: "The most powerful platform for AI agent memory and context management",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <HypergraphProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </HypergraphProvider>
        <Analytics />
      </body>
    </html>
  )
}
