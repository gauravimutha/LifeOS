'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input } from '@/components/ui'
import {
  Heart,
  Plus,
  Moon,
  Zap,
  Smile,
  Loader2,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { format, subDays } from 'date-fns'

interface HealthRecord {
  id: string
  date: string
  sleepHours: number | null
  energyLevel: number | null
  moodScore: number | null
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function HealthPage() {
  const user = useAuthStore((s) => s.user)
  const [trendView, setTrendView] = useState<'7' | '30'>('7')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<HealthRecord[]>([])
  
  const [sleep, setSleep] = useState('7')
  const [energy, setEnergy] = useState('7')
  const [mood, setMood] = useState('7')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      fetchHealthData()
    }
  }, [user, trendView])

  async function fetchHealthData() {
    setLoading(true)
    try {
      const daysToFetch = parseInt(trendView)
      const fromDate = subDays(new Date(), daysToFetch).toISOString().split('T')[0]
      const toDate = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/health?userId=${user?.id}&fromDate=${fromDate}&toDate=${toDate}`)
      const json = await res.json()
      if (json.data) {
        setHistory(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch health data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveLog(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          date: todayStr,
          sleepHours: parseFloat(sleep),
          energyLevel: parseInt(energy),
          moodScore: parseInt(mood),
        }),
      })

      if (res.ok) {
        setShowForm(false)
        fetchHealthData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Get averages or fallback
  const getTodaySnapshot = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayRecord = history.find((h) => h.date.startsWith(todayStr))
    return {
      sleep: todayRecord?.sleepHours ?? 7.0,
      energy: todayRecord?.energyLevel ?? 7,
      mood: todayRecord?.moodScore ?? 8,
    }
  }

  const snapshot = getTodaySnapshot()

  // Generate chart columns for last 7 days
  const getChartData = () => {
    const data = { sleep: [] as number[], energy: [] as number[], mood: [] as number[], labels: [] as string[] }
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const dStr = d.toISOString().split('T')[0]
      const record = history.find((h) => h.date.startsWith(dStr))
      data.sleep.push(record?.sleepHours ?? 0)
      data.energy.push(record?.energyLevel ?? 0)
      data.mood.push(record?.moodScore ?? 0)
      data.labels.push(format(d, 'EEE'))
    }
    return data
  }

  const chartData = getChartData()

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health</h1>
          <p className="text-sm text-text-secondary">
            Sleep, energy, and mood tracking
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Log Today
        </Button>
      </div>

      {/* Quick Log Form */}
      {showForm && (
        <Card padding="md" className="space-y-4 animate-fade-in">
          <h2 className="neo-label">Quick Health Log</h2>
          <form onSubmit={handleSaveLog} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="neo-label block text-xs">Sleep (hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  className="neo-input w-full"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="neo-label block text-xs">Energy (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value)}
                  className="neo-input w-full"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="neo-label block text-xs">Mood (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="neo-input w-full"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Log'}
              </Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Today's Snapshot */}
      <Card padding="md" className="space-y-3">
        <h2 className="neo-label">Today&apos;s Snapshot</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1 rounded-sm border-2 border-border bg-bg p-3 text-center">
            <Moon className="mx-auto h-5 w-5 text-domain-spirituality" />
            <p className="text-lg font-bold">{snapshot.sleep.toFixed(1)}h</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Sleep</p>
          </div>
          <div className="space-y-1 rounded-sm border-2 border-border bg-bg p-3 text-center">
            <Zap className="mx-auto h-5 w-5 text-warning" />
            <p className="text-lg font-bold">{snapshot.energy}/10</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Energy</p>
          </div>
          <div className="space-y-1 rounded-sm border-2 border-border bg-bg p-3 text-center">
            <Smile className="mx-auto h-5 w-5 text-success" />
            <p className="text-lg font-bold">{snapshot.mood}/10</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Mood</p>
          </div>
        </div>
      </Card>

      {/* Weekly Summary Charts */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="neo-label">History trends</h2>
          <div className="flex rounded-sm border-2 border-border bg-bg-secondary p-0.5">
            {(['7', '30'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setTrendView(v)}
                className={cn(
                  'px-3 py-1 text-xs font-bold uppercase neo-transition',
                  trendView === v ? 'bg-accent text-accent-text' : 'bg-transparent text-text-secondary',
                )}
              >
                {v}d
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="text-xs text-text-tertiary animate-pulse">Loading trend charts...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sleep Chart */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Moon className="h-3.5 w-3.5 text-domain-spirituality" />
                <span className="text-xs font-bold uppercase text-text-tertiary">Sleep (hrs)</span>
              </div>
              <div className="flex items-end gap-1.5 h-20 bg-bg-secondary p-2 rounded-sm border border-border">
                {chartData.sleep.map((val, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full rounded-sm bg-domain-spirituality neo-transition"
                      style={{ height: `${Math.min(100, (val / 12) * 100)}%`, minHeight: val > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[9px] font-bold text-text-tertiary">{chartData.labels[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Energy Chart */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-warning" />
                <span className="text-xs font-bold uppercase text-text-tertiary">Energy level</span>
              </div>
              <div className="flex items-end gap-1.5 h-20 bg-bg-secondary p-2 rounded-sm border border-border">
                {chartData.energy.map((val, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full rounded-sm bg-warning neo-transition"
                      style={{ height: `${(val / 10) * 100}%`, minHeight: val > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[9px] font-bold text-text-tertiary">{chartData.labels[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mood Chart */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Smile className="h-3.5 w-3.5 text-success" />
                <span className="text-xs font-bold uppercase text-text-tertiary">Mood score</span>
              </div>
              <div className="flex items-end gap-1.5 h-20 bg-bg-secondary p-2 rounded-sm border border-border">
                {chartData.mood.map((val, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full rounded-sm bg-success neo-transition"
                      style={{ height: `${(val / 10) * 100}%`, minHeight: val > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[9px] font-bold text-text-tertiary">{chartData.labels[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
