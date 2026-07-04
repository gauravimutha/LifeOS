'use client'

import { Card, Badge, Button } from '@/components/ui'
import { Sparkles, Check, Edit3, X, Lightbulb, TrendingUp } from 'lucide-react'

interface AISuggestionCardProps {
  suggestion: {
    id: string
    title: string
    reasoning: string
    confidence: number
    type?: 'goal' | 'task' | 'plan' | 'habit' | 'insight'
  }
  onAccept?: (id: string) => void
  onModify?: (id: string) => void
  onDismiss?: (id: string) => void
}

const typeIcons = {
  goal: Sparkles,
  task: Sparkles,
  plan: TrendingUp,
  habit: Sparkles,
  insight: Lightbulb,
}

export function AISuggestionCard({ suggestion, onAccept, onModify, onDismiss }: AISuggestionCardProps) {
  const Icon = typeIcons[suggestion.type ?? 'insight'] ?? Lightbulb
  const confidenceLabel = suggestion.confidence >= 0.8 ? 'High' : suggestion.confidence >= 0.5 ? 'Medium' : 'Low'
  const confidenceColor = suggestion.confidence >= 0.8 ? 'success' : suggestion.confidence >= 0.5 ? 'warning' : 'error'

  return (
    <Card padding="md" variant="ai" className="group">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-sm border-2 border-accent bg-accent-light p-2">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold">{suggestion.title}</h4>
            <Badge variant={confidenceColor as 'success' | 'warning' | 'error'}>
              {confidenceLabel} ({Math.round(suggestion.confidence * 100)}%)
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">{suggestion.reasoning}</p>
          <div className="flex items-center gap-2 mt-3">
            {onAccept && (
              <Button size="sm" onClick={() => onAccept(suggestion.id)}>
                <Check className="h-3.5 w-3.5" />
                Accept
              </Button>
            )}
            {onModify && (
              <Button variant="ghost" size="sm" onClick={() => onModify(suggestion.id)}>
                <Edit3 className="h-3.5 w-3.5" />
                Modify
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={() => onDismiss(suggestion.id)}>
                <X className="h-3.5 w-3.5" />
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
