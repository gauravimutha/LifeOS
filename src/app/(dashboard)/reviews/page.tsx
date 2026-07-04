'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useReviewStore } from '@/stores/reviewStore'
import { Card, Button, Badge } from '@/components/ui'
import {
  Brain,
  Sparkles,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type Tab = 'daily' | 'weekly' | 'monthly' | 'insights'

const tabs: { id: Tab; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'insights', label: 'Insights' },
]

export default function ReviewsPage() {
  const user = useAuthStore((s) => s.user)
  const { dailyReview, periodReviews, isLoading, fetchDailyReview, submitDailyReview, generatePeriodReview, fetchPeriodReview } = useReviewStore()
  const [activeTab, setActiveTab] = useState<Tab>('daily')

  const [dailyCompleted, setDailyCompleted] = useState('')
  const [dailyBlocked, setDailyBlocked] = useState('')
  const [dailyProductivity, setDailyProductivity] = useState(5)
  const [dailySubmitted, setDailySubmitted] = useState(false)

  // Weekly Letter States
  const [weeklyLetter, setWeeklyLetter] = useState<string>('')
  const [loadingLetter, setLoadingLetter] = useState(false)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const weekKey = format(new Date(), "yyyy-'W'ww")
  const monthKey = format(new Date(), 'yyyy-MM')

  async function loadWeeklyLetter() {
    if (!user) return
    setLoadingLetter(true)
    try {
      const res = await fetch(`/api/reviews/weekly?userId=${user.id}`)
      const json = await res.json()
      if (json.data) {
        setWeeklyLetter(json.data.letterText)
      }
    } catch (e) {
      console.error('Failed to load weekly letter:', e)
    } finally {
      setLoadingLetter(false)
    }
  }

  useEffect(() => {
    if (!user) return
    if (activeTab === 'daily') {
      fetchDailyReview(todayStr)
    } else if (activeTab === 'weekly') {
      fetchPeriodReview('weekly', weekKey)
      loadWeeklyLetter()
    } else if (activeTab === 'monthly') {
      fetchPeriodReview('monthly', monthKey)
    }
  }, [user, activeTab, todayStr, weekKey, monthKey, fetchDailyReview, fetchPeriodReview])

  useEffect(() => {
    if (dailyReview && 'completedAt' in dailyReview) {
      setDailySubmitted(true)
    }
  }, [dailyReview])

  async function handleDailySubmit() {
    if (!user) return
    await submitDailyReview({
      date: todayStr,
      completed: dailyCompleted,
      blocked: dailyBlocked,
      productivity: dailyProductivity,
    })
    setDailySubmitted(true)
  }

  async function handleGenerateReview(type: 'weekly' | 'monthly') {
    if (!user) return
    const key = type === 'weekly' ? weekKey : monthKey
    await generatePeriodReview(type, key)
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-text-secondary">Track your progress and gain insights</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" variant="secondary">
            <Calendar className="h-4 w-4" />
            History
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-sm border-2 border-border bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 rounded-sm px-4 py-2 text-sm font-bold neo-transition',
              activeTab === tab.id
                ? 'bg-accent text-accent-text'
                : 'text-text-secondary hover:bg-bg-tertiary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Daily Review Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-bold">Today&apos;s Review</h2>
              <span className="text-xs text-text-tertiary">{format(new Date(), 'MMM d, yyyy')}</span>
            </div>

            {dailySubmitted ? (
              <div className="space-y-3">
                <div className="rounded-sm border-2 border-success bg-success/10 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <p className="text-sm font-semibold text-success">Daily review submitted</p>
                  </div>
                </div>
                {dailyReview && (
                  <div className="grid grid-cols-3 gap-3">
                    <Card padding="sm" variant="ghost">
                      <p className="neo-label text-xs">Productivity</p>
                      <p className="text-lg font-bold">{dailyReview.productivity}/10</p>
                    </Card>
                    <Card padding="sm" variant="ghost">
                      <p className="neo-label text-xs">Completed</p>
                      <p className="text-lg font-bold truncate">{dailyReview.completed ?? '—'}</p>
                    </Card>
                    <Card padding="sm" variant="ghost">
                      <p className="neo-label text-xs">Blocked</p>
                      <p className="text-lg font-bold truncate">{dailyReview.blocked ?? '—'}</p>
                    </Card>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="neo-label mb-1 block">What did you accomplish?</label>
                  <textarea
                    value={dailyCompleted}
                    onChange={(e) => setDailyCompleted(e.target.value)}
                    placeholder="List what you got done today..."
                    className="neo-input w-full min-h-[60px]"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="neo-label mb-1 block">What blocked you?</label>
                  <textarea
                    value={dailyBlocked}
                    onChange={(e) => setDailyBlocked(e.target.value)}
                    placeholder="Any obstacles or distractions?"
                    className="neo-input w-full min-h-[60px]"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="neo-label mb-1 block">Productivity (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={dailyProductivity}
                    onChange={(e) => setDailyProductivity(parseInt(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-xs text-text-tertiary mt-1">
                    <span>Low</span>
                    <span className="font-bold text-accent">{dailyProductivity}/10</span>
                    <span>High</span>
                  </div>
                </div>
                <Button variant="primary" onClick={handleDailySubmit} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Submit Daily Review'}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Weekly Review Tab */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-bold">Weekly Review</h2>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleGenerateReview('weekly')}
                disabled={isLoading}
              >
                <Sparkles className="h-4 w-4" />
                {isLoading ? 'Generating...' : 'Generate AI Review'}
              </Button>
            </div>

            {(() => {
              const review = periodReviews.find((r) => r.type === 'weekly' && r.periodKey === weekKey)
              if (!review) {
                return (
                  <div className="rounded-sm border-2 border-dashed border-border p-6 text-center">
                    <Brain className="mx-auto h-8 w-8 text-text-tertiary mb-2" />
                    <p className="text-sm text-text-secondary">No weekly review yet. Generate one with AI.</p>
                  </div>
                )
              }
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card padding="sm" variant="ghost">
                      <p className="neo-label text-xs">Tasks Done</p>
                      <p className="text-xl font-bold">{review.stats.tasksCompleted}</p>
                    </Card>
                    <Card padding="sm" variant="ghost">
                      <p className="neo-label text-xs">Avg Mood</p>
                      <p className="text-xl font-bold">{review.stats.avgMood?.toFixed(1) ?? '—'}</p>
                    </Card>
                    <Card padding="sm" variant="ghost">
                      <p className="neo-label text-xs">Avg Energy</p>
                      <p className="text-xl font-bold">{review.stats.avgEnergy?.toFixed(1) ?? '—'}</p>
                    </Card>
                    <Card padding="sm" variant="ghost">
                      <p className="neo-label text-xs">Goals Progress</p>
                      <p className="text-xl font-bold">{review.stats.goalsAdvanced}</p>
                    </Card>
                  </div>

                  {review.highlights.length > 0 && (
                    <div className="space-y-2">
                      <p className="neo-label">Highlights</p>
                      {review.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-sm bg-success" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {review.challenges.length > 0 && (
                    <div className="space-y-2">
                      <p className="neo-label">Challenges</p>
                      {review.challenges.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {review.focusForNext && (
                    <div className="rounded-sm border-2 border-accent bg-accent-light p-3">
                      <div className="flex items-start gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                        <div>
                          <p className="text-xs font-bold uppercase text-accent">Focus for Next Week</p>
                          <p className="text-sm mt-1">{review.focusForNext}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {review.aiSummary && (
                    <Card padding="sm" variant="ai">
                      <p className="text-sm text-text-secondary">{review.aiSummary}</p>
                    </Card>
                  )}
                </div>
              )
            })()}
          </Card>

          {/* AI Weekly Letter Card */}
          <Card variant="ai" padding="lg" className="border-accent bg-accent-light/10 mt-6 animate-fade-in relative overflow-hidden font-serif">
            <div className="absolute top-0 right-0 p-3 text-accent bg-accent/5 rounded-bl-sm border-l border-b border-border text-[9px] font-mono font-extrabold uppercase tracking-widest">
              Weekly Intelligence
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-sans">
                <Brain className="h-5 w-5 text-accent animate-pulse" />
                <h3 className="text-base font-bold text-accent">Chief of Staff Weekly Letter</h3>
              </div>
              {loadingLetter ? (
                <p className="text-sm font-sans text-text-secondary animate-pulse">Drafting weekly intelligence briefing...</p>
              ) : weeklyLetter ? (
                <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-medium">
                  {weeklyLetter}
                </div>
              ) : (
                <p className="text-sm font-sans text-text-secondary">No weekly report generated yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Monthly Review Tab */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-bold">Monthly Review</h2>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleGenerateReview('monthly')}
                disabled={isLoading}
              >
                <Sparkles className="h-4 w-4" />
                {isLoading ? 'Generating...' : 'Generate AI Review'}
              </Button>
            </div>

            {(() => {
              const review = periodReviews.find((r) => r.type === 'monthly' && r.periodKey === monthKey)
              if (!review) {
                return (
                  <div className="rounded-sm border-2 border-dashed border-border p-6 text-center">
                    <Brain className="mx-auto h-8 w-8 text-text-tertiary mb-2" />
                    <p className="text-sm text-text-secondary">No monthly review yet. Generate one with AI.</p>
                  </div>
                )
              }
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card padding="sm" variant="ghost">
                      <p className="neo-label text-xs">Tasks Done</p>
                      <p className="text-xl font-bold">{review.stats.tasksCompleted}</p>
                    </Card>
                    <Card padding="sm" variant="ghost">
                      <p className="neo-label text-xs">Avg Mood</p>
                      <p className="text-xl font-bold">{review.stats.avgMood?.toFixed(1) ?? '—'}</p>
                    </Card>
                    <Card padding="sm" variant="ghost">
                      <p className="neo-label text-xs">Avg Sleep</p>
                      <p className="text-xl font-bold">{review.stats.avgSleep ? `${review.stats.avgSleep.toFixed(1)}h` : '—'}</p>
                    </Card>
                    <Card padding="sm" variant="ghost">
                      <p className="neo-label text-xs">Goals Progress</p>
                      <p className="text-xl font-bold">{review.stats.goalsAdvanced}</p>
                    </Card>
                  </div>

                  {review.highlights.length > 0 && (
                    <div className="space-y-2">
                      <p className="neo-label">Highlights</p>
                      {review.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-sm bg-success" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {review.challenges.length > 0 && (
                    <div className="space-y-2">
                      <p className="neo-label">Challenges</p>
                      {review.challenges.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {review.aiSummary && (
                    <Card padding="sm" variant="ai">
                      <p className="text-sm text-text-secondary">{review.aiSummary}</p>
                    </Card>
                  )}
                </div>
              )
            })()}
          </Card>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-bold">Insights Dashboard</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card padding="sm" variant="ghost">
                <p className="neo-label text-xs">Total Check-ins</p>
                <p className="text-xl font-bold">{periodReviews.length > 0 ? periodReviews.reduce((s, r) => s + r.stats.tasksCompleted, 0) : '—'}</p>
              </Card>
              <Card padding="sm" variant="ghost">
                <p className="neo-label text-xs">Streak</p>
                <p className="text-xl font-bold">{periodReviews.length > 0 ? `${periodReviews[0]?.stats.streaks.current ?? 0}d` : '—'}</p>
              </Card>
              <Card padding="sm" variant="ghost">
                <p className="neo-label text-xs">Reviews Generated</p>
                <p className="text-xl font-bold">{periodReviews.length}</p>
              </Card>
              <Card padding="sm" variant="ghost">
                <p className="neo-label text-xs">Completion Rate</p>
                <p className="text-xl font-bold">
                  {periodReviews.length > 0
                    ? `${Math.round((periodReviews.reduce((s, r) => s + r.stats.tasksCompleted, 0) / Math.max(periodReviews.reduce((s, r) => s + r.stats.tasksCreated, 0), 1)) * 100)}%`
                    : '—'}
                </p>
              </Card>
            </div>

            {periodReviews.length === 0 && (
              <div className="rounded-sm border-2 border-dashed border-border p-6 text-center">
                <Brain className="mx-auto h-8 w-8 text-text-tertiary mb-2" />
                <p className="text-sm text-text-secondary">Generate weekly or monthly reviews to see insights here.</p>
              </div>
            )}

            {periodReviews.map((review) => (
              <Card key={review.id} padding="sm" variant="raised" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={review.type === 'weekly' ? 'primary' : 'accent'}>
                      {review.type === 'weekly' ? 'Weekly' : 'Monthly'}
                    </Badge>
                    <span className="text-xs text-text-tertiary">{review.periodKey}</span>
                  </div>
                  <span className="text-xs text-text-tertiary">
                    {review.stats.tasksCompleted}/{review.stats.tasksCreated} tasks
                  </span>
                </div>
                {review.highlights.slice(0, 2).map((h, i) => (
                  <p key={i} className="text-sm text-text-secondary">• {h}</p>
                ))}
              </Card>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
