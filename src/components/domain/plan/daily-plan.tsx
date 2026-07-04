'use client'

import { Card, Button } from '@/components/ui'
import { TimeBlock } from './time-block'
import { Plus, Sparkles, Clock } from 'lucide-react'
import { usePlanStore } from '@/stores/plan.store'

interface DailyPlanProps {
  onAddBlock?: () => void
  onAISuggest?: () => void
}

export function DailyPlan({ onAddBlock, onAISuggest }: DailyPlanProps) {
  const currentDailyPlan = usePlanStore((s) => s.currentDailyPlan)
  const toggleBlockComplete = usePlanStore((s) => s.toggleBlockComplete)
  const currentDate = usePlanStore((s) => s.currentDate)

  const timeBlocks = currentDailyPlan?.timeBlocks ?? []
  const completedCount = timeBlocks.filter((b) => b.completed).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          <p className="text-sm text-text-tertiary">
            {completedCount}/{timeBlocks.length} blocks completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onAISuggest && (
            <Button variant="ghost" size="sm" onClick={onAISuggest}>
              <Sparkles className="h-4 w-4" />
              AI Suggest
            </Button>
          )}
          {onAddBlock && (
            <Button size="sm" onClick={onAddBlock}>
              <Plus className="h-4 w-4" />
              Add Block
            </Button>
          )}
        </div>
      </div>

      {timeBlocks.length === 0 ? (
        <Card padding="lg" variant="ghost">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-text-tertiary mb-3" />
            <p className="text-sm text-text-tertiary mb-3">No blocks scheduled for today</p>
            <div className="flex gap-2">
              {onAddBlock && (
                <Button size="sm" onClick={onAddBlock}>
                  <Plus className="h-4 w-4" /> Add Block
                </Button>
              )}
              {onAISuggest && (
                <Button variant="secondary" size="sm" onClick={onAISuggest}>
                  <Sparkles className="h-4 w-4" /> AI Plan
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-1">
          {timeBlocks.map((block) => (
            <TimeBlock
              key={block.id}
              block={block}
              onComplete={toggleBlockComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
