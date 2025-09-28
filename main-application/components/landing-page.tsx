"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Network, Zap, Shield, ArrowRight, Menu, X, Database } from "lucide-react"

interface LandingPageProps {
  onLogin: () => void
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20" />

      {/* Navigation */}
      <nav className="relative z-50 border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Mycelia</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#platform" className="text-muted-foreground hover:text-foreground transition-colors">
                Platform
              </a>
              <Button onClick={onLogin} variant="outline" size="sm">
                Log in
              </Button>
            </div>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-sm">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-muted-foreground hover:text-foreground">
                Features
              </a>
              <a href="#platform" className="block text-muted-foreground hover:text-foreground">
                Platform
              </a>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground">
                Pricing
              </a>
              <Button onClick={onLogin} variant="outline" size="sm" className="w-full bg-transparent">
                Log in
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-primary border-primary/20">
            <Zap className="h-3 w-3 mr-1" />
            Powered by Advanced AI
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-6">
            Decentralized user personas
            <span className="block text-primary">for the agentic future</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 text-pretty">
            Build transformative AI experiences powered by unified memory and context management. Connect facts,
            concepts, and relationships in a powerful knowledge graph.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button onClick={onLogin} size="lg" className="text-lg px-8">
              See your persona
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              Explore More
            </Button>
          </div>
        </div>
      </section>

      

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">Core Memory Systems</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              Advanced memory architecture designed for AI agents that need to understand, remember, and connect complex
              information across conversations and contexts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <Network className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Knowledge Graphs</CardTitle>
                <CardDescription>
                  User intents are stored into knowledge graphs for semantic structure preservation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Dynamic relationship mapping</li>
                  <li>• Real-time graph updates</li>
                  <li>• Semantic connections</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <Database className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Fact Management</CardTitle>
                <CardDescription>
                  Store, categorize, and retrieve facts with confidence scoring and source tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Confidence-based ranking</li>
                  <li>• Source attribution</li>
                  <li>• Category organization</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Secured & Encrypted</CardTitle>
                <CardDescription>
                  Secured and encrypted on the hypergraph and synced using the sync server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• End-to-end encryption</li>
                  <li>• Access controls</li>
                  <li>• Data sovereignty</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section id="platform" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
                The complete platform to build AI memory
              </h2>
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                Your team's toolkit to stop configuring and start innovating. Securely build, deploy, and scale the best
                AI experiences with unified memory.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={onLogin} size="lg">
                  Get started
                </Button>
                <Button variant="outline" size="lg">
                  Explore the platform
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <div className="text-3xl font-bold text-primary mb-2">10M+</div>
                <div className="text-sm text-muted-foreground">Facts processed daily</div>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime guarantee</div>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <div className="text-3xl font-bold text-primary mb-2">50ms</div>
                <div className="text-sm text-muted-foreground">Average query time</div>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <div className="text-sm text-muted-foreground">AI companies trust us</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">Ready to build the future of AI memory?</h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Join thousands of developers building next-generation AI agents with unified memory systems.
          </p>
          <Button onClick={onLogin} size="lg" className="text-lg px-8">
            Start building today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Mycelia</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
