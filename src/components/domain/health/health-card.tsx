'use client'

import { Card } from '@/components/ui'
import { Heart, Moon, Zap } from 'lucide-react'

interface HealthCardProps {
  data: {
    date: string
    sleepHours?: number
    energyLevel?: number
    moodLevel?: number
  }
}

export function HealthCard({ data }: HealthCardProps) {
  return (
    <Card padding="md">
      <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">
        {new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-sm border-2 border-border bg-bg-secondary">
          <Moon className="h-5 w-5 text-domain-health" />
          <span className="text-lg font-bold">{data.sleepHours ?? '-'}</span>
          <span className="text-[10px] font-semibold text-text-tertiary uppercase">Sleep</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-sm border-2 border-border bg-bg-secondary">
          <Zap className="h-5 w-5 text-warning" />
          <span className="text-lg font-bold">{data.energyLevel ?? '-'}</span>
          <span className="text-[10px] font-semibold text-text-tertiary uppercase">Energy</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-sm border-2 border-border bg-bg-secondary">
          <Heart className="h-5 w-5 text-error" />
          <span className="text-lg font-bold">{data.moodLevel ?? '-'}</span>
          <span className="text-[10px] font-semibold text-text-tertiary uppercase">Mood</span>
        </div>
      </div>
    </Card>
  )
}
