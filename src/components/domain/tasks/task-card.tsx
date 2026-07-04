'use client'

import { CheckCircle2, Circle, ChevronRight, Calendar, Flag } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/task'

const priorityColors: Record<string, 'default' | 'primary' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'primary',
  high: 'warning',
  urgent: 'error',
}

interface TaskCardProps {
  task: Task
  onToggle?: (id: string) => void
  onClick?: (task: Task) => void
  showGoal?: boolean
}

export function TaskCard({ task, onToggle, onClick, showGoal }: TaskCardProps) {
  const isCompleted = task.status === 'completed'

  return (
    <Card
      variant={isCompleted ? 'ghost' : 'default'}
      padding="sm"
      className={cn(
        'group flex items-center gap-3 cursor-pointer hover:neo-shadow-sm neo-transition',
        isCompleted && 'opacity-60',
      )}
      onClick={() => onClick?.(task)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle?.(task.id)
        }}
        className="shrink-0 rounded-sm p-0.5 hover:bg-bg-tertiary neo-transition"
        aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Circle className="h-5 w-5 text-text-tertiary" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-semibold truncate',
              isCompleted && 'line-through text-text-tertiary',
            )}
          >
            {task.title}
          </span>
          <Badge variant={priorityColors[task.priority] ?? 'default'} className="shrink-0">
            {task.priority}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {task.deadline && (
            <span className="flex items-center gap-1 text-xs text-text-tertiary">
              <Calendar className="h-3 w-3" />
              {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
          {task.estimatedDuration > 0 && (
            <span className="text-xs text-text-tertiary">{task.estimatedDuration}m</span>
          )}
          {showGoal && task.goalId && (
            <span className="flex items-center gap-1 text-xs text-accent">
              <Flag className="h-3 w-3" />
              Goal
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 neo-transition shrink-0" />
    </Card>
  )
}
