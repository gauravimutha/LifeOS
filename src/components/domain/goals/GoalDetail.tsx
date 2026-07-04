'use client'

import type { Goal, GoalAIAnalysis } from '@/types/goal'
import { Card, Badge, Button } from '@/components/ui'
import { GoalProgress } from './GoalProgress'
import { GoalRelationships } from './GoalRelationships'
import { calculateHealthScore, calculateConfidenceScore, getMilestonesStatus } from '@/engine'
import { cn } from '@/lib/utils'
import { Clock, AlertTriangle, TrendingUp, Sparkles, ArrowLeft, RotateCcw, CheckCircle2, Pause, XCircle, Archive, Check } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface GoalDetailProps {
  goal: Goal
  analysis: GoalAIAnalysis | null
  children: Goal[]
  onStatusChange?: (id: string, status: Goal['status']) => void
}

export function GoalDetail({ goal, analysis, onStatusChange }: GoalDetailProps) {
  const [showAllMetrics, setShowAllMetrics] = useState(false)

  const health = calculateHealthScore(goal)
  const confidence = calculateConfidenceScore(analysis ?? goal.metadata?.aiAnalysis)
  const effectiveAnalysis = analysis ?? goal.metadata?.aiAnalysis

  const statusActions: { label: string; status: Goal['status']; icon: React.ReactNode; variant: 'primary' | 'secondary' | 'ghost' | 'danger' }[] = []
  if (goal.status === 'draft' || goal.status === 'paused') {
    statusActions.push({ label: 'Activate', status: 'active', icon: <RotateCcw className="h-4 w-4" />, variant: 'primary' })
  }
  if (goal.status === 'active') {
    statusActions.push({ label: 'Pause', status: 'paused', icon: <Pause className="h-4 w-4" />, variant: 'secondary' })
    statusActions.push({ label: 'Complete', status: 'completed', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'primary' })
    statusActions.push({ label: 'Cancel', status: 'cancelled', icon: <XCircle className="h-4 w-4" />, variant: 'danger' })
  }
  if (goal.status === 'completed') {
    statusActions.push({ label: 'Archive', status: 'archived', icon: <Archive className="h-4 w-4" />, variant: 'secondary' })
    statusActions.push({ label: 'Reactivate', status: 'active', icon: <RotateCcw className="h-4 w-4" />, variant: 'primary' })
  }
  if (goal.status === 'cancelled') {
    statusActions.push({ label: 'Reopen', status: 'draft', icon: <RotateCcw className="h-4 w-4" />, variant: 'primary' })
  }

  const [steps, setSteps] = useState<any[]>([])
  const [loadingSteps, setLoadingSteps] = useState(true)

  const loadSteps = async () => {
    try {
      const res = await fetch(`/api/tasks?goalId=${goal.id}`)
      const json = await res.json()
      if (json.data) {
        setSteps(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSteps(false)
    }
  }

  useEffect(() => {
    loadSteps()
  }, [goal.id])

  const handleToggleStep = async (stepId: string) => {
    try {
      const res = await fetch(`/api/tasks/${stepId}/complete`, { method: 'POST' })
      if (res.ok) {
        loadSteps()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const completedCount = steps.filter(s => s.status === 'completed').length
  const totalCount = steps.length
  const stepPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/goals" className="neo-transition text-text-secondary hover:text-text-primary">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Goals
          </Button>
        </Link>

        {statusActions.length > 0 && (
          <div className="flex items-center gap-2">
            {statusActions.map((action) => (
              <Button
                key={action.status}
                variant={action.variant}
                size="sm"
                onClick={() => onStatusChange?.(goal.id, action.status)}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Title & Status */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={goal.status === 'completed' ? 'success' : goal.status === 'active' ? 'primary' : 'default'}>
            {goal.status}
          </Badge>
          <Badge variant="default">{goal.level}</Badge>
          {goal.metadata?.category && (
            <Badge variant="primary">{goal.metadata.category}</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold">{goal.title}</h1>
        {goal.description && (
          <p className="text-text-secondary mt-1">{goal.description}</p>
        )}
      </div>

      {effectiveAnalysis?.realityCheck && (
        <Card variant="highlighted" padding="md" className="border-warning bg-warning-bg/10">
          <div className="flex gap-3 items-start text-warning">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-warning" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-warning">AI Reality Check & Conflicts</p>
              <p className="text-sm font-bold mt-1 text-text-primary leading-relaxed">{effectiveAnalysis.realityCheck}</p>
              {effectiveAnalysis.conflicts && effectiveAnalysis.conflicts.length > 0 && (
                <ul className="list-disc list-inside text-xs mt-2 text-text-secondary space-y-1">
                  {effectiveAnalysis.conflicts.map((conflict: string, idx: number) => (
                    <li key={idx}>{conflict}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Health & Confidence Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard
          label="Health Score"
          value={health}
          icon={<TrendingUp className="h-4 w-4" />}
          variant={health >= 70 ? 'success' : health >= 40 ? 'warning' : 'error'}
        />
        <ScoreCard
          label="AI Confidence"
          value={confidence}
          icon={<Sparkles className="h-4 w-4" />}
          variant={confidence >= 70 ? 'success' : confidence >= 40 ? 'warning' : 'error'}
        />
        <ScoreCard
          label="Progress"
          value={goal.progress}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant={goal.progress >= 100 ? 'success' : goal.progress >= 50 ? 'warning' : 'default'}
          isProgress
        />
        <ScoreCard
          label="Priority"
          value={goal.priority * 25}
          displayValue={`P${goal.priority}`}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={goal.priority >= 4 ? 'error' : goal.priority >= 3 ? 'warning' : 'default'}
        />
      </div>

      {/* Progress & Dates */}
      <Card padding="md">
        <div className="space-y-3">
          <GoalProgress progress={goal.progress} size="lg" />

          <div className="flex items-center gap-4 text-sm text-text-secondary">
            {goal.startDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Started {new Date(goal.startDate).toLocaleDateString()}</span>
              </div>
            )}
            {goal.targetDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span className={cn(new Date(goal.targetDate) < new Date() ? 'text-error font-semibold' : '')}>
                  Due {new Date(goal.targetDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {goal.metadata?.estimatedDuration && (
              <span>Est: {goal.metadata.estimatedDuration}</span>
            )}
            {goal.metadata?.weeklyCommitment && goal.metadata.weeklyCommitment > 0 && (
              <span>{goal.metadata.weeklyCommitment}h/week</span>
            )}
          </div>
        </div>
      </Card>

      {goal.metadata?.whyItMatters && (
        <Card variant="highlighted" padding="md">
          <p className="neo-label mb-1">Why This Matters</p>
          <p className="text-text-primary">{goal.metadata.whyItMatters}</p>
        </Card>
      )}

      {/* Roadmap Steps */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <h3 className="font-bold text-sm uppercase tracking-wider">AI Generated Roadmap Pathway</h3>
          </div>
          <span className="text-xs text-text-tertiary">
            {completedCount}/{totalCount} completed ({stepPercentage}%)
          </span>
        </div>

        {loadingSteps ? (
          <div className="py-6 text-center text-xs text-text-tertiary animate-pulse">Loading roadmap path...</div>
        ) : steps.length > 0 ? (
          <div className="space-y-2">
            {steps.map((m, i) => (
              <div key={m.id} className="flex items-start gap-3 p-2 rounded-sm hover:bg-bg-secondary neo-transition">
                <button
                  onClick={() => handleToggleStep(m.id)}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer',
                    m.status === 'completed' ? 'border-success bg-success text-white' : 'border-border bg-surface'
                  )}
                >
                  {m.status === 'completed' && <Check className="h-3 w-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', m.status === 'completed' && 'line-through text-text-tertiary')}>{m.title}</p>
                  {m.description && (
                    <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{m.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-text-tertiary italic">No roadmap steps generated yet. Re-generate goal analysis to build a path.</div>
        )}
      </Card>

      {/* AI Analysis Sections */}
      {effectiveAnalysis && (
        <>
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="font-bold">Success Metrics</h3>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {(effectiveAnalysis.successMetrics ?? []).map((m, i) => (
                <li key={i} className="text-sm text-text-secondary">{m}</li>
              ))}
            </ul>
          </Card>

          {(effectiveAnalysis.risks && effectiveAnalysis.risks.length > 0) && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-error" />
                <h3 className="font-bold">Risks & Mitigations</h3>
              </div>
              <div className="space-y-2">
                {effectiveAnalysis.risks.map((r, i) => (
                  <div key={i} className="p-2 bg-error-bg rounded-sm border border-error/20">
                    <div className="flex items-center gap-2 text-sm font-semibold text-error">
                      <span>{r.description}</span>
                      <span className="text-[10px] uppercase">({r.likelihood}, {r.impact})</span>
                    </div>
                    {r.mitigation && (
                      <p className="text-xs text-text-secondary mt-1">{r.mitigation}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(effectiveAnalysis.skillsRequired && effectiveAnalysis.skillsRequired.length > 0) && (
            <Card padding="md">
              <h3 className="font-bold mb-2">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {effectiveAnalysis.skillsRequired.map((s, i) => (
                  <Badge key={i} variant="primary">{s}</Badge>
                ))}
              </div>
            </Card>
          )}

          {effectiveAnalysis.resources && effectiveAnalysis.resources.length > 0 && (
            <Card padding="md">
              <h3 className="font-bold mb-2">Resources</h3>
              <div className="flex flex-wrap gap-2">
                {effectiveAnalysis.resources.map((r, i) => (
                  <Badge key={i} variant="default">{r}</Badge>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {goal.metadata?.aiAnalysis && !analysis && (
        <Card variant="ai" padding="md">
          <Button variant="ghost" size="sm" onClick={() => setShowAllMetrics(!showAllMetrics)}>
            {showAllMetrics ? 'Hide' : 'Show'} Full AI Analysis
          </Button>
        </Card>
      )}

      {/* Relationships */}
      <GoalRelationships goalId={goal.id} />
    </div>
  )
}

function ScoreCard({ label, value, icon, variant, isProgress, displayValue }: {
  label: string
  value: number
  icon: React.ReactNode
  variant: 'success' | 'warning' | 'error' | 'default'
  isProgress?: boolean
  displayValue?: string
}) {
  const colors = {
    success: 'text-success border-success bg-success-bg',
    warning: 'text-warning border-warning bg-warning-bg',
    error: 'text-error border-error bg-error-bg',
    default: 'text-text-primary border-border bg-surface',
  }

  return (
    <Card padding="md" className="text-center">
      <div className={cn('inline-flex items-center justify-center w-8 h-8 rounded-sm border-2 mb-2', colors[variant])}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{displayValue ?? `${value}%`}</p>
      <p className="text-xs text-text-tertiary mt-0.5">{label}</p>
      {isProgress && (
        <div className="mt-2 h-1 rounded-full bg-bg-tertiary overflow-hidden">
          <div className={cn('h-full rounded-full', variant === 'success' ? 'bg-success' : variant === 'warning' ? 'bg-warning' : 'bg-accent')}
               style={{ width: `${value}%` }} />
        </div>
      )}
    </Card>
  )
}
