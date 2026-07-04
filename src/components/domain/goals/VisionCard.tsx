'use client'

import type { Goal } from '@/types/goal'
import { Card, Badge } from '@/components/ui'
import { Eye } from 'lucide-react'
import Link from 'next/link'

interface VisionCardProps {
  vision: Goal
  longTermGoals?: Goal[]
}

export function VisionCard({ vision, longTermGoals = [] }: VisionCardProps) {
  return (
    <Link href={`/goals/${vision.id}`}>
      <Card variant="highlighted" className="group cursor-pointer hover:neo-shadow neo-transition h-full" padding="lg">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-5 w-5 text-accent" />
            <span className="neo-label">Vision</span>
          </div>

          <h3 className="text-lg font-bold mb-2 group-hover:text-accent neo-transition">
            {vision.title}
          </h3>

          {vision.description && (
            <p className="text-sm text-text-secondary mb-4 line-clamp-3 flex-1">
              {vision.description}
            </p>
          )}

          {longTermGoals.length > 0 && (
            <div className="mt-auto">
              <div className="flex items-center gap-1 text-xs text-text-tertiary mb-2">
                <span>Long-term goals</span>
                <Badge variant="default">{longTermGoals.length}</Badge>
              </div>
              <div className="space-y-1">
                {longTermGoals.slice(0, 3).map((lt) => (
                  <div key={lt.id} className="text-xs text-text-secondary truncate pl-2 border-l-2 border-border-light">
                    {lt.title}
                  </div>
                ))}
                {longTermGoals.length > 3 && (
                  <div className="text-xs text-text-tertiary pl-2">
                    +{longTermGoals.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
