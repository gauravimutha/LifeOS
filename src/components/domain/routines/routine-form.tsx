'use client'

import { useState, type FormEvent } from 'react'
import { Card, Button, Input } from '@/components/ui'
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react'

interface Step {
  key: string
  label: string
  duration: number
}

interface RoutineFormProps {
  onSubmit: (input: { title: string; type: string; steps: Array<{ label: string; duration: number }>; time?: string }) => Promise<void>
}

export function RoutineForm({ onSubmit }: RoutineFormProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('morning')
  const [time, setTime] = useState('')
  const [steps, setSteps] = useState<Step[]>([{ key: crypto.randomUUID(), label: '', duration: 5 }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  function addStep() {
    setSteps([...steps, { key: crypto.randomUUID(), label: '', duration: 5 }])
  }

  function removeStep(key: string) {
    setSteps(steps.filter((s) => s.key !== key))
  }

  function updateStep(key: string, field: 'label' | 'duration', value: string | number) {
    setSteps(steps.map((s) => (s.key === key ? { ...s, [field]: value } : s)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || steps.some((s) => !s.label.trim())) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        type,
        steps: steps.map((s) => ({ label: s.label.trim(), duration: s.duration })),
        time: time || undefined,
      })
      setTitle('')
      setSteps([{ key: crypto.randomUUID(), label: '', duration: 5 }])
      setTime('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card padding="md" className="border-dashed border-accent">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-sm font-bold">New Routine</h3>

        <div className="grid grid-cols-3 gap-3">
          <Input placeholder="Routine name" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-2" required />
          <Input placeholder="Time (optional)" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="neo-label">Steps</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="neo-border rounded-sm px-2 py-0.5 text-xs font-semibold bg-surface">
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
              <option value="focus">Focus</option>
              <option value="exercise">Exercise</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-text-tertiary shrink-0" />
              <Input
                placeholder={`Step ${i + 1}`}
                value={step.label}
                onChange={(e) => updateStep(step.key, 'label', e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                min={1}
                max={180}
                value={step.duration}
                onChange={(e) => updateStep(step.key, 'duration', parseInt(e.target.value) || 5)}
                className="w-16 text-center"
              />
              <span className="text-xs text-text-tertiary w-6">min</span>
              <button type="button" onClick={() => removeStep(step.key)} className="p-1 rounded-sm hover:bg-error-bg text-text-tertiary hover:text-error neo-transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addStep}>
            <Plus className="h-4 w-4" /> Add Step
          </Button>
        </div>

        <Button type="submit" disabled={isSubmitting || !title.trim()} size="sm">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create Routine
        </Button>
      </form>
    </Card>
  )
}
