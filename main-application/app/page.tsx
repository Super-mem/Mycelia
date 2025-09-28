"use client"

import { useRouter } from "next/navigation"
import { useHypergraphAuth } from '@graphprotocol/hypergraph-react'
import { useEffect } from 'react'
import LandingPage from "@/components/landing-page"

export default function Home() {
  const router = useRouter()
  const { authenticated } = useHypergraphAuth()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (authenticated) {
      router.push('/dashboard')
    }
  }, [authenticated, router])

  const handleLogin = () => {
    router.push('/login')
  }

  // Don't render landing page if already authenticated (will redirect)
  if (authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Redirecting...</h1>
          <p className="text-muted-foreground">Taking you to your dashboard.</p>
        </div>
      </div>
    )
  }

  return <LandingPage onLogin={handleLogin} />
}
