'use client'

import { Card } from '@/components/ui'
import { AIChat } from '@/components/domain/ai/ai-chat'
import { CoachPersonalitySelector } from '@/components/domain/coach/CoachPersonalitySelector'
import {
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCheckinStore } from '@/stores/checkinStore'

const sessions = [
  { id: 's1', title: 'Weekly planning', date: 'Today', active: true },
  { id: 's2', title: 'Goal review', date: 'Yesterday', active: false },
  { id: 's3', title: 'Career discussion', date: 'Jun 28', active: false },
  { id: 's4', title: 'Morning check-in', date: 'Jun 27', active: false },
]

export default function AIChatPage() {
  const { todayCheckin } = useCheckinStore()
  const contextPills = [
    ...(todayCheckin
      ? [`Mood: ${todayCheckin.mood}/5`, `Energy: ${todayCheckin.energyMorning}/10`]
      : []),
    'Tasks: active',
    'Goals: in progress',
  ]

  return (
    <div className="animate-fade-in flex h-[calc(100vh-8rem)] gap-4">
      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        <AIChat context={contextPills} />
      </div>

      {/* Sidebar */}
      <div className="hidden w-72 flex-shrink-0 space-y-4 lg:block">
        {/* Coach Personality */}
        <Card padding="md">
          <CoachPersonalitySelector />
        </Card>

        {/* AI Context */}
        <Card padding="md" className="space-y-3">
          <h2 className="neo-label">AI Context</h2>
          <div className="space-y-2">
            {contextPills.map((pill) => (
              <div key={pill} className="rounded-sm border-2 border-border bg-bg px-3 py-1.5">
                <p className="text-xs font-medium">{pill}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Session Management */}
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="neo-label">Chat History</h2>
            <button className="flex h-6 w-6 items-center justify-center rounded-sm border-2 border-border bg-surface">
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm neo-transition',
                  session.active
                    ? 'bg-accent text-accent-text'
                    : 'hover:bg-bg-tertiary',
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-semibold">{session.title}</p>
                  <p className="text-[10px] opacity-70">{session.date}</p>
                </div>
                {!session.active && (
                  <Trash2 className="h-3 w-3 flex-shrink-0 text-text-tertiary" />
                )}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
