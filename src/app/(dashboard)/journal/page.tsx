'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Badge, Modal, Input, Textarea } from '@/components/ui'
import { BookOpen, Plus, Sparkles, Search, Smile, Meh, Frown, Sunset, Loader2 } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

interface DbJournalEntry {
  id: string
  title?: string | null
  content: string
  entryType: string
  entryDate: string
  tags: string[]
  moodBefore?: number | null
  moodAfter?: number | null
  energyBefore?: number | null
  energyAfter?: number | null
}

const moodIcons = {
  great: Sparkles,
  good: Smile,
  okay: Meh,
  low: Frown,
  tired: Sunset,
}

const moodColors = {
  great: 'text-success',
  good: 'text-info',
  okay: 'text-warning',
  low: 'text-error',
  tired: 'text-text-tertiary',
}

function getMoodKey(score: number): 'great' | 'good' | 'okay' | 'low' | 'tired' {
  if (score >= 9) return 'great'
  if (score >= 7) return 'good'
  if (score >= 5) return 'okay'
  if (score >= 3) return 'low'
  return 'tired'
}

export default function JournalPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const [entries, setEntries] = useState<DbJournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Create Modal State
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [entryType, setEntryType] = useState('free')
  const [tagsInput, setTagsInput] = useState('')
  const [moodBefore, setMoodBefore] = useState(5)
  const [moodAfter, setMoodAfter] = useState(5)
  const [energyBefore, setEnergyBefore] = useState(5)
  const [energyAfter, setEnergyAfter] = useState(5)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchEntries()
    }
  }, [user])

  async function fetchEntries() {
    setLoading(true)
    try {
      const res = await fetch(`/api/journal?userId=${user?.id}`)
      const json = await res.json()
      if (json.data) {
        setEntries(json.data)
      }
    } catch (err) {
      console.error('Failed to load journal entries:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !content.trim() || submitting) return

    setSubmitting(true)
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: title.trim() || null,
          content: content.trim(),
          entryType,
          tags,
          moodBefore,
          moodAfter,
          energyBefore,
          energyAfter,
        }),
      })

      if (res.ok) {
        setShowModal(false)
        setTitle('')
        setContent('')
        setTagsInput('')
        setMoodBefore(5)
        setMoodAfter(5)
        setEnergyBefore(5)
        setEnergyAfter(5)
        fetchEntries()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = entries.filter(
    (e) =>
      (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  const promptText = "What was the most meaningful moment of your day, and why did it matter to you?"

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Journal</h1>
          <p className="text-sm text-text-secondary">Reflect, learn, and grow</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* AI Prompt of the Day */}
      <Card variant="ai" padding="md" className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="neo-label text-accent">Prompt of the Day</h2>
        </div>
        <p className="text-sm italic text-text-secondary">
          &ldquo;{promptText}&rdquo;
        </p>
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            setTitle('Daily Prompt Response')
            setContent(`Prompt: "${promptText}"\n\n`)
            setEntryType('prompt')
            setShowModal(true)
          }}
        >
          <BookOpen className="h-3 w-3" />
          Write Response
        </Button>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search journal entries..."
          className="neo-input w-full pl-9"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center">
          <span className="text-sm text-text-tertiary animate-pulse">Loading entries...</span>
        </div>
      )}

      {/* Entry List */}
      {!loading && (
        filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((entry) => {
              const moodRating = entry.moodAfter || entry.moodBefore || 5
              const moodKey = getMoodKey(moodRating)
              const MoodIcon = moodIcons[moodKey]

              return (
                <button
                  key={entry.id}
                  onClick={() => router.push(`/journal/${entry.id}`)}
                  className="w-full text-left"
                >
                  <Card padding="md" className="space-y-2 hover:bg-bg-secondary neo-transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold">{entry.title || 'Untitled Entry'}</h3>
                        <p className="text-xs text-text-tertiary">{formatDate(new Date(entry.entryDate))}</p>
                      </div>
                      <MoodIcon className={cn('h-4 w-4 flex-shrink-0', moodColors[moodKey])} />
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2">{entry.content}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="default" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </Card>
                </button>
              )
            })}
          </div>
        ) : (
          <Card padding="lg">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-text-tertiary mx-auto" />
              <h2 className="text-lg font-semibold">
                {search ? 'No matching entries' : 'No entries yet'}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {search
                  ? 'Try a different search term.'
                  : 'Journaling helps you process your day and discover patterns.'}
              </p>
              {!search && (
                <Button className="mt-4" size="sm" onClick={() => setShowModal(true)}>
                  <Plus className="h-4 w-4" />
                  Write your first entry
                </Button>
              )}
            </div>
          </Card>
        )
      )}

      {/* Creation Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Journal Entry">
        <form onSubmit={handleCreateEntry} className="space-y-4">
          <Input
            label="Title"
            placeholder="A productive Monday..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Write Content"
            placeholder="Today was..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={5}
          />

          <Input
            label="Tags (comma-separated)"
            placeholder="work, productivity, health"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4 border-t border-border-light pt-3">
            <div>
              <label className="neo-label text-xs block mb-1">Mood Before: {moodBefore}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={moodBefore}
                onChange={(e) => setMoodBefore(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div>
              <label className="neo-label text-xs block mb-1">Mood After: {moodAfter}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={moodAfter}
                onChange={(e) => setMoodAfter(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="neo-label text-xs block mb-1">Energy Before: {energyBefore}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={energyBefore}
                onChange={(e) => setEnergyBefore(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div>
              <label className="neo-label text-xs block mb-1">Energy After: {energyAfter}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={energyAfter}
                onChange={(e) => setEnergyAfter(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t-2 border-border pt-3 mt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Entry'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
