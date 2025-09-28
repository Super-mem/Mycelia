"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { getCategoryColor, getCategoryColorMapping, getCategoryGroup } from "@/lib/schema"

interface MemoryGraphProps {
  userData: any
  onFactSelect: (factId: string | null) => void
  selectedFact: string | null
}

interface Node {
  id: string
  x: number
  y: number
  radius: number
  type: "user" | "concept"
  label: string
  category?: string
  factId?: string
  confidence?: number
}

interface Connection {
  from: string
  to: string
  strength: number
}

export default function MemoryGraph({ userData, onFactSelect, selectedFact }: MemoryGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    // Create nodes from user data
    const centerX = 300
    const centerY = 250

    // Central user node
    const userNode: Node = {
      id: "user-center",
      x: centerX,
      y: centerY,
      radius: 40,
      type: "user",
      label: userData.user.name,
    }

    // Concept nodes arranged in a circle around the user
    const conceptNodes: Node[] = userData.facts.map((fact: any, index: number) => {
      const angle = (index / userData.facts.length) * 2 * Math.PI
      const distance = 150 + Math.random() * 50 // Add some randomness

      return {
        id: fact.concept[0].id,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        radius: 20 + fact.confidence * 15, // Size based on confidence
        type: "concept",
        label: fact.concept[0].name,
        category: fact.concept[0].category,
        factId: fact.id,
        confidence: fact.confidence,
      }
    })

    // Create connections from user to each concept
    const newConnections: Connection[] = userData.facts.map((fact: any) => ({
      from: "user-center",
      to: fact.concept[0].id,
      strength: fact.confidence,
    }))

    setNodes([userNode, ...conceptNodes])
    setConnections(newConnections)
  }, [userData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.fillStyle = "rgb(12, 12, 12)" // Dark background
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

    // Draw connections
    connections.forEach((connection) => {
      const fromNode = nodes.find((n) => n.id === connection.from)
      const toNode = nodes.find((n) => n.id === connection.to)

      if (fromNode && toNode) {
        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        ctx.lineTo(toNode.x, toNode.y)
        ctx.strokeStyle = `rgba(34, 197, 94, ${connection.strength * 0.6})` // Green with opacity based on strength
        ctx.lineWidth = 1 + connection.strength * 2
        ctx.stroke()
      }
    })

    // Draw nodes
    nodes.forEach((node) => {
      const isSelected = selectedFact === node.factId
      const isHovered = hoveredNode === node.id

      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI)

      if (node.type === "user") {
        ctx.fillStyle = "rgb(34, 197, 94)" // Primary green
      } else {
        // Use the color mapping from schema
        const categoryColor = getCategoryColor(node.category || "");
        ctx.fillStyle = categoryColor;
      }

      if (isSelected || isHovered) {
        ctx.shadowColor = ctx.fillStyle
        ctx.shadowBlur = 20
      } else {
        ctx.shadowBlur = 0
      }

      ctx.fill()

      // Draw node border
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI)
      ctx.strokeStyle = isSelected ? "rgb(255, 255, 255)" : "rgba(255, 255, 255, 0.3)"
      ctx.lineWidth = isSelected ? 3 : 1
      ctx.stroke()

      // Draw label
      ctx.fillStyle = "rgb(255, 255, 255)"
      ctx.font = `${node.type === "user" ? "14" : "12"}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Truncate long labels
      let label = node.label
      if (label.length > 12) {
        label = label.substring(0, 12) + "..."
      }

      ctx.fillText(label, node.x, node.y + node.radius + 15)
    })
  }, [nodes, connections, selectedFact, hoveredNode])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Check if click is on a node
    const clickedNode = nodes.find((node) => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      return distance <= node.radius
    })

    if (clickedNode && clickedNode.factId) {
      onFactSelect(selectedFact === clickedNode.factId ? null : clickedNode.factId)
    } else if (clickedNode?.type === "user") {
      onFactSelect(null)
    }
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Check if mouse is over a node
    const hoveredNode = nodes.find((node) => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      return distance <= node.radius
    })

    setHoveredNode(hoveredNode?.id || null)
    canvas.style.cursor = hoveredNode ? "pointer" : "default"
  }

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
      />

      {/* Legend */}
      <div className="absolute top-4 right-4 space-y-2">
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-3 space-y-3 max-h-96 overflow-y-auto">
          <h4 className="text-sm font-semibold text-foreground">Categories</h4>
          {/* Group categories by type */}
          {Object.entries(
            getCategoryColorMapping().reduce((groups, { category, color, group }) => {
              if (!groups[group]) groups[group] = [];
              groups[group].push({ category, color });
              return groups;
            }, {} as Record<string, { category: string; color: string }[]>)
          ).map(([groupName, categories]) => (
            <div key={groupName} className="space-y-1">
              <h5 className="text-xs font-medium text-muted-foreground">{groupName}</h5>
              <div className="grid grid-cols-1 gap-1 text-xs pl-2">
                {categories.map(({ category, color }) => (
                  <div key={category} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-muted-foreground capitalize text-xs">
                      {category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            Click on nodes to view details
          </p>
        </div>
      </div>
    </div>
  )
}
