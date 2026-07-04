'use client'

import type { Goal, GoalAIAnalysis } from '@/types/goal'
import { Card, Badge, Button, toast } from '@/components/ui'
import { GoalProgress } from './GoalProgress'
import { GoalRelationships } from './GoalRelationships'
import { calculateHealthScore, calculateConfidenceScore } from '@/engine'
import { cn } from '@/lib/utils'
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle2, 
  Pause, 
  XCircle, 
  Archive, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Award,
  Zap
} from 'lucide-react'
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
  const [steps, setSteps] = useState<any[]>([])
  const [loadingSteps, setLoadingSteps] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const health = calculateHealthScore(goal)
  const effectiveAnalysis = analysis ?? goal.metadata?.aiAnalysis

  // Extract AI Roadmap predictions
  const roadmap = (goal as any).roadmaps?.[0]
  const roadmapMetadata = roadmap?.metadata || {}
  const predictedCompletionDate = roadmapMetadata.predictedCompletionDate 
    ? new Date(roadmapMetadata.predictedCompletionDate).toLocaleDateString()
    : goal.targetDate 
      ? new Date(goal.targetDate).toLocaleDateString() 
      : 'Not estimated'
  const confidenceScore = roadmapMetadata.confidenceScore ?? 80
  const totalWeeks = roadmapMetadata.totalWeeks ?? 'TBD'
  const weeklyWorkload = roadmapMetadata.weeklyWorkload ?? 'TBD'

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

  const handleRegenerateRoadmap = async () => {
    if (!window.confirm("Are you sure you want to regenerate the AI roadmap for this goal? This will reset all your milestone tasks and replace them with a new AI strategy. This cannot be undone.")) {
      return
    }
    
    setRegenerating(true)
    try {
      const res = await fetch(`/api/goals/${goal.id}/roadmap`, {
        method: 'POST'
      })
      if (res.ok) {
        toast("AI Roadmap regenerated successfully! 🗺️", "success")
        loadSteps()
        window.location.reload()
      } else {
        const json = await res.json()
        toast(json.error?.message || "Failed to regenerate roadmap.", "error")
      }
    } catch (err) {
      console.error(err)
      toast("Failed to regenerate roadmap.", "error")
    } finally {
      setRegenerating(false)
    }
  }

  const completedCount = steps.filter(s => s.status === 'completed').length
  const totalCount = steps.length
  const stepPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Group steps by Phase Name
  const stepsByPhase: Record<string, any[]> = {}
  steps.forEach(step => {
    const phaseName = step.metadata?.phaseName || 'Phase 1: Foundation'
    if (!stepsByPhase[phaseName]) {
      stepsByPhase[phaseName] = []
    }
    stepsByPhase[phaseName].push(step)
  })

  // Order phase names (chronologically)
  const sortedPhases = Object.keys(stepsByPhase).sort()

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
          value={confidenceScore}
          icon={<Sparkles className="h-4 w-4" />}
          variant={confidenceScore >= 70 ? 'success' : confidenceScore >= 40 ? 'warning' : 'error'}
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

      {/* AI Long-Term Strategy Plan */}
      <Card padding="md" className="border-accent bg-accent/5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-accent mt-0.5 shrink-0 animate-pulse" />
          <div className="space-y-1 w-full">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-accent">AI Long-Term Execution Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-6 text-sm text-text-secondary mt-2">
              <div>
                <span className="font-bold text-text-primary">Predicted Goal Completion:</span> {predictedCompletionDate}
              </div>
              <div>
                <span className="font-bold text-text-primary">Recommended Workload:</span> {weeklyWorkload}
              </div>
              <div>
                <span className="font-bold text-text-primary">Total Duration:</span> {totalWeeks} weeks
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Goal Health Engine Diagnostics */}
      {(goal as any).health && (
        <Card padding="md" className="border-success/30 bg-success/5">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-success mt-0.5 shrink-0" />
            <div className="space-y-1 w-full">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-success">Goal Health Engine Diagnostics (Deterministic)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-2 gap-x-6 text-sm text-text-secondary mt-2">
                <div>
                  <span className="font-bold text-text-primary">Expected Progress:</span> {(goal as any).health.expectedProgress}%
                  <Badge variant={(goal as any).health.progressStatus === 'ahead' ? 'success' : (goal as any).health.progressStatus === 'behind' ? 'error' : 'default'} className="ml-1 text-[10px]">
                    {(goal as any).health.progressStatus}
                  </Badge>
                </div>
                <div>
                  <span className="font-bold text-text-primary">Time Remaining:</span> {(goal as any).health.timeRemainingDays} days
                </div>
                <div>
                  <span className="font-bold text-text-primary">Work Remaining:</span> {(goal as any).health.workRemainingHours} hours
                </div>
                <div>
                  <span className="font-bold text-text-primary">Recent Consistency:</span> {(goal as any).health.recentConsistency}%
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-sm text-text-secondary mt-2 pt-2 border-t border-border/40">
                <div>
                  <span className="font-bold text-text-primary">Overdue Steps:</span> {(goal as any).health.overdueTasksCount} tasks
                </div>
                <div>
                  <span className="font-bold text-text-primary">Health Standing:</span> <span className={cn('font-extrabold', (goal as any).health.healthLabel === 'Excellent' && 'text-success', (goal as any).health.healthLabel === 'Good' && 'text-emerald-500', (goal as any).health.healthLabel === 'Fair' && 'text-warning', (goal as any).health.healthLabel === 'Critical' && 'text-error')}>{(goal as any).health.healthLabel} ({(goal as any).health.healthScore}/100)</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {goal.metadata?.whyItMatters && (
        <Card variant="highlighted" padding="md">
          <p className="neo-label mb-1">Why This Matters</p>
          <p className="text-text-primary">{goal.metadata.whyItMatters}</p>
        </Card>
      )}

      {/* Adaptive Roadmap Controls */}
      <Card padding="md" className="border-dashed border-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm">Adaptive Roadmap Control</h4>
          <p className="text-xs text-text-secondary mt-0.5">Regenerate execution steps if your constraints, deadlines, or workload preferences change.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRegenerateRoadmap}
          disabled={regenerating}
        >
          {regenerating ? 'Regenerating Pathway...' : 'Regenerate AI Roadmap'}
        </Button>
      </Card>

      {/* Roadmap Steps */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4 border-b-2 border-border pb-2">
          <div className="flex items-center gap-1.5">
            <Award className="h-5 w-5 text-accent animate-pulse" />
            <h3 className="font-bold text-sm uppercase tracking-wider">AI Goal Roadmap Phases & Milestones</h3>
          </div>
          <span className="text-xs font-bold text-text-secondary bg-bg-tertiary px-2 py-0.5 border border-border">
            {completedCount}/{totalCount} completed ({stepPercentage}%)
          </span>
        </div>

        {loadingSteps ? (
          <div className="py-12 text-center text-xs text-text-tertiary animate-pulse">Loading roadmap timeline...</div>
        ) : steps.length > 0 ? (
          <div className="space-y-6">
            {sortedPhases.map((phaseName) => (
              <div key={phaseName} className="space-y-3">
                {/* Phase Header Banner */}
                <div className="bg-bg-tertiary border-2 border-border px-3 py-1.5 rounded-sm flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-widest text-text-primary">{phaseName}</span>
                  <Badge variant="primary" className="text-[10px]">
                    {stepsByPhase[phaseName].filter(s => s.status === 'completed').length}/{stepsByPhase[phaseName].length} Complete
                  </Badge>
                </div>

                {/* Milestone Checklist inside Phase */}
                <div className="space-y-2.5 pl-2">
                  {stepsByPhase[phaseName].map((m) => {
                    const isExpanded = expandedStep === m.id
                    const meta = m.metadata || {}
                    const objectives = meta.learningObjectives || []
                    const difficulty = meta.estimatedDifficulty || 'Medium'
                    const duration = meta.estimatedDuration || '2 hours'

                    return (
                      <div 
                        key={m.id} 
                        className={cn(
                          "border-2 border-border bg-surface p-3 rounded-sm neo-transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
                          m.status === 'completed' ? 'opacity-85 border-dashed border-success/40 bg-success-bg/5' : 'neo-shadow'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleStep(m.id)}
                              className={cn(
                                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer neo-transition',
                                m.status === 'completed' ? 'border-success bg-success text-white' : 'border-border bg-surface hover:border-accent'
                              )}
                            >
                              {m.status === 'completed' && <Check className="h-3 w-3 text-white" />}
                            </button>
                            <div>
                              <p className={cn('text-sm font-bold', m.status === 'completed' && 'line-through text-text-tertiary')}>{m.title}</p>
                              {m.description && (
                                <p className="text-xs text-text-secondary leading-relaxed mt-1">{m.description}</p>
                              )}
                              
                              {/* Metadata Badges */}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="default" className="text-[10px] py-0 px-1.5 font-mono">{duration}</Badge>
                                <Badge 
                                  variant={difficulty === 'Hard' ? 'error' : difficulty === 'Medium' ? 'primary' : 'default'} 
                                  className="text-[10px] py-0 px-1.5"
                                >
                                  {difficulty}
                                </Badge>
                                {objectives.length > 0 && (
                                  <button
                                    onClick={() => setExpandedStep(isExpanded ? null : m.id)}
                                    className="flex items-center gap-1 text-[11px] text-accent font-semibold hover:underline cursor-pointer"
                                  >
                                    <BookOpen className="h-3 w-3" />
                                    <span>{objectives.length} Learning Objectives</span>
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Learning Objectives Checklist */}
                        {isExpanded && objectives.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/60 bg-bg-secondary/40 p-2.5 rounded-sm">
                            <p className="text-[11px] uppercase tracking-widest font-extrabold text-accent mb-2">Learning Objectives & Outcomes</p>
                            <ul className="space-y-1.5">
                              {objectives.map((obj: string, oIdx: number) => (
                                <li key={oIdx} className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
                                  <Zap className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                                  <span>{obj}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-text-tertiary italic">No roadmap pathway milestones generated yet. Click "Regenerate AI Roadmap" to build a path.</div>
        )}
      </Card>

      {/* Success Metrics & Details */}
      {effectiveAnalysis && (
        <>
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Success Metrics</h3>
            </div>
            <ul className="list-disc list-inside space-y-1.5 pl-1.5">
              {(effectiveAnalysis.successMetrics ?? []).map((m, i) => (
                <li key={i} className="text-sm text-text-secondary leading-relaxed">{m}</li>
              ))}
            </ul>
          </Card>

          {(effectiveAnalysis.risks && effectiveAnalysis.risks.length > 0) && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-error" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Potential Risks & Mitigations</h3>
              </div>
              <div className="space-y-2">
                {effectiveAnalysis.risks.map((r, i) => (
                  <div key={i} className="p-2.5 bg-error/5 rounded-sm border-2 border-border">
                    <div className="flex items-center gap-2 text-sm font-bold text-error">
                      <span>{r.description}</span>
                      <span className="text-[10px] uppercase font-mono bg-error-bg px-1.5 py-0.5 border border-error/20">
                        {r.likelihood} Likelihood / {r.impact} Impact
                      </span>
                    </div>
                    {r.mitigation && (
                      <p className="text-xs text-text-secondary mt-1.5 leading-relaxed bg-surface p-1.5 border border-border">{r.mitigation}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(effectiveAnalysis.skillsRequired && effectiveAnalysis.skillsRequired.length > 0) && (
            <Card padding="md">
              <h3 className="font-bold text-sm uppercase tracking-wider mb-2.5">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {effectiveAnalysis.skillsRequired.map((s, i) => (
                  <Badge key={i} variant="primary">{s}</Badge>
                ))}
              </div>
            </Card>
          )}

          {effectiveAnalysis.resources && effectiveAnalysis.resources.length > 0 && (
            <Card padding="md">
              <h3 className="font-bold text-sm uppercase tracking-wider mb-2.5">Resources</h3>
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
    success: 'text-success border-success bg-success/5',
    warning: 'text-warning border-warning bg-warning/5',
    error: 'text-error border-error bg-error/5',
    default: 'text-text-primary border-border bg-surface',
  }

  return (
    <Card padding="md" className="text-center neo-shadow border-2 border-border">
      <div className={cn('inline-flex items-center justify-center w-8 h-8 rounded-sm border-2 mb-2', colors[variant])}>
        {icon}
      </div>
      <p className="text-2xl font-black">{displayValue ?? `${value}%`}</p>
      <p className="text-xs font-bold text-text-tertiary mt-0.5 uppercase tracking-wider">{label}</p>
      {isProgress && (
        <div className="mt-2 h-1.5 rounded-full bg-bg-tertiary border border-border overflow-hidden">
          <div className={cn('h-full rounded-full', variant === 'success' ? 'bg-success' : variant === 'warning' ? 'bg-warning' : 'bg-accent')}
               style={{ width: `${value}%` }} />
        </div>
      )}
    </Card>
  )
}
