'use client'

import { Card } from '@/components/ui'
import { BookOpen, Smile, Meh, Frown } from 'lucide-react'

interface JournalCardProps {
  entry: {
    id: string
    title: string
    content: string
    mood?: number
    tags?: string[]
    createdAt: string
  }
  onClick?: (id: string) => void
}

const moodIcon = (mood?: number) => {
  if (!mood) return null
  if (mood >= 7) return <Smile className="h-4 w-4 text-success" />
  if (mood >= 4) return <Meh className="h-4 w-4 text-warning" />
  return <Frown className="h-4 w-4 text-error" />
}

export function JournalCard({ entry, onClick }: JournalCardProps) {
  return (
    <Card
      padding="md"
      className="cursor-pointer hover:neo-shadow-sm neo-transition group"
      onClick={() => onClick?.(entry.id)}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-sm border-2 border-border p-2 bg-bg-secondary">
          <BookOpen className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-sm truncate group-hover:text-accent neo-transition">
              {entry.title}
            </h3>
            {moodIcon(entry.mood)}
          </div>
          <p className="text-xs text-text-secondary line-clamp-2 mb-2">
            {entry.content}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-tertiary font-medium">
              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex gap-1">
                {entry.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded-sm bg-bg-tertiary text-text-tertiary font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
