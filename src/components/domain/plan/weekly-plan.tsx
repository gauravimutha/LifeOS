'use client'

import { useState } from 'react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeeklyPlanProps {
  weekData?: Record<string, { taskCount: number; completedCount: number }>
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekDates(startDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function WeeklyPlan({ weekData }: WeeklyPlanProps) {
  const today = new Date()
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    return d
  })

  const weekDates = getWeekDates(weekStart)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const d = new Date(weekStart)
            d.setDate(d.getDate() - 7)
            setWeekStart(d)
          }}
          className="rounded-sm p-1 hover:bg-bg-tertiary neo-transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold">
          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </h2>
        <button
          onClick={() => {
            const d = new Date(weekStart)
            d.setDate(d.getDate() + 7)
            setWeekStart(d)
          }}
          className="rounded-sm p-1 hover:bg-bg-tertiary neo-transition"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0]
          const dayData = weekData?.[dateStr]
          const isToday = date.toDateString() === today.toDateString()

          return (
            <Card
              key={dateStr}
              padding="sm"
              variant={isToday ? 'highlighted' : 'default'}
              className={cn('flex flex-col items-center gap-1 text-center', isToday && 'border-accent')}
            >
              <span className="text-[10px] font-bold text-text-tertiary uppercase">{DAYS[i]}</span>
              <span className={cn('text-lg font-bold', isToday && 'text-accent')}>
                {date.getDate()}
              </span>
              {dayData ? (
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold">{dayData.taskCount} tasks</span>
                  {dayData.completedCount > 0 && (
                    <span className="text-[10px] text-success">{dayData.completedCount} done</span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-text-tertiary">Rest</span>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
