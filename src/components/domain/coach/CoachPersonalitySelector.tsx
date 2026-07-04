'use client'

import { useCheckinStore } from '@/stores/checkinStore'
import { type CoachPersonality, COACH_PERSONALITIES } from '@/types/checkin'
import { cn } from '@/lib/utils'
import { Flame, Target, Heart, BookOpen, Brain } from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  Flame: <Flame className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  Brain: <Brain className="h-5 w-5" />,
}

export function CoachPersonalitySelector() {
  const { selectedPersonality, setSelectedPersonality } = useCheckinStore()

  return (
    <div className="space-y-3">
      <p className="neo-label">Coach Personality</p>
      <div className="grid gap-2 grid-cols-1">
        {COACH_PERSONALITIES.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPersonality(p as CoachPersonality)}
            className={cn(
              'flex items-start gap-3 rounded-sm border-2 p-3 text-left neo-transition',
              selectedPersonality?.id === p.id
                ? 'border-accent bg-accent-light'
                : 'border-border bg-surface hover:bg-bg-tertiary',
            )}
          >
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-sm',
              selectedPersonality?.id === p.id ? 'bg-accent text-accent-text' : 'bg-bg-tertiary text-text-secondary',
            )}>
              {iconMap[p.icon] ?? <Brain className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{p.label}</p>
              <p className="text-xs text-text-tertiary">{p.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
