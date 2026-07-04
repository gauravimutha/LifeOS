'use client'

import type { LifeGraphEdge } from '@/types/lifeGraph'
import { Card, Badge } from '@/components/ui'
import { Share2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { graphService } from '@/services/lifeGraph/graphService'
import { groupEdgesByType } from '@/engine'

interface GoalRelationshipsProps {
  goalId: string
}

const edgeLabels: Record<string, string> = {
  parent_of: 'Parent',
  supports: 'Supports',
  depends_on: 'Depends On',
  relates_to: 'Relates To',
  blocks: 'Blocks',
  precedes: 'Precedes',
  follows: 'Follows',
  conflicts_with: 'Conflicts With',
  improves: 'Improves',
  harms: 'Harms',
  requires: 'Requires',
  generates: 'Generates',
  measures: 'Measures',
  belongs_to: 'Belongs To',
  references: 'References',
}

export function GoalRelationships({ goalId }: GoalRelationshipsProps) {
  const [edges, setEdges] = useState<LifeGraphEdge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const result = await graphService.getGraphForEntity(goalId, 'goal')
        setEdges(result)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [goalId])

  if (loading) {
    return (
      <Card padding="md">
        <div className="flex items-center gap-2 text-text-tertiary">
          <Share2 className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Loading relationships...</span>
        </div>
      </Card>
    )
  }

  if (edges.length === 0) {
    return (
      <Card padding="md" variant="ghost">
        <div className="flex items-center gap-2 text-text-tertiary">
          <Share2 className="h-4 w-4" />
          <span className="text-sm">No relationships yet</span>
        </div>
      </Card>
    )
  }

  const grouped = groupEdgesByType(edges)

  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="h-4 w-4 text-accent" />
        <h3 className="font-bold">Relationships</h3>
        <Badge variant="default">{edges.length}</Badge>
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([type, typeEdges]) => (
          <div key={type}>
            <p className="text-xs font-bold uppercase text-text-tertiary mb-1">
              {edgeLabels[type] ?? type} ({typeEdges.length})
            </p>
            <div className="space-y-1">
              {typeEdges.map((edge) => {
                const isSource = edge.sourceEntityId === goalId
                const otherId = isSource ? edge.targetEntityId : edge.sourceEntityId
                const otherType = isSource ? edge.targetEntityType : edge.sourceEntityType
                return (
                  <div key={edge.id} className="flex items-center gap-2 text-sm">
                    <span className="text-text-secondary">{isSource ? '→' : '←'}</span>
                    <span className="font-mono text-xs text-text-tertiary">{otherType}</span>
                    <span className="font-medium text-text-primary truncate">{otherId}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
