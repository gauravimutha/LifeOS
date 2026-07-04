'use client'

import type { GoalTreeNode, GoalStatus } from '@/types/goal'
import { Card } from '@/components/ui'
import { GoalCard } from './GoalCard'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface GoalTreeProps {
  nodes: GoalTreeNode[]
  onStatusChange?: (id: string, status: GoalStatus) => void
  emptyMessage?: string
  className?: string
}

function TreeNode({ node, onStatusChange, depth = 0 }: {
  node: GoalTreeNode
  onStatusChange?: (id: string, status: GoalStatus) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="relative">
      <div className={cn('flex items-start gap-1')}>
        {hasChildren && (
          <button
            onClick={(e) => {
              e.preventDefault()
              setExpanded(!expanded)
            }}
            className="mt-3 shrink-0 p-0.5 rounded-sm hover:bg-bg-tertiary neo-transition"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
            )}
          </button>
        )}
        <div className={cn('flex-1', !hasChildren && 'ml-5')}>
          <GoalCard goal={node} depth={depth} onStatusChange={onStatusChange} />
        </div>
      </div>
      {hasChildren && expanded && (
        <div className="ml-6 border-l-2 border-border-light pl-3 mt-1 space-y-2">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} onStatusChange={onStatusChange} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function GoalTree({ nodes, onStatusChange, emptyMessage, className }: GoalTreeProps) {
  if (nodes.length === 0) {
    return (
      <Card padding="lg" variant="ghost">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-text-tertiary">{emptyMessage ?? 'No goals yet'}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} onStatusChange={onStatusChange} />
      ))}
    </div>
  )
}
