'use client'

import { useState, type FormEvent } from 'react'
import { Button, Input } from '@/components/ui'
import { Plus, Loader2 } from 'lucide-react'

interface TaskFormProps {
  onSubmit: (input: { title: string; goalId?: string; scheduledStart?: string }) => Promise<void>
  goalId?: string
  placeholder?: string
}

export function TaskForm({ onSubmit, goalId, placeholder }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), goalId })
      setTitle('')
    } catch {
      // error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        placeholder={placeholder ?? 'Add a task...'}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" disabled={isSubmitting || !title.trim()} size="icon">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      </Button>
    </form>
  )
}
