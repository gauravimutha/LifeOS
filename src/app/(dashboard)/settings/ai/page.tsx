'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge, Input, Textarea } from '@/components/ui'
import {
  Bot,
  ArrowLeft,
  Brain,
  Trash2,
  Edit3,
  Search,
  Sliders,
  Plus,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

const personalityTraits = [
  { id: 'tone', label: 'Personality Tone', options: ['Professional', 'Friendly', 'Motivational', 'Socratic', 'Concise'], current: 'Friendly' },
  { id: 'proactiveness', label: 'Proactiveness', options: ['Low', 'Medium', 'High'], current: 'Medium' },
  { id: 'formality', label: 'Formality', options: ['Casual', 'Neutral', 'Formal'], current: 'Neutral' },
]

interface AIMemory {
  id: string
  memoryType: 'fact' | 'preference' | 'pattern' | 'context' | 'decision' | 'feedback' | 'insight' | 'learning'
  key: string
  value: any
  confidence: number
  createdAt: string
}

export default function AISettingsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [memories, setMemories] = useState<AIMemory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchMemory, setSearchMemory] = useState('')
  const [memoryView, setMemoryView] = useState<'all' | 'fact' | 'preference' | 'pattern' | 'context' | 'decision' | 'feedback' | 'insight' | 'learning'>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newType, setNewType] = useState<'fact' | 'preference' | 'pattern' | 'context' | 'decision' | 'feedback' | 'insight' | 'learning'>('preference')
  const [saving, setSaving] = useState(false)

  const [dataUsage, setDataUsage] = useState({
    tasks: true,
    habits: true,
    journal: true,
    health: true,
    calendar: true,
  })

  useEffect(() => {
    if (user) {
      fetchMemories()
    }
  }, [user])

  async function fetchMemories() {
    setLoading(true)
    try {
      const res = await fetch(`/api/memory?userId=${user?.id}`)
      const json = await res.json()
      if (json.data) {
        setMemories(json.data)
      }
    } catch (err) {
      console.error('Failed to load memories:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMemory(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newKey.trim() || !newValue.trim()) return

    setSaving(true)
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          memoryType: newType,
          key: `user.${newType}.${newKey.trim().toLowerCase().replace(/\s+/g, '_')}`,
          value: newValue.trim(),
          confidence: 1.0,
        }),
      })
      const result = await res.json()
      if (result.data) {
        setNewKey('')
        setNewValue('')
        setShowAddForm(false)
        fetchMemories()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteMemory(id: string) {
    try {
      const res = await fetch(`/api/memory/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = memoryView === 'all' || m.memoryType === memoryView
    const textStr = `${m.key} ${typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}`.toLowerCase()
    const matchesSearch = textStr.includes(searchMemory.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/settings')}
        className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary neo-transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </button>

      <div>
        <h1 className="text-2xl font-bold">AI Settings</h1>
        <p className="text-sm text-text-secondary">
          Configure personal memory and optimization guidelines
        </p>
      </div>

      {/* Personality */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-accent" />
          <h2 className="neo-label text-accent">Personality</h2>
        </div>
        <div className="space-y-4">
          {personalityTraits.map((trait) => (
            <div key={trait.id}>
              <p className="text-sm font-semibold mb-2">{trait.label}</p>
              <div className="flex flex-wrap gap-2">
                {trait.options.map((opt) => (
                  <button
                    key={opt}
                    className={cn(
                      'rounded-sm border-2 px-3 py-1.5 text-xs font-bold neo-transition',
                      opt === trait.current
                        ? 'border-accent bg-accent text-accent-text'
                        : 'border-border bg-surface hover:bg-bg-tertiary',
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Memory Management */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-border pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent" />
            <h2 className="neo-label text-accent">Personal AI Memory Explorer</h2>
          </div>
          <div>
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Memory
            </Button>
          </div>
        </div>

        {/* Add Memory Form */}
        {showAddForm && (
          <form onSubmit={handleAddMemory} className="space-y-3 p-4 rounded-sm border-2 border-border bg-bg-secondary">
            <p className="text-xs font-bold text-text-secondary">Add factual context manually</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="neo-label block mb-1 text-xs">Memory Type</label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="neo-border rounded-sm w-full px-2 py-1 bg-surface text-xs font-bold focus:outline-none"
                >
                  <option value="fact">Fact</option>
                  <option value="preference">Preference</option>
                  <option value="pattern">Pattern</option>
                  <option value="learning">Learning</option>
                  <option value="context">Context</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Topic / Key"
                  placeholder="e.g. preferred_study_time, motivation_trigger"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  required
                  className="py-1 text-xs"
                />
              </div>
            </div>
            <Textarea
              label="Memory Value"
              placeholder="e.g. Works best late at night, highly motivated by public accountability"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              required
              className="py-1 text-xs"
            />
            <div className="flex gap-2">
              <Button size="sm" type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Memory'}
              </Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Memory Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchMemory}
            onChange={(e) => setSearchMemory(e.target.value)}
            placeholder="Search memories..."
            className="neo-input w-full pl-9"
          />
        </div>

        {/* Memory Filters */}
        <div className="flex flex-wrap gap-1">
          {(['all', 'fact', 'preference', 'pattern', 'context', 'decision', 'feedback', 'insight', 'learning'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setMemoryView(cat)}
              className={cn(
                'rounded-sm border-2 px-2.5 py-1 text-xs font-bold capitalize neo-transition',
                memoryView === cat
                  ? 'border-accent bg-accent text-accent-text'
                  : 'border-border bg-surface hover:bg-bg-tertiary',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Memory List */}
        <div className="divide-y-2 divide-border">
          {loading ? (
            <div className="py-6 text-center">
              <span className="text-xs text-text-tertiary animate-pulse">Loading memory vault...</span>
            </div>
          ) : filteredMemories.length > 0 ? (
            filteredMemories.map((memory) => (
              <div key={memory.id} className="flex items-start justify-between py-3">
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-semibold">{String(memory.value)}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-text-tertiary">{memory.key}</span>
                    <Badge variant="default" className="text-[9px] px-1 py-0.5 capitalize">
                      {memory.memoryType}
                    </Badge>
                    <Badge variant="primary" className="text-[9px] px-1 py-0.5">
                      Confidence: {Math.round(memory.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMemory(memory.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-sm border-2 border-border bg-surface hover:bg-bg-tertiary text-error"
                  aria-label="Delete memory"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-text-tertiary">No memories found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Data Usage Preferences */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-accent" />
          <h2 className="neo-label text-accent">AI Data Context</h2>
        </div>
        <p className="text-xs text-text-tertiary">
          Configure which subsystems the AI decision engine should index for planning
        </p>
        <div className="space-y-2">
          {(Object.keys(dataUsage) as Array<keyof typeof dataUsage>).map((key) => (
            <div key={key} className="flex items-center justify-between rounded-sm border-2 border-border bg-bg p-3">
              <span className="text-sm font-semibold capitalize">{key} data indexing</span>
              <button
                onClick={() => setDataUsage((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={cn(
                  'flex items-center gap-2 rounded-sm border-2 px-3 py-1 text-xs font-bold neo-transition',
                  dataUsage[key]
                    ? 'border-accent bg-accent text-accent-text'
                    : 'border-border bg-surface text-text-tertiary',
                )}
              >
                {dataUsage[key] ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
