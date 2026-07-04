'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, Button, Badge } from '@/components/ui'
import {
  ArrowLeft,
  Trash2,
  Brain,
  Sparkles,
  Zap,
  Heart,
  Activity,
  Loader2,
} from 'lucide-react'
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
  analysis?: any
}

export default function JournalEntryPage() {
  const router = useRouter()
  const params = useParams()
  const user = useAuthStore((s) => s.user)
  const id = params?.id as string

  const [entry, setEntry] = useState<DbJournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(true)

  useEffect(() => {
    if (user && id) {
      fetchEntry()
    }
  }, [user, id])

  async function fetchEntry() {
    setLoading(true)
    try {
      const res = await fetch(`/api/journal/${id}`)
      const json = await res.json()
      if (json.data) {
        setEntry(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!id || deleting) return
    if (!confirm('Are you sure you want to delete this journal entry?')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/journal')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-xl font-bold">Journal entry not found</h2>
        <Button onClick={() => router.push('/journal')}>Back to Journal</Button>
      </div>
    )
  }

  // Parse analysis JSON if present
  const analysis = typeof entry.analysis === 'string' ? JSON.parse(entry.analysis) : entry.analysis

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/journal')}
          className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary neo-transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Journal
        </button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 text-error" />
          </Button>
        </div>
      </div>

      {/* Entry Content */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{entry.title || 'Untitled Entry'}</h1>
            <p className="text-sm text-text-tertiary">{formatDate(new Date(entry.entryDate))}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end max-w-[200px]">
            {entry.tags.map((tag) => (
              <Badge key={tag} variant="primary">{tag}</Badge>
            ))}
          </div>
        </div>

        <div className="prose prose-sm max-w-none space-y-4 text-text-secondary whitespace-pre-wrap">
          {entry.content}
        </div>
      </Card>

      {/* Mood/Energy Before/After */}
      {(entry.moodBefore !== null || entry.moodAfter !== null || entry.energyBefore !== null || entry.energyAfter !== null) && (
        <Card padding="md" className="space-y-3">
          <h2 className="neo-label">Before vs After</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-tertiary">Before</p>
              {entry.moodBefore !== null && (
                <>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-text-secondary" />
                    <span className="text-sm font-semibold">Mood: {entry.moodBefore}/10</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-sm bg-bg-tertiary">
                    <div className="h-full rounded-sm bg-warning" style={{ width: `${(entry.moodBefore || 0) * 10}%` }} />
                  </div>
                </>
              )}
              {entry.energyBefore !== null && (
                <>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-text-secondary" />
                    <span className="text-sm font-semibold">Energy: {entry.energyBefore}/10</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-sm bg-bg-tertiary">
                    <div className="h-full rounded-sm bg-info" style={{ width: `${(entry.energyBefore || 0) * 10}%` }} />
                  </div>
                </>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-tertiary">After</p>
              {entry.moodAfter !== null && (
                <>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-text-secondary" />
                    <span className="text-sm font-semibold">Mood: {entry.moodAfter}/10</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-sm bg-bg-tertiary">
                    <div className="h-full rounded-sm bg-success" style={{ width: `${(entry.moodAfter || 0) * 10}%` }} />
                  </div>
                </>
              )}
              {entry.energyAfter !== null && (
                <>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-text-secondary" />
                    <span className="text-sm font-semibold">Energy: {entry.energyAfter}/10</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-sm bg-bg-tertiary">
                    <div className="h-full rounded-sm bg-success" style={{ width: `${(entry.energyAfter || 0) * 10}%` }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* AI Analysis */}
      {analysis && (
        <Card variant="ai" padding="md" className="space-y-4">
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" />
              <h2 className="neo-label text-accent">AI Analysis</h2>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-accent neo-transition', showAnalysis && 'rotate-180')} />
          </button>

          {showAnalysis && (
            <div className="space-y-4 animate-fade-in">
              {/* Sentiment */}
              {analysis.sentiment && (
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-success" />
                  <span className="text-sm font-semibold">Sentiment: {analysis.sentiment}</span>
                  {analysis.sentimentScore !== undefined && (
                    <span className="text-xs text-text-tertiary">({Math.round(analysis.sentimentScore * 100)}%)</span>
                  )}
                </div>
              )}

              {/* Themes */}
              {analysis.themes && analysis.themes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.themes.map((theme: string) => (
                    <Badge key={theme} variant="primary" className="text-[10px]">{theme}</Badge>
                  ))}
                </div>
              )}

              {/* Insights */}
              {analysis.insights && analysis.insights.length > 0 && (
                <div className="space-y-2 rounded-sm border-2 border-dashed border-accent bg-accent-light p-3 dark:bg-accent/10">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider text-accent">Insights</span>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.insights.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
