'use client'

import { Card, Badge } from '@/components/ui'
import { Clock, ListChecks } from 'lucide-react'

interface RoutineStep {
  id: string
  label: string
  duration: number
}

interface RoutineCardProps {
  routine: {
    id: string
    title: string
    type: string
    steps: RoutineStep[]
    totalDuration: number
    time?: string
  }
  onClick?: (id: string) => void
}

export function RoutineCard({ routine, onClick }: RoutineCardProps) {
  return (
    <Card
      padding="md"
      className="cursor-pointer hover:neo-shadow-sm neo-transition"
      onClick={() => onClick?.(routine.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" className="capitalize">
              {routine.type}
            </Badge>
            {routine.time && (
              <span className="text-xs font-semibold text-text-tertiary">{routine.time}</span>
            )}
          </div>
          <h3 className="font-bold">{routine.title}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <Clock className="h-3.5 w-3.5" />
          {routine.totalDuration}m
        </div>
      </div>
      <div className="space-y-1">
        {routine.steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2 text-sm text-text-secondary">
            <ListChecks className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
            <span className="flex-1">{step.label}</span>
            <span className="text-xs text-text-tertiary">{step.duration}m</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
