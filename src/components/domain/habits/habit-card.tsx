'use client'

import { Card, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Flame, CheckCircle2, Circle } from 'lucide-react'

interface HabitCardProps {
  habit: {
    id: string
    title: string
    streak: number
    longestStreak: number
    completedToday: boolean
    weeklyProgress: number[]
  }
  onLog?: (id: string) => void
}

export function HabitCard({ habit, onLog }: HabitCardProps) {
  return (
    <Card padding="sm" className="flex items-center gap-3 group hover:neo-shadow-sm neo-transition">
      <button
        onClick={() => onLog?.(habit.id)}
        className="shrink-0 rounded-sm p-0.5 hover:bg-bg-tertiary neo-transition"
        aria-label={habit.completedToday ? 'Logged' : 'Log today'}
      >
        {habit.completedToday ? (
          <CheckCircle2 className="h-6 w-6 text-success" />
        ) : (
          <Circle className="h-6 w-6 text-text-tertiary" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold truncate">{habit.title}</span>
          {habit.streak > 0 && (
            <Badge variant="warning" className="shrink-0 flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {habit.streak}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {habit.weeklyProgress.map((done, i) => (
            <div
              key={i}
              className={cn(
                'h-2 w-5 rounded-sm border border-border',
                done ? 'bg-success' : 'bg-bg-tertiary',
              )}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
