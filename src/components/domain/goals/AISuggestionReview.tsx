'use client'

import { useState } from 'react'
import type { GoalAIAnalysis, GoalCategory, GoalPriority, GoalDifficulty, GoalMilestone, GoalRisk, GoalOpportunity } from '@/types/goal'
import { DEFAULT_GOAL_CATEGORIES } from '@/types/goal'
import { Card, Button, Badge } from '@/components/ui'
import { Sparkles, Check, Edit3, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AISuggestionReviewProps {
  analysis: GoalAIAnalysis
  onConfirm: () => void
  onEdit: (updated: GoalAIAnalysis) => void
  onBack: () => void
}

export function AISuggestionReview({ analysis, onConfirm, onEdit, onBack }: AISuggestionReviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [edited, setEdited] = useState<GoalAIAnalysis>(analysis)
  const [showReasoning, setShowReasoning] = useState(false)

  function handleSave() {
    onEdit(edited)
    setIsEditing(false)
  }

  function updateField<K extends keyof GoalAIAnalysis>(key: K, value: GoalAIAnalysis[K]) {
    setEdited((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEdited(analysis)}>
              Reset
            </Button>
          )}
        </div>
      </div>

      <Card variant="ai" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold">AI Analysis</h2>
          <p className="text-xs text-text-tertiary">Review and customize before saving</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <AnalysisField
            label="Category"
            isEditing={isEditing}
            value={edited.category}
            type="select"
            options={Array.from(new Set([...DEFAULT_GOAL_CATEGORIES, edited.category]))}
            onChange={(v) => updateField('category', v as GoalCategory)}
            badge
          />
          <AnalysisField
            label="Priority"
            isEditing={isEditing}
            value={edited.priority}
            type="select"
            options={['low', 'medium', 'high', 'critical']}
            onChange={(v) => updateField('priority', v as GoalPriority)}
          />
          <AnalysisField
            label="Difficulty"
            isEditing={isEditing}
            value={edited.difficulty}
            type="select"
            options={['easy', 'medium', 'hard', 'very_hard']}
            onChange={(v) => updateField('difficulty', v as GoalDifficulty)}
          />
          <AnalysisField
            label="Weekly Commitment"
            isEditing={isEditing}
            value={`${edited.weeklyCommitment}h`}
            type="number"
            onChange={(v) => updateField('weeklyCommitment', parseInt(v) || 0)}
          />
        </div>

        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="text-xs text-accent font-semibold hover:underline mb-4 block"
        >
          {showReasoning ? 'Hide' : 'Show'} AI Reasoning
        </button>

        {showReasoning && (
          <div className="space-y-2 mb-6 p-3 bg-bg-secondary rounded-sm text-sm">
            <ReasoningBlock label="Category" text={edited.reasoning.category} />
            <ReasoningBlock label="Priority" text={edited.reasoning.priority} />
            <ReasoningBlock label="Difficulty" text={edited.reasoning.difficulty} />
            <ReasoningBlock label="Timeline" text={edited.reasoning.timeline} />
          </div>
        )}

        <div className="space-y-6">
          <Section label="Success Metrics">
            {isEditing ? (
              <EditableList
                items={edited.successMetrics}
                onChange={(items) => updateField('successMetrics', items)}
              />
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {edited.successMetrics.map((m, i) => (
                  <li key={i} className="text-sm text-text-secondary">{m}</li>
                ))}
              </ul>
            )}
          </Section>

          <Section label="Milestones">
            {isEditing ? (
              <EditableMilestones
                milestones={edited.milestones}
                onChange={(m) => updateField('milestones', m)}
              />
            ) : (
              <div className="space-y-2">
                {edited.milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className={cn('w-2 h-2 rounded-full', m.completed ? 'bg-success' : 'bg-bg-tertiary')} />
                    <span className="text-text-primary">{m.title}</span>
                    {m.targetDate && (
                      <span className="text-text-tertiary text-xs">{m.targetDate}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section label="Risks">
            {isEditing ? (
              <EditableRisks
                risks={edited.risks}
                onChange={(r) => updateField('risks', r)}
              />
            ) : (
              <div className="space-y-2">
                {edited.risks.map((r, i) => (
                  <div key={i} className="text-sm p-2 bg-error-bg rounded-sm border border-error/20">
                    <div className="flex items-center gap-2 font-semibold text-error">
                      <span>{r.description}</span>
                      <span className="text-[10px] uppercase">({r.likelihood} / {r.impact})</span>
                    </div>
                    {r.mitigation && (
                      <p className="text-text-secondary text-xs mt-1">Mitigation: {r.mitigation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section label="Opportunities">
            {isEditing ? (
              <EditableOpportunities
                opportunities={edited.opportunities}
                onChange={(o) => updateField('opportunities', o)}
              />
            ) : (
              <div className="space-y-2">
                {edited.opportunities.map((o, i) => (
                  <div key={i} className="text-sm p-2 bg-success-bg rounded-sm border border-success/20">
                    <p className="font-semibold text-success">{o.description}</p>
                    <p className="text-text-secondary text-xs mt-0.5">
                      Impact: {o.potentialImpact} | Effort: {o.effortRequired}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section label="Suggested Roadmaps">
            {isEditing ? (
              <EditableList
                items={edited.suggestedRoadmaps}
                onChange={(items) => updateField('suggestedRoadmaps', items)}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {edited.suggestedRoadmaps.map((p, i) => (
                  <Badge key={i} variant="default">{p}</Badge>
                ))}
              </div>
            )}
          </Section>

          <Section label="Dependencies">
            {isEditing ? (
              <EditableList
                items={edited.dependencies}
                onChange={(items) => updateField('dependencies', items)}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {edited.dependencies.map((d, i) => (
                  <Badge key={i} variant="warning">{d}</Badge>
                ))}
              </div>
            )}
          </Section>

          <Section label="Skills Required">
            {isEditing ? (
              <EditableList
                items={edited.skillsRequired}
                onChange={(items) => updateField('skillsRequired', items)}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {edited.skillsRequired.map((s, i) => (
                  <Badge key={i} variant="primary">{s}</Badge>
                ))}
              </div>
            )}
          </Section>

          <Section label="Resources">
            {isEditing ? (
              <EditableList
                items={edited.resources}
                onChange={(items) => updateField('resources', items)}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {edited.resources.map((r, i) => (
                  <Badge key={i} variant="default">{r}</Badge>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="flex items-center gap-3 pt-6 border-t-2 border-border mt-6">
          {isEditing ? (
            <>
              <Button onClick={handleSave}>
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="ghost" onClick={() => { setIsEditing(false); setEdited(analysis) }}>
                Cancel
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={onConfirm}>
              <Check className="h-4 w-4" />
              Confirm & Save Goal
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function AnalysisField({ label, value, isEditing, type, options, onChange, badge }: {
  label: string
  value: string
  isEditing: boolean
  type: 'select' | 'number'
  options?: string[]
  onChange: (value: string) => void
  badge?: boolean
}) {
  return (
    <div>
      <label className="neo-label block mb-1">{label}</label>
      {isEditing ? (
        type === 'select' && options ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="neo-border neo-shadow-sm rounded-sm w-full px-2 py-1.5 bg-surface text-sm font-semibold focus:outline-none focus:neo-shadow"
          >
            {options.map((o) => (
              <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            value={parseInt(value) || 0}
            onChange={(e) => onChange(e.target.value)}
            className="neo-border neo-shadow-sm rounded-sm w-full px-2 py-1.5 bg-surface text-sm font-semibold focus:outline-none focus:neo-shadow"
          />
        )
      ) : badge ? (
        <Badge variant="primary">{value}</Badge>
      ) : (
        <span className="text-sm font-bold text-text-primary">{value}</span>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="neo-label mb-2">{label}</h4>
      {children}
    </div>
  )
}

function ReasoningBlock({ label, text }: { label: string; text: string }) {
  if (!text) return null
  return (
    <div>
      <span className="font-bold text-text-primary">{label}: </span>
      <span className="text-text-secondary">{text}</span>
    </div>
  )
}

function EditableList({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const [localItems, setLocalItems] = useState([...items, ''])

  function updateItem(index: number, value: string) {
    const updated = [...localItems]
    updated[index] = value
    setLocalItems(updated)
    onChange(updated.filter((i) => i.trim()))
  }

  function removeItem(index: number) {
    const updated = localItems.filter((_, i) => i !== index)
    setLocalItems(updated.length === 0 ? [''] : updated)
    onChange(updated.filter((i) => i.trim()))
  }

  return (
    <div className="space-y-1">
      {localItems.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            className="neo-border rounded-sm flex-1 px-2 py-1 text-sm bg-surface focus:outline-none"
            placeholder="Add item..."
          />
          {localItems.length > 1 && (
            <button onClick={() => removeItem(i)} className="text-xs text-error font-bold">×</button>
          )}
        </div>
      ))}
    </div>
  )
}

function EditableMilestones({ milestones, onChange }: { milestones: GoalMilestone[]; onChange: (m: GoalMilestone[]) => void }) {
  const [items, setItems] = useState(milestones.length > 0 ? milestones : [{ title: '', completed: false }])

  function updateItem(index: number, field: keyof GoalMilestone, value: string | boolean) {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    setItems(updated)
    onChange(updated.filter((m) => m.title.trim()))
  }

  function addItem() {
    setItems([...items, { title: '', completed: false }])
  }

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated.length === 0 ? [{ title: '', completed: false }] : updated)
    onChange(updated.filter((m) => m.title.trim()))
  }

  return (
    <div className="space-y-2">
      {items.map((milestone, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={milestone.completed}
            onChange={(e) => updateItem(i, 'completed', e.target.checked)}
            className="shrink-0"
          />
          <input
            value={milestone.title}
            onChange={(e) => updateItem(i, 'title', e.target.value)}
            className="neo-border rounded-sm flex-1 px-2 py-1 text-sm bg-surface focus:outline-none"
            placeholder="Milestone title..."
          />
          <input
            value={milestone.targetDate ?? ''}
            onChange={(e) => updateItem(i, 'targetDate', e.target.value)}
            className="neo-border rounded-sm w-24 px-2 py-1 text-sm bg-surface focus:outline-none"
            placeholder="Date..."
          />
          {items.length > 1 && (
            <button onClick={() => removeItem(i)} className="text-xs text-error font-bold">×</button>
          )}
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-accent font-semibold hover:underline">+ Add milestone</button>
    </div>
  )
}

function EditableRisks({ risks, onChange }: { risks: GoalRisk[]; onChange: (r: GoalRisk[]) => void }) {
  const [items, setItems] = useState(risks.length > 0 ? risks : [{ description: '', likelihood: 'medium' as const, impact: 'medium' as const, mitigation: '' }])

  function updateItem(index: number, field: keyof GoalRisk, value: string) {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    setItems(updated)
    onChange(updated as GoalRisk[])
  }

  function addItem() {
    setItems([...items, { description: '', likelihood: 'medium' as const, impact: 'medium' as const, mitigation: '' }])
  }

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    onChange(updated as GoalRisk[])
  }

  return (
    <div className="space-y-3">
      {items.map((risk, i) => (
        <div key={i} className="neo-border rounded-sm p-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={risk.description}
              onChange={(e) => updateItem(i, 'description', e.target.value)}
              className="flex-1 px-2 py-1 text-sm bg-surface border-b border-border focus:outline-none"
              placeholder="Risk description..."
            />
            {items.length > 1 && (
              <button onClick={() => removeItem(i)} className="text-xs text-error font-bold">×</button>
            )}
          </div>
          <div className="flex gap-2 text-xs">
            <select value={risk.likelihood} onChange={(e) => updateItem(i, 'likelihood', e.target.value)} className="neo-border rounded-sm px-1 bg-surface">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select value={risk.impact} onChange={(e) => updateItem(i, 'impact', e.target.value)} className="neo-border rounded-sm px-1 bg-surface">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              value={risk.mitigation ?? ''}
              onChange={(e) => updateItem(i, 'mitigation', e.target.value)}
              className="flex-1 px-2 py-1 bg-surface border-b border-border focus:outline-none"
              placeholder="Mitigation..."
            />
          </div>
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-accent font-semibold hover:underline">+ Add risk</button>
    </div>
  )
}

function EditableOpportunities({ opportunities, onChange }: { opportunities: GoalOpportunity[]; onChange: (o: GoalOpportunity[]) => void }) {
  const [items, setItems] = useState(opportunities.length > 0 ? opportunities : [{ description: '', potentialImpact: 'medium' as const, effortRequired: 'medium' as const }])

  function updateItem(index: number, field: keyof GoalOpportunity, value: string) {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    setItems(updated)
    onChange(updated as GoalOpportunity[])
  }

  function addItem() {
    setItems([...items, { description: '', potentialImpact: 'medium' as const, effortRequired: 'medium' as const }])
  }

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    onChange(updated as GoalOpportunity[])
  }

  return (
    <div className="space-y-3">
      {items.map((opp, i) => (
        <div key={i} className="neo-border rounded-sm p-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={opp.description}
              onChange={(e) => updateItem(i, 'description', e.target.value)}
              className="flex-1 px-2 py-1 text-sm bg-surface border-b border-border focus:outline-none"
              placeholder="Opportunity description..."
            />
            {items.length > 1 && (
              <button onClick={() => removeItem(i)} className="text-xs text-error font-bold">×</button>
            )}
          </div>
          <div className="flex gap-2 text-xs">
            <select value={opp.potentialImpact} onChange={(e) => updateItem(i, 'potentialImpact', e.target.value)} className="neo-border rounded-sm px-1 bg-surface">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select value={opp.effortRequired} onChange={(e) => updateItem(i, 'effortRequired', e.target.value)} className="neo-border rounded-sm px-1 bg-surface">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-accent font-semibold hover:underline">+ Add opportunity</button>
    </div>
  )
}
