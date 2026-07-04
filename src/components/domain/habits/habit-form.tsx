'use client'

import { useState, type FormEvent } from 'react'
import { Card, Button, Input, Textarea } from '@/components/ui'
import { Loader2 } from 'lucide-react'

interface HabitFormProps {
  onSubmit: (input: { title: string; description?: string; frequency?: string }) => Promise<void>
}

export function HabitForm({ onSubmit }: HabitFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), description: description.trim() || undefined, frequency })
      setTitle('')
      setDescription('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card padding="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-sm font-bold">New Habit</h3>
        <Input
          placeholder="Habit name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <label className="neo-label">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="neo-border neo-shadow-sm rounded-sm px-3 py-1.5 bg-surface text-sm font-semibold"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="weekdays">Weekdays</option>
            <option value="weekends">Weekends</option>
          </select>
        </div>
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create Habit
        </Button>
      </form>
    </Card>
  )
}
