'use client'

import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Sparkles, Sun, ListTodo, Heart, TrendingUp } from 'lucide-react'
import { getGreeting } from '@/lib/utils'

interface AIBriefingProps {
  greeting?: string
  topPriorities?: string[]
  healthSnapshot?: {
    sleep?: number
    energy?: number
    mood?: number
  }
  insight?: string
  className?: string
}

export function AIBriefing({
  greeting,
  topPriorities = [],
  healthSnapshot,
  insight,
  className,
}: AIBriefingProps) {
  const timeGreeting = greeting ?? getGreeting()

  return (
    <Card
      variant="highlighted"
      padding="md"
      className={cn('bg-accent-light/30', className)}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-sm border-2 border-accent bg-accent p-2">
          <Sparkles className="h-5 w-5 text-accent-text" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Sun className="h-4 w-4 text-warning" />
              <h2 className="text-base font-bold">{timeGreeting}</h2>
            </div>
            <p className="text-xs text-text-secondary">
              Here&apos;s your briefing for today
            </p>
          </div>

          {topPriorities.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <ListTodo className="h-3.5 w-3.5 text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Top Priorities
                </span>
              </div>
              <ul className="space-y-1">
                {topPriorities.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-accent text-[10px] font-bold text-accent-text">
                      {i + 1}
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {healthSnapshot && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Heart className="h-3.5 w-3.5 text-error" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Health Snapshot
                </span>
              </div>
              <div className="flex gap-3 text-xs">
                {healthSnapshot.sleep !== undefined && (
                  <span className="font-semibold">
                    Sleep: <span className="text-text-secondary">{healthSnapshot.sleep}h</span>
                  </span>
                )}
                {healthSnapshot.energy !== undefined && (
                  <span className="font-semibold">
                    Energy: <span className="text-text-secondary">{healthSnapshot.energy}/10</span>
                  </span>
                )}
                {healthSnapshot.mood !== undefined && (
                  <span className="font-semibold">
                    Mood: <span className="text-text-secondary">{healthSnapshot.mood}/10</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {insight && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-domain-learning" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Insight
                </span>
              </div>
              <p className="text-sm italic text-text-secondary border-l-2 border-accent pl-3">
                {insight}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
