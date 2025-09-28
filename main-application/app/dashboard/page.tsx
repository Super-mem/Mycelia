"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useHypergraphApp, useQuery } from '@graphprotocol/hypergraph-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, LogOut, Zap, TrendingUp, Users, Database, Activity } from "lucide-react"
import MemoryGraph from "@/components/memory-graph"
import MetricsCards from "@/components/metrics-cards"
import FriendsManager from "@/components/FriendsManager"
import { clearCurrentUser, getCurrentUserId } from "@/lib/userManager"
import { Fact, User, Concept } from "@/lib/schema"

export default function DashboardPage() {
  const [selectedFact, setSelectedFact] = useState<string | null>(null)
  const router = useRouter()
  const { logout } = useHypergraphApp()
  
  // Use the same space ID as in agent_one
  const spaceId = "f15a17f0-078e-4eae-85e1-78a001e5e83e"
  
  // Query real facts from hypergraph
  const { data: facts, error: queryError, isPending: isLoading } = useQuery(Fact, { 
    mode: 'private', 
    space: spaceId,
    include: { user: {}, concept: {} }
  })
  
  // Query users and concepts for metrics
  const { data: users } = useQuery(User, { 
    mode: 'private', 
    space: spaceId 
  })
  
  const { data: concepts } = useQuery(Concept, { 
    mode: 'private', 
    space: spaceId 
  })
  
  // Get current user info
  const currentUserId = getCurrentUserId()
  const currentUser = users?.find(user => user.id === currentUserId)
  
  // Calculate metrics from real data
  const userData = useMemo(() => {
    const totalFacts = facts?.length || 0
    const totalConcepts = concepts?.length || 0
    const uniqueUsers = new Set(facts?.map(f => f.user?.[0]?.id).filter(Boolean))
    
    return {
      user: {
        name: currentUser?.name || "User",
        id: currentUserId || "unknown",
        totalFacts,
        totalConcepts,
        totalProviderUsage: totalFacts * 15, // Approximation
        totalIncentives: totalFacts * 2.5, // Approximation
      },
      facts: facts || []
    }
  }, [facts, concepts, currentUser, currentUserId])

  const handleLogout = () => {
    try {
      // Clear user data from localStorage
      clearCurrentUser()
      // Logout from hypergraph
      logout()
      // Redirect to home
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if logout fails
      router.push('/')
    }
  }

  // Show loading state while facts are being fetched
  // if (facts.length == 0) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
  //         <h2 className="text-xl font-semibold mb-2">Loading your memory dashboard...</h2>
  //         <p className="text-muted-foreground">Fetching your facts and connections</p>
  //       </div>
  //     </div>
  //   )
  // }

  // Show error state if query failed
  if (queryError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to load dashboard</h2>
          <p className="text-muted-foreground mb-4">Error: {queryError.message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-10" />

      {/* Navigation */}
      <nav className="relative z-50 border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Mycelia</span>
              <Badge variant="outline" className="ml-4 text-xs">Dashboard</Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-primary border-primary/20">
                <Zap className="h-3 w-3 mr-1" />
                {userData.user.name}
              </Badge>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-balance mb-2">Welcome back, {userData.user.name}</h1>
          <p className="text-muted-foreground text-lg">
            Your AI memory dashboard - track usage, explore connections, and manage your knowledge graph.
          </p>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Facts</CardTitle>
              <Database className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.user.totalFacts}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+12%</span>
                <span>from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Concepts</CardTitle>
              <Brain className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.user.totalConcepts}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+8%</span>
                <span>from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Provider Usage</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.user.totalProviderUsage.toLocaleString()}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-blue-500" />
                <span className="text-blue-500">+23%</span>
                <span>from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Incentives Earned</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${userData.user.totalIncentives.toLocaleString()}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+15%</span>
                <span>from last week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Memory Graph - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Memory Graph
                </CardTitle>
                <CardDescription>Interactive visualization of your knowledge connections</CardDescription>
              </CardHeader>
              <CardContent className="h-[500px]">
                <MemoryGraph userData={userData} onFactSelect={setSelectedFact} selectedFact={selectedFact} />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Fact Details */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Fact Details</CardTitle>
                <CardDescription>
                  {selectedFact ? "Selected fact information" : "Select a node to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFact ? (
                  <div className="space-y-4">
                    {(() => {
                      const fact = userData.facts.find((f: any) => f.id === selectedFact)
                      if (!fact) return <p className="text-muted-foreground">Fact not found</p>

                      return (
                        <>
                          <div>
                            <h4 className="font-semibold text-primary mb-1">{fact.concept[0]?.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {fact.concept[0]?.category}
                            </Badge>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-1">Details:</p>
                            <p className="text-sm text-muted-foreground">{fact.details || 'No details provided'}</p>
                          </div>

                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Source: {fact.source || 'Unknown'}</span>
                            <span>Confidence: {fact.confidence ? (fact.confidence * 100).toFixed(0) : '0'}%</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Click on any node in the memory graph to view detailed information about that fact or concept.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* <FriendsManager /> */}

            {/* Recent Activity */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest memory updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userData.facts.length > 0 ? (
                    userData.facts.slice(0, 3).map((fact: any, index: number) => (
                      <div key={fact.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Fact recorded</p>
                          <p className="text-muted-foreground text-xs">
                            {fact.concept[0]?.name} - {fact.concept[0]?.category}
                          </p>
                          <p className="text-muted-foreground text-xs">Recently added</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">No recent activity</p>
                      <p className="text-muted-foreground text-xs">Start adding facts to see activity here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage Analytics */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Usage Analytics</CardTitle>
                <CardDescription>This week's statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Facts</span>
                      <span className="font-medium">{userData.user.totalFacts}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary rounded-full h-2" style={{ width: userData.user.totalFacts > 0 ? "78%" : "0%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Concepts</span>
                      <span className="font-medium">{userData.user.totalConcepts}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 rounded-full h-2" style={{ width: userData.user.totalConcepts > 0 ? "65%" : "0%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Provider Usage</span>
                      <span className="font-medium">{userData.user.totalProviderUsage}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 rounded-full h-2" style={{ width: userData.user.totalProviderUsage > 0 ? "92%" : "0%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
