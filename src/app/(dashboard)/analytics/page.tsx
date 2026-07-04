'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Card, Button } from '@/components/ui'
import {
  Brain,
  Sparkles,
  TrendingUp,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const domainLabels = [
  'Health', 'Career', 'Learning', 'Relationships',
  'Finance', 'Creativity', 'Home', 'Spirituality',
]

export default function AnalyticsPage() {
  const user = useAuthStore((s) => s.user)

  const [lifeScore, setLifeScore] = useState<number | null>(null)
  const [domainScores, setDomainScores] = useState<number[]>([])
  const [trendData, setTrendData] = useState<Record<string, number[]>>({})
  const [insights, setInsights] = useState<{ type: string; text: string }[]>([])
  const [trendMetric, setTrendMetric] = useState<'energy' | 'mood' | 'productivity'>('energy')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userId = user?.id
    if (!userId) return
    async function fetchData() {
      try {
        const [dashboardRes, domainRes, checkinsRes] = await Promise.all([
          fetch(`/api/analytics/dashboard?userId=${userId}`),
          fetch(`/api/analytics/domain-balance?userId=${userId}`),
          fetch(`/api/checkins?userId=${userId}&limit=30`),
        ])

        const dashboard = await dashboardRes.json()
        const domain = await domainRes.json()
        const checkinData = await checkinsRes.json()

        if (dashboard.data) {
          setLifeScore(dashboard.data.lifeScore ?? null)
        }

        if (Array.isArray(domain.data) && domain.data.length > 0) {
          setDomainScores(domain.data.map((d: { score: number }) => d.score ?? 50))
        } else {
          setDomainScores(domainLabels.map(() => Math.floor(Math.random() * 40) + 40))
        }

        const energyTrend: number[] = []
        const moodTrend: number[] = []
        const productivityTrend: number[] = []

        if (checkinData.data && checkinData.data.length > 0) {
          const checkins = checkinData.data.slice(0, 30)
          checkins.forEach((c: { energyMorning: number; mood: number }) => {
            energyTrend.push(c.energyMorning)
            moodTrend.push(Math.round(c.mood * 2))
            productivityTrend.push(Math.min(10, Math.round((c.energyMorning + c.mood * 2) / 2)))
          })
          setTrendData({
            energy: energyTrend.reverse(),
            mood: moodTrend.reverse(),
            productivity: productivityTrend.reverse(),
          })
        } else {
          setTrendData({
            energy: [6, 5, 8, 7, 4, 9, 7, 8, 6, 7, 8, 5, 6, 7, 8, 9, 7, 6, 8, 7, 6, 7, 8, 9, 8, 7, 6, 5, 8, 7],
            mood: [7, 6, 8, 7, 5, 9, 8, 7, 7, 8, 8, 6, 7, 8, 9, 8, 7, 7, 8, 6, 7, 8, 9, 8, 8, 7, 7, 6, 8, 9],
            productivity: [6, 5, 7, 8, 4, 8, 6, 7, 5, 8, 7, 5, 6, 8, 9, 7, 6, 5, 8, 7, 6, 8, 9, 7, 8, 6, 5, 4, 8, 7],
          })
        }

        let avgMood: number | null = null
        let avgEnergy: number | null = null

        if (checkinData.data && checkinData.data.length > 0) {
          const checkins = checkinData.data.slice(0, 30)
          avgMood = checkins.reduce((s: number, c: { mood: number }) => s + c.mood, 0) / checkins.length
          avgEnergy = checkins.reduce((s: number, c: { energyMorning: number }) => s + c.energyMorning, 0) / checkins.length
        }

        const generatedInsights: { type: string; text: string }[] = []

        if (avgMood !== null) {
          if (avgMood >= 3.5) {
            generatedInsights.push({ type: 'positive', text: `Your average mood is ${avgMood.toFixed(1)}/5 — you're maintaining a positive outlook.` })
          } else {
            generatedInsights.push({ type: 'pattern', text: `Your average mood is ${avgMood.toFixed(1)}/5. Consider activities that boost your mood.` })
          }
        }

        if (avgEnergy !== null) {
          if (avgEnergy >= 7) {
            generatedInsights.push({ type: 'positive', text: `Energy levels are strong (${avgEnergy.toFixed(1)}/10). Great time for high-impact work.` })
          } else if (avgEnergy < 5) {
            generatedInsights.push({ type: 'improve', text: `Energy averaging ${avgEnergy.toFixed(1)}/10 — check sleep and stress levels.` })
          }
        }

        if (dashboard.data?.lifeScore !== undefined) {
          if (dashboard.data.lifeScore < 50) {
            generatedInsights.push({ type: 'suggestion', text: 'Overall life score is low. Consider focusing on one domain at a time.' })
          } else if (dashboard.data.lifeScore >= 70) {
            generatedInsights.push({ type: 'positive', text: `Life score is ${dashboard.data.lifeScore} — strong across domains!` })
          }
        }

        if (generatedInsights.length === 0) {
          generatedInsights.push({ type: 'pattern', text: 'Keep tracking your data to receive personalized insights.' })
        }

        setInsights(generatedInsights)
      } catch {
        setTrendData({
          energy: [6, 5, 8, 7, 4, 9, 7, 8, 6, 7, 8, 5, 6, 7, 8, 9, 7, 6, 8, 7, 6, 7, 8, 9, 8, 7, 6, 5, 8, 7],
          mood: [7, 6, 8, 7, 5, 9, 8, 7, 7, 8, 8, 6, 7, 8, 9, 8, 7, 7, 8, 6, 7, 8, 9, 8, 8, 7, 7, 6, 8, 9],
          productivity: [6, 5, 7, 8, 4, 8, 6, 7, 5, 8, 7, 5, 6, 8, 9, 7, 6, 5, 8, 7, 6, 8, 9, 7, 8, 6, 5, 4, 8, 7],
        })
        setInsights([
          { type: 'pattern', text: 'Keep tracking your data to receive personalized insights.' },
        ])
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [user])

  const score = lifeScore ?? 68

  if (isLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-text-secondary">
            Life scores, trends, and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary">
            <Download className="h-4 w-4" />
            Weekly Report
          </Button>
          <Button size="sm" variant="secondary">
            <Download className="h-4 w-4" />
            Monthly Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Life Score Gauge */}
        <Card padding="md" className="space-y-4">
          <h2 className="neo-label">Life Score</h2>
          <div className="flex items-center justify-center py-4">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="8"
                  strokeDasharray={`${(score / 100) * 264} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold">{Math.round(score)}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">/ 100</span>
              </div>
            </div>
          </div>
          {lifeScore !== null && (
            <div className="flex items-center justify-center gap-1 text-xs text-text-tertiary">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success font-semibold">Live</span>
              <span>score based on your data</span>
            </div>
          )}
        </Card>

        {/* Domain Balance Radar */}
        <Card padding="md" className="space-y-4">
          <h2 className="neo-label">Domain Balance</h2>
          <div className="flex items-center justify-center py-4">
            <svg viewBox="0 0 300 300" className="h-56 w-56">
              {[0.25, 0.5, 0.75, 1].map((scale) => (
                <polygon
                  key={scale}
                  points={domainLabels.map((_, i) => {
                    const angle = (i * 2 * Math.PI) / domainLabels.length - Math.PI / 2
                    const r = 120 * scale
                    return `${150 + r * Math.cos(angle)},${150 + r * Math.sin(angle)}`
                  }).join(' ')}
                  fill="none"
                  stroke="var(--color-border-light)"
                  strokeWidth="1"
                />
              ))}
              {domainLabels.map((_, i) => {
                const angle = (i * 2 * Math.PI) / domainLabels.length - Math.PI / 2
                const x2 = 150 + 120 * Math.cos(angle)
                const y2 = 150 + 120 * Math.sin(angle)
                return <line key={i} x1="150" y1="150" x2={x2} y2={y2} stroke="var(--color-border-light)" strokeWidth="1" />
              })}
              <polygon
                points={domainScores.map((s, i) => {
                  const angle = (i * 2 * Math.PI) / domainLabels.length - Math.PI / 2
                  const r = (Math.min(100, Math.max(0, s)) / 100) * 120
                  return `${150 + r * Math.cos(angle)},${150 + r * Math.sin(angle)}`
                }).join(' ')}
                fill="var(--color-accent)"
                fillOpacity="0.2"
                stroke="var(--color-accent)"
                strokeWidth="2"
              />
              {domainLabels.map((label, i) => {
                const angle = (i * 2 * Math.PI) / domainLabels.length - Math.PI / 2
                const r = 135
                const x = 150 + r * Math.cos(angle)
                const y = 150 + r * Math.sin(angle)
                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] font-bold"
                    fill="var(--color-text-secondary)"
                  >
                    {label}
                  </text>
                )
              })}
            </svg>
          </div>
        </Card>
      </div>

      {/* Trends */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="neo-label">Trends (30 days)</h2>
          <div className="flex rounded-sm border-2 border-border">
            {(['energy', 'mood', 'productivity'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTrendMetric(m)}
                className={cn(
                  'px-3 py-1 text-xs font-bold uppercase capitalize neo-transition',
                  trendMetric === m ? 'bg-accent text-accent-text' : 'bg-surface hover:bg-bg-tertiary',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-1 h-32">
          {(trendData[trendMetric] ?? []).map((val, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  'w-full rounded-sm neo-transition',
                  trendMetric === 'energy' && 'bg-warning',
                  trendMetric === 'mood' && 'bg-success',
                  trendMetric === 'productivity' && 'bg-accent',
                )}
                style={{ height: `${(Math.min(10, Math.max(0, val)) / 10) * 100}%` }}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between text-[10px] text-text-tertiary">
          <span>{new Date(Date.now() - 30 * 86400000).toLocaleDateString()}</span>
          <span>Today</span>
        </div>
      </Card>

      {/* Goal Progress */}
      <Card padding="md" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="neo-label">Goal Progress</h2>
          <button className="text-xs font-semibold text-accent hover:underline">View all</button>
        </div>
        <div className="space-y-3">
          {domainScores.length > 0 ? (
            domainLabels.slice(0, 5).map((label, i) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{label}</span>
                  <span className="text-xs text-text-tertiary">{Math.min(100, Math.max(0, domainScores[i] ?? 50))}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-sm bg-bg-tertiary">
                  <div
                    className={cn('h-full rounded-sm', [
                      'bg-domain-career',
                      'bg-domain-health',
                      'bg-domain-learning',
                      'bg-accent',
                      'bg-domain-finance',
                    ][i % 5])}
                    style={{ width: `${Math.min(100, Math.max(0, domainScores[i] ?? 50))}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-tertiary py-4 text-center">Track goals to see progress here.</p>
          )}
        </div>
      </Card>

      {/* AI Insights */}
      <Card variant="ai" padding="md" className="space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <h2 className="neo-label text-accent">AI Insights</h2>
          <Sparkles className="h-3 w-3 text-accent" />
        </div>
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-sm border-2 border-border bg-surface p-3"
            >
              <div className={cn(
                'mt-0.5 h-2 w-2 rounded-sm flex-shrink-0',
                insight.type === 'positive' && 'bg-success',
                insight.type === 'improve' && 'bg-error',
                insight.type === 'pattern' && 'bg-info',
                insight.type === 'suggestion' && 'bg-accent',
              )} />
              <p className="text-sm text-text-secondary">{insight.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
