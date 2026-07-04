'use client'

import { cn } from '@/lib/utils'
import { Clock, GripVertical, ListTodo, Repeat, Coffee, Brain, Users, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui'

const typeIcons: Record<string, LucideIcon> = {
  task: ListTodo,
  habit: Repeat,
  routine: Repeat,
  break: Coffee,
  focus: Brain,
  meeting: Users,
  other: Clock,
}

const energyColors: Record<string, string> = {
  low: 'bg-success/10 text-success border-success',
  medium: 'bg-warning/10 text-warning border-warning',
  high: 'bg-error/10 text-error border-error',
}

interface TimeBlockProps {
  block: {
    id: string
    title: string
    startTime: string
    endTime: string
    type: string
    energyRequired?: string
    flexible: boolean
    completed: boolean
    goalId?: string
  }
  onClick?: (id: string) => void
  onComplete?: (id: string) => void
}

export function TimeBlock({ block, onClick, onComplete }: TimeBlockProps) {
  const Icon = typeIcons[block.type] ?? Clock

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-sm border-2 border-border bg-surface p-3 neo-transition cursor-pointer hover:neo-shadow-sm group',
        block.completed && 'opacity-50 border-border-light',
      )}
      onClick={() => onClick?.(block.id)}
    >
      <GripVertical className="h-4 w-4 text-text-tertiary shrink-0 opacity-0 group-hover:opacity-100 neo-transition" />
      <div className={cn(
        'rounded-sm border-2 p-1.5',
        block.completed ? 'border-border-light bg-bg-secondary' : 'border-border bg-bg-secondary',
      )}>
        <Icon className={cn('h-4 w-4', block.completed ? 'text-text-tertiary' : 'text-accent')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-semibold truncate', block.completed && 'line-through text-text-tertiary')}>
            {block.title}
          </span>
          {block.flexible && <Badge variant="warning" className="text-[9px] px-1">Flexible</Badge>}
        </div>
        <span className={cn('text-xs text-text-tertiary flex items-center gap-1 mt-0.5', block.completed && 'line-through')}>
          <Clock className="h-3 w-3" />
          {block.startTime} - {block.endTime}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {block.energyRequired && (
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-sm border', energyColors[block.energyRequired] ?? '')}>
            {block.energyRequired}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onComplete?.(block.id)
          }}
          className={cn(
            'rounded-sm border-2 w-6 h-6 flex items-center justify-center neo-transition',
            block.completed
              ? 'border-success bg-success-bg text-success'
              : 'border-border hover:border-accent',
          )}
          aria-label={block.completed ? 'Incomplete' : 'Complete'}
        >
          {block.completed && <span className="text-xs font-bold">✓</span>}
        </button>
      </div>
    </div>
  )
}
