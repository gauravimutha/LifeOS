'use client'

import type { Goal } from '@/types/goal'
import { Card, Badge } from '@/components/ui'
import { GoalProgress } from './GoalProgress'
import { cn } from '@/lib/utils'
import { calculateHealthScore, isOverdue } from '@/engine'
import Link from 'next/link'

const levelColors: Record<string, string> = {
  vision: 'bg-domain-spirituality text-white',
  'long-term': 'bg-domain-creativity text-white',
  yearly: 'bg-domain-career text-white',
  quarterly: 'bg-domain-learning text-white',
  monthly: 'bg-domain-health text-white',
  weekly: 'bg-domain-relationships text-white',
}

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  active: 'primary',
  paused: 'warning',
  completed: 'success',
  cancelled: 'error',
  archived: 'default',
}

interface GoalCardProps {
  goal: Goal
  depth?: number
  onStatusChange?: (id: string, status: Goal['status']) => void
}

export function GoalCard({ goal, depth = 0, onStatusChange }: GoalCardProps) {
  const health = calculateHealthScore(goal)
  const overdue = isOverdue(goal)

  return (
    <Link href={`/goals/${goal.id}`} className="block neo-transition">
      <Card
        variant={overdue ? 'highlighted' : 'default'}
        className={cn(
          'group cursor-pointer hover:neo-shadow transition-shadow',
          depth > 0 && 'ml-6',
          health < 40 && 'border-l-error',
          health >= 40 && health < 70 && 'border-l-warning',
          health >= 70 && 'border-l-success',
        )}
        padding="md"
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={statusColors[goal.status] ?? 'default'} className="shrink-0">
                  {goal.status}
                </Badge>
                <span className={cn('text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm', levelColors[goal.level])}>
                  {goal.level}
                </span>
                {goal.metadata?.category && (
                  <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                    {goal.metadata.category}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-text-primary truncate group-hover:text-accent neo-transition">
                {goal.title}
              </h3>
              {goal.description && (
                <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{goal.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <GoalProgress progress={goal.progress} size="sm" />
            {goal.targetDate && (
              <span className={cn(overdue && 'text-error font-semibold')}>
                {overdue ? 'Overdue' : `Due ${new Date(goal.targetDate).toLocaleDateString()}`}
              </span>
            )}
            {goal.metadata?.weeklyCommitment && goal.metadata.weeklyCommitment > 0 && (
              <span>{goal.metadata.weeklyCommitment}h/wk</span>
            )}
          </div>

          {goal.children && goal.children.length > 0 && (
            <div className="pt-1">
              {goal.children.map((child) => (
                <GoalCard key={child.id} goal={child} depth={depth + 1} onStatusChange={onStatusChange} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
