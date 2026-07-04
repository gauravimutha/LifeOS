'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Textarea, Modal, Badge } from '@/components/ui'
import {
  Clock,
  Plus,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Briefcase,
  Trash2,
  Sparkles,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

interface RoutineStep {
  id: string
  title: string
  description?: string
  order: number
  durationMinutes?: number
}

interface DbRoutine {
  id: string
  title: string
  description?: string
  routineType: string
  timeOfDay?: string
  durationMinutes?: number
  isFlexible: boolean
  status: string
  steps: RoutineStep[]
}

function getRoutineIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'morning':
      return { icon: Sun, color: 'bg-warning' }
    case 'evening':
      return { icon: Moon, color: 'bg-indigo-600' }
    case 'afternoon':
    case 'work':
      return { icon: Briefcase, color: 'bg-domain-career' }
    default:
      return { icon: Clock, color: 'bg-domain-learning' }
  }
}

export default function RoutinesPage() {
  const user = useAuthStore((s) => s.user)
  const [routines, setRoutines] = useState<DbRoutine[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [limits, setLimits] = useState({ usedThisMonth: 0, limit: 3 })
  const [expanded, setExpanded] = useState<string | null>(null)
  
  // Custom Routine Form State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newType, setNewType] = useState('morning')
  const [newTimeOfDay, setNewTimeOfDay] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [newIsFlexible, setNewIsFlexible] = useState(true)

  // AI Generation Confirmation Modal
  const [showGeneratorConfirm, setShowGeneratorConfirm] = useState(false)

  // New Routine Step Input States (keyed by routineId)
  const [newStepTitles, setNewStepTitles] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      fetchRoutines()
    }
  }, [user])

  async function fetchRoutines() {
    if (!user) return
    setLoading(true)
    try {
      const [routinesRes, limitsRes] = await Promise.all([
        fetch(`/api/routines?userId=${user.id}`),
        fetch(`/api/routines/generate?userId=${user.id}`),
      ])
      const routinesJson = await routinesRes.json()
      const limitsJson = await limitsRes.json()
      if (routinesJson.data) setRoutines(routinesJson.data)
      if (limitsJson.data) setLimits(limitsJson.data)
    } catch (err) {
      console.error('Failed to load routines:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleStatus(routineId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch(`/api/routines/${routineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setRoutines((prev) =>
          prev.map((r) => (r.id === routineId ? { ...r, status: newStatus } : r))
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDeleteRoutine(routineId: string) {
    if (!confirm('Are you sure you want to delete this routine?')) return
    try {
      const res = await fetch(`/api/routines/${routineId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchRoutines()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCreateRoutine(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newTitle.trim()) return

    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          routineType: newType,
          timeOfDay: newTimeOfDay || undefined,
          durationMinutes: newDuration ? Number(newDuration) : undefined,
          isFlexible: newIsFlexible,
        }),
      })
      if (res.ok) {
        setShowAddModal(false)
        setNewTitle('')
        setNewDescription('')
        setNewType('morning')
        setNewTimeOfDay('')
        setNewDuration('')
        setNewIsFlexible(true)
        fetchRoutines()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAddStep(routineId: string) {
    const stepTitle = newStepTitles[routineId]?.trim()
    if (!stepTitle) return

    try {
      const res = await fetch(`/api/routines/${routineId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: stepTitle }),
      })
      if (res.ok) {
        setNewStepTitles((prev) => ({ ...prev, [routineId]: '' }))
        fetchRoutines()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDeleteStep(routineId: string, stepId: string) {
    try {
      const res = await fetch(`/api/routines/${routineId}/steps/${stepId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchRoutines()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleGenerateRoutines() {
    if (!user) return
    setGenerating(true)
    setShowGeneratorConfirm(false)
    try {
      const res = await fetch('/api/routines/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const json = await res.json()
      if (res.ok) {
        fetchRoutines()
      } else {
        alert(json.error?.message || 'Failed to generate routines')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Routines</h1>
          <p className="text-sm text-text-secondary">
            Morning, evening, and custom productivity structures
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 border-dashed border-accent hover:bg-accent-light text-accent"
            onClick={() => setShowGeneratorConfirm(true)}
            disabled={generating}
          >
            <Sparkles className="h-4 w-4" />
            AI Generator
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)} disabled={generating}>
            <Plus className="h-4 w-4" />
            Add Routine
          </Button>
        </div>
      </div>

      {/* Usage notice (sticky notice bar) */}
      <div className="rounded-sm border-2 border-accent bg-accent-light px-4 py-2.5 text-xs font-semibold text-accent flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          AI Routine Generator Usage Limit: {limits.usedThisMonth}/{limits.limit} used this month.
        </span>
        <span>{limits.limit - limits.usedThisMonth} generations remaining</span>
      </div>

      {/* Loading state */}
      {loading && !generating && (
        <div className="py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-text-tertiary mb-2" />
          <span className="text-sm text-text-tertiary">Loading daily structures...</span>
        </div>
      )}

      {/* AI Generating Animation Cover */}
      {generating && (
        <Card padding="lg" className="border-dashed border-accent bg-accent-light/50">
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <div>
              <h2 className="text-lg font-bold text-accent">Structuring Your Routines...</h2>
              <p className="text-xs text-text-secondary mt-1 max-w-sm">
                Our AI Chief of Staff is mapping optimal focus slots and buffers based on your goals. This takes a few seconds...
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Routine Groups */}
      {!loading && !generating && routines.length > 0 && (
        <div className="space-y-4">
          {routines.map((routine) => {
            const isExpanded = expanded === routine.id
            const isActive = routine.status === 'active'
            const { icon: Icon, color } = getRoutineIcon(routine.routineType)

            return (
              <Card key={routine.id} padding="md" className={cn('space-y-3 neo-transition', !isActive && 'opacity-60')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-sm text-white', color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold">{routine.title}</h3>
                        {routine.timeOfDay && (
                          <Badge variant="primary" className="text-[9px] py-0.5 px-1.5">
                            {routine.timeOfDay}
                          </Badge>
                        )}
                        {routine.isFlexible && (
                          <Badge variant="default" className="text-[9px] py-0.5 px-1.5 border border-border bg-bg">
                            Flexible
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-tertiary">
                        {routine.steps.length} steps • {routine.durationMinutes || 'flexible'} mins
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(routine.id, routine.status)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-sm border-2 neo-transition active:scale-95',
                        isActive ? 'border-accent bg-accent text-accent-text neo-shadow-sm' : 'border-border bg-surface',
                      )}
                      aria-label={isActive ? 'Pause routine' : 'Activate routine'}
                    >
                      {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : routine.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-border bg-surface active:scale-95 neo-transition"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-3 border-t-2 border-border pt-3">
                    {routine.description && (
                      <p className="text-xs text-text-secondary italic">{routine.description}</p>
                    )}

                    <div className="space-y-1.5">
                      {routine.steps.map((step, i) => (
                        <div key={step.id} className="flex items-center justify-between rounded-sm bg-bg p-2 border border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded-sm border-2 border-border bg-surface text-[10px] font-bold">
                              {i + 1}
                            </div>
                            <span className="text-sm font-medium">{step.title}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteStep(routine.id, step.id)}
                            className="text-text-tertiary hover:text-error neo-transition p-1"
                            aria-label="Delete step"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add step form */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newStepTitles[routine.id] || ''}
                        onChange={(e) =>
                          setNewStepTitles((prev) => ({ ...prev, [routine.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddStep(routine.id)
                        }}
                        placeholder="Add details for the next step..."
                        className="neo-input flex-1 h-8 text-xs px-2.5 py-1"
                      />
                      <Button size="sm" onClick={() => handleAddStep(routine.id)} className="h-8 text-xs px-3">
                        Add Step
                      </Button>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border-light">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-error hover:bg-error-bg"
                        onClick={() => handleDeleteRoutine(routine.id)}
                      >
                        Delete Routine
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !generating && routines.length === 0 && (
        <Card padding="lg" className="border-dashed border-border">
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 max-w-md mx-auto">
            <Clock className="h-12 w-12 text-text-tertiary" />
            <div>
              <h2 className="text-lg font-bold">Build Your Daily Structures</h2>
              <p className="mt-1.5 text-sm text-text-secondary">
                Routines keep you consistent. Generate your first routines using AI, or construct your own custom routines from scratch.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2 w-full justify-center">
              <Button
                variant="primary"
                onClick={() => setShowGeneratorConfirm(true)}
                className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-hover text-accent-text"
              >
                <Sparkles className="h-4 w-4" />
                Generate Routines with AI
              </Button>
              <Button variant="outline" onClick={() => setShowAddModal(true)}>
                Create Custom Routine
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* AI Generator Confirmation Modal */}
      <Modal
        open={showGeneratorConfirm}
        onClose={() => setShowGeneratorConfirm(false)}
        title="AI Routine Generator"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-sm border-2 border-accent bg-accent-light p-3">
            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-accent">Usage Notice</h4>
              <p className="text-xs text-text-secondary mt-0.5">
                Each generation consumes 1 of your 3 monthly slots. Remaining: {limits.limit - limits.usedThisMonth}
              </p>
            </div>
          </div>

          {routines.length > 0 && (
            <div className="flex items-start gap-3 rounded-sm border-2 border-warning bg-warning-bg p-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-warning">Warning: Overwrite Existing Routines</h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Confirming this action will **replace all your existing routines** with new AI-personalized ones.
                </p>
              </div>
            </div>
          )}

          <div className="text-xs text-text-secondary leading-relaxed space-y-1.5 bg-bg p-3 border border-border-light rounded-sm">
            <p className="font-bold text-text-primary mb-1">What our AI does:</p>
            <p>• Analyzes your stage of life, commitments, and daily focused hours.</p>
            <p>• Structures your day into balanced Morning, Afternoon/Work, and Evening schedules.</p>
            <p>• Populates routines with highly actionable steps for immediate execution.</p>
          </div>

          <div className="flex justify-end gap-2 border-t-2 border-border pt-3 mt-4">
            <Button variant="outline" onClick={() => setShowGeneratorConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={limits.usedThisMonth >= limits.limit}
              onClick={handleGenerateRoutines}
              className="flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Generate Routines ({limits.usedThisMonth}/{limits.limit} used)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Custom Routine Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Create Custom Routine">
        <form onSubmit={handleCreateRoutine} className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Deep Work block, Sunday reset"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="Briefly state the goal or mindset of this routine..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="neo-label">Routine Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="neo-input h-10 w-full"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon / Work</option>
                <option value="evening">Evening</option>
                <option value="flexible">Flexible / General</option>
              </select>
            </div>

            <Input
              label="Time of Day"
              type="time"
              value={newTimeOfDay}
              onChange={(e) => setNewTimeOfDay(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (minutes)"
              type="number"
              min="1"
              placeholder="e.g. 60"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
            />

            <div className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                id="isFlexible"
                checked={newIsFlexible}
                onChange={(e) => setNewIsFlexible(e.target.checked)}
                className="rounded border-border border-2 text-accent focus:ring-accent h-4 w-4"
              />
              <label htmlFor="isFlexible" className="text-sm font-semibold cursor-pointer select-none">
                Flexible Schedule
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t-2 border-border pt-3 mt-4">
            <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Routine
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
