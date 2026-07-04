'use client'

import { useState, type FormEvent } from 'react'
import { Card, Button, Input, Textarea } from '@/components/ui'
import { Loader2, Sparkles, Save } from 'lucide-react'

interface JournalFormProps {
  onSubmit: (input: { title: string; content: string; mood?: number; energy?: number; tags?: string[] }) => Promise<void>
  onAISuggest?: (content: string) => Promise<string>
  initialData?: { title?: string; content?: string; mood?: number; energy?: number; tags?: string[] }
}

export function JournalForm({ onSubmit, onAISuggest, initialData }: JournalFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [mood, setMood] = useState(initialData?.mood ?? 5)
  const [energy, setEnergy] = useState(initialData?.energy ?? 5)
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        mood,
        energy,
        tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAISuggest() {
    if (!onAISuggest || !content.trim()) return
    setIsGenerating(true)
    try {
      const suggestion = await onAISuggest(content)
      setContent((prev) => prev + '\n\n' + suggestion)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          placeholder="What's on your mind?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div>
          <label className="neo-label block mb-1.5">Entry</label>
          <Textarea
            placeholder="Write your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="neo-label block mb-1">Mood: {mood}/10</label>
            <input
              type="range"
              min={1}
              max={10}
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
          <div>
            <label className="neo-label block mb-1">Energy: {energy}/10</label>
            <input
              type="range"
              min={1}
              max={10}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        </div>

        <Input
          label="Tags (comma separated)"
          placeholder="grateful, learning, idea"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Entry
          </Button>
          {onAISuggest && (
            <Button
              type="button"
              variant="ghost"
              disabled={isGenerating || !content.trim()}
              onClick={handleAISuggest}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              AI Suggest
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
