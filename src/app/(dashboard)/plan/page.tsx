'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge, toast } from '@/components/ui'
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  Sparkles,
  TrendingUp,
  Battery,
  AlertCircle,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addDays, subDays } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'

interface TimeBlock {
  startTime: string
  endTime: string
  activity: string
  type: 'task' | 'break' | 'focus' | 'meeting' | 'personal'
  taskId?: string
  goalTitle?: string
  projectTitle?: string
  completed?: boolean
  reason?: string
}

export default function PlanPage() {
  const user = useAuthStore((s) => s.user)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'daily' | 'weekly'>('daily')
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [aiExplanation, setAiExplanation] = useState<string>('')
  const [optimizing, setOptimizing] = useState(false)
  const [customRequestInput, setCustomRequestInput] = useState('')

  const dateStr = currentDate.toISOString().split('T')[0]

  useEffect(() => {
    if (user) {
      loadPlan()
    }
  }, [user, dateStr, view])

  async function loadPlan() {
    setLoading(true)
    try {
      const response = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          type: view,
          date: dateStr,
        }),
      })
      const result = await response.json()
      if (result.data) {
        setTimeBlocks(result.data.blocks || [])
        setAiExplanation(result.data.explanation || '')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleOptimize(optimizeType?: string) {
    if (!user) return
    setOptimizing(true)
    try {
      const response = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'daily',
          date: dateStr,
          optimizeType: optimizeType,
        }),
      })
      const result = await response.json()
      if (result.data) {
        setTimeBlocks(result.data.blocks || [])
        setAiExplanation(result.data.explanation || '')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setOptimizing(false)
    }
  }

  async function handleGenerateWithRequest() {
    if (!user || !customRequestInput.trim()) return
    setOptimizing(true)
    try {
      const response = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'daily',
          date: dateStr,
          customRequest: customRequestInput.trim(),
        }),
      })
      const result = await response.json()
      if (result.data) {
        setTimeBlocks(result.data.blocks || [])
        setAiExplanation(result.data.explanation || '')
        setCustomRequestInput('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setOptimizing(false)
    }
  }

  const formatBlockTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return format(d, 'HH:mm')
    } catch {
      return '--:--'
    }
  }

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'focus':
        return 'bg-accent'
      case 'meeting':
        return 'bg-info'
      case 'habit':
        return 'bg-domain-health'
      case 'task':
        return 'bg-warning'
      case 'break':
        return 'bg-bg-tertiary'
      default:
        return 'bg-domain-learning'
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plan</h1>
          <p className="text-sm text-text-secondary">
            AI-driven dynamic day scheduling and energy planning
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => handleOptimize()}
          disabled={loading || optimizing}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sparkles className="h-4 w-4" />
          Generate Daily Plan
        </Button>
      </div>

      {/* Productivity Blueprint Banner */}
      <Card variant="ai" padding="sm" className="bg-accent-light/10 border-dashed border-accent/40 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-accent shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong>LifeOS Blueprint</strong>: Your <strong className="text-accent">Tasks</strong> represent <em>what</em> needs to be done. Your <strong className="text-accent">Daily Plan</strong> places those tasks into optimized hourly blocks so you can focus and execute.
          </p>
        </div>
      </Card>

      {/* View Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-sm border-2 border-border">
          {(['daily', 'weekly'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-4 py-1.5 text-xs font-bold uppercase neo-transition',
                view === v ? 'bg-accent text-accent-text' : 'bg-surface hover:bg-bg-tertiary',
              )}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate((d) => subDays(d, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-border bg-surface"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold min-w-[140px] text-center">
            {format(currentDate, 'EEE, MMM d')}
          </span>
          <button
            onClick={() => setCurrentDate((d) => addDays(d, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-border bg-surface"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Time Blocks */}
        <div className="space-y-4">
          {loading ? (
            <Card padding="lg" className="flex items-center justify-center py-12">
              <span className="text-sm text-text-secondary animate-pulse">Assembling context and scheduling...</span>
            </Card>
          ) : timeBlocks.length > 0 ? (
            <Card padding="sm" className="divide-y-2 divide-border">
              {timeBlocks.map((block, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex items-center gap-4 p-4 hover:bg-bg-secondary neo-transition animate-fade-in",
                    block.type === 'task' && "pl-8 border-l-4 border-l-accent bg-accent-light/5 dark:bg-accent/5",
                    block.completed && "opacity-60 bg-bg-secondary"
                  )}
                >
                  {block.type === 'task' && block.taskId ? (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/tasks/${block.taskId}/complete`, { method: 'POST' })
                          if (res.ok) {
                            toast("Task progress updated! 🎉", "success")
                            loadPlan()
                          }
                        } catch (e) {
                          console.error(e)
                        }
                      }}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 border-border bg-surface hover:bg-success-bg hover:border-success transition-all cursor-pointer"
                      aria-label="Toggle task status"
                    >
                      {block.completed && <Check className="h-3.5 w-3.5 text-success" />}
                    </button>
                  ) : (
                    <div className={cn('h-10 w-1.5 rounded-sm shrink-0', getBlockColor(block.type))} />
                  )}

                  <div className="w-16 text-xs font-mono font-bold text-text-secondary">
                    {formatBlockTime(block.startTime)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-bold truncate",
                      block.completed && "line-through text-text-tertiary"
                    )}>
                      {block.activity}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-text-tertiary capitalize font-semibold">{block.type}</span>
                      {block.goalTitle && (
                        <Badge variant="success" className="text-[9px] py-0 px-1 border border-success/35">
                          🎯 {block.goalTitle}
                        </Badge>
                      )}
                      {block.projectTitle && (
                        <Badge variant="accent" className="text-[9px] py-0 px-1 border border-accent/35">
                          📁 {block.projectTitle}
                        </Badge>
                      )}
                    </div>
                    {block.reason && (
                      <p className="text-[11px] text-accent font-medium leading-relaxed mt-1.5 italic">
                        💡 {block.reason}
                      </p>
                    )}
                  </div>

                  <Badge variant="default" className="text-[10px] capitalize shrink-0">
                    {block.type}
                  </Badge>
                </div>
              ))}
            </Card>
          ) : (
            <Card padding="lg" className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-text-tertiary mb-3" />
              <h3 className="text-lg font-bold">No tasks scheduled for today</h3>
              <p className="text-sm text-text-secondary mt-1">
                Use goals or task manager to add work for this day.
              </p>
            </Card>
          )}
        </div>

        {/* AI Chief of Staff Planning Panel */}
        <div className="space-y-4">
          <Card variant="ai" padding="md" className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" />
              <h2 className="neo-label text-accent">Chief of Staff</h2>
            </div>

            {aiExplanation && (
              <div className="space-y-2 rounded-sm border-2 border-dashed border-accent bg-accent-light p-4 dark:bg-accent/10">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
                  <span className="text-xs font-bold text-accent">Planning Rationale</span>
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">
                  {aiExplanation}
                </p>
              </div>
            )}

            {/* Custom Scheduling Request */}
            <div className="space-y-2 border-t-2 border-border/30 pt-3">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Custom Request</p>
              <textarea
                placeholder="e.g., Focus on GATE prep, make today a light day, or schedule more breaks..."
                value={customRequestInput}
                onChange={(e) => setCustomRequestInput(e.target.value)}
                className="w-full min-h-[70px] text-xs resize-none bg-surface p-2.5 rounded-sm border-2 border-border focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={optimizing}
              />
              <Button
                size="sm"
                variant="primary"
                onClick={handleGenerateWithRequest}
                disabled={optimizing || !customRequestInput.trim()}
                className="w-full justify-center text-center h-9 text-xs font-bold"
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Customize & Build Plan
              </Button>
            </div>

            <div className="space-y-2 border-t-2 border-border/30 pt-3">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Optimize Schedule</p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOptimize()}
                  disabled={optimizing}
                  className="w-full justify-start text-left"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Align with Energy Profile
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOptimize('low_energy')}
                  disabled={optimizing}
                  className="w-full justify-start text-left text-error hover:text-error"
                >
                  <Battery className="h-3.5 w-3.5 mr-2" />
                  Activate Recovery Mode
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOptimize('new_urgent_task')}
                  disabled={optimizing}
                  className="w-full justify-start text-left text-info hover:text-info"
                >
                  <TrendingUp className="h-3.5 w-3.5 mr-2" />
                  Insert New Urgent Task
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
