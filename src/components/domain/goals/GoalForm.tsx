'use client'

import { useState, type FormEvent } from 'react'
import type { Goal, CreateGoalInput, GoalLevel } from '@/types/goal'
import { Card, Button, Input, Textarea } from '@/components/ui'
import { GOAL_LEVELS } from '@/types/goal'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Sparkles, Sliders } from 'lucide-react'
import { AISuggestionReview } from './AISuggestionReview'
import { suggestLevel } from '@/engine'
import type { GoalAIAnalysis } from '@/types/goal'
import { cn } from '@/lib/utils'

interface GoalFormProps {
  onSubmit: (input: CreateGoalInput) => Promise<{ goal: Goal | null; analysis?: GoalAIAnalysis | null; error: string | null }>
  parentGoalId?: string
  defaultLevel?: GoalLevel
}

export function GoalForm({ onSubmit, parentGoalId, defaultLevel }: GoalFormProps) {
  const router = useRouter()
  const [isWizard, setIsWizard] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState<GoalLevel>(defaultLevel ?? 'long-term')
  const [targetDate, setTargetDate] = useState('')
  const [tags, setTags] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<GoalAIAnalysis | null>(null)
  const [createdGoal, setCreatedGoal] = useState<Goal | null>(null)
  const [step, setStep] = useState<'form' | 'ai-review' | 'done'>('form')

  function handleLevelChange() {
    const detected = suggestLevel(targetDate || undefined)
    setLevel(detected)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsSubmitting(true)

    try {
      const input: CreateGoalInput = {
        title: title.trim(),
        description: isWizard ? undefined : (description.trim() || undefined),
        level: isWizard ? 'long-term' : level,
        parentGoalId,
        targetDate: isWizard ? undefined : (targetDate || undefined),
        tags: isWizard ? undefined : (tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined),
      }

      const result = await onSubmit(input)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.goal) {
        setCreatedGoal(result.goal)
        if (result.analysis) {
          setAnalysis(result.analysis)
          setStep('ai-review')
        } else {
          setStep('done')
          setTimeout(() => router.push(`/goals/${result.goal!.id}`), 800)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleAnalysisComplete(updatedAnalysis: GoalAIAnalysis) {
    setAnalysis(updatedAnalysis)
  }

  function handleAnalysisConfirmed() {
    setStep('done')
    if (createdGoal) {
      setTimeout(() => router.push(`/goals/${createdGoal.id}`), 800)
    }
  }

  if (step === 'done') {
    return (
      <Card padding="lg" variant="default">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Sparkles className="h-12 w-12 text-accent mb-4" />
          <h2 className="text-xl font-bold mb-2">Goal Created!</h2>
          <p className="text-text-secondary mb-6">Your goal has been created and analyzed.</p>
          {createdGoal && (
            <Button onClick={() => router.push(`/goals/${createdGoal.id}`)}>
              View Goal
            </Button>
          )}
        </div>
      </Card>
    )
  }

  if (step === 'ai-review' && analysis && createdGoal) {
    return (
      <AISuggestionReview
        analysis={analysis}
        onConfirm={handleAnalysisConfirmed}
        onEdit={handleAnalysisComplete}
        onBack={() => setStep('form')}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Card padding="lg">
        <div className="space-y-5">
          {/* Mode Selector */}
          <div className="flex items-center justify-between border-b-2 border-border pb-4">
            <div>
              <h2 className="text-lg font-bold">New Goal</h2>
              <p className="text-xs text-text-secondary">Choose how you want to design this goal</p>
            </div>
            <div className="flex rounded-sm border-2 border-border p-0.5 bg-bg-secondary">
              <button
                type="button"
                onClick={() => setIsWizard(true)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-sm neo-transition',
                  isWizard ? 'bg-accent text-accent-text' : 'bg-transparent text-text-secondary'
                )}
              >
                <Sparkles className="h-3 w-3" />
                AI Wizard
              </button>
              <button
                type="button"
                onClick={() => setIsWizard(false)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-sm neo-transition',
                  !isWizard ? 'bg-accent text-accent-text' : 'bg-transparent text-text-secondary'
                )}
              >
                <Sliders className="h-3 w-3" />
                Manual Form
              </button>
            </div>
          </div>

          <Input
            label={isWizard ? "What is your goal?" : "What do you want to achieve?"}
            placeholder={isWizard ? "e.g., I want to run a marathon or learn a new language" : "e.g., Build a personal website"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />

          {!isWizard && (
            <>
              <Textarea
                label="Description (optional)"
                placeholder="Add more context about this goal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="neo-label block mb-1">Goal Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as GoalLevel)}
                    className="neo-border neo-shadow-sm rounded-sm w-full px-3 py-2 bg-surface text-sm font-semibold focus:outline-none focus:neo-shadow"
                  >
                    {GOAL_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l.charAt(0).toUpperCase() + l.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Input
                    label="Target Date (optional)"
                    type="date"
                    value={targetDate}
                    onChange={(e) => {
                      setTargetDate(e.target.value)
                      if (e.target.value) handleLevelChange()
                    }}
                  />
                </div>
              </div>

              <Input
                label="Tags (optional)"
                placeholder="comma, separated, tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </>
          )}

          {error && (
            <p className="text-sm font-semibold text-error">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting || !title.trim()} size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI Architecting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {isWizard ? 'Let AI Generate My Goal' : 'Create & Analyze'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  )
}
