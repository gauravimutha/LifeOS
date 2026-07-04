'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCheckinStore } from '@/stores/checkinStore'
import { Card, Button } from '@/components/ui'
import {
  Sparkles,
  Sun,
  Moon,
  Brain,
  Heart,
  Target,
  Zap,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'

const moodOptions = [
  { value: 1, label: 'Terrible', icon: Moon, color: 'text-error' },
  { value: 2, label: 'Low', icon: Moon, color: 'text-warning' },
  { value: 3, label: 'Okay', icon: Sun, color: 'text-warning' },
  { value: 4, label: 'Good', icon: Sun, color: 'text-info' },
  { value: 5, label: 'Great', icon: Sparkles, color: 'text-success' },
]

export default function CheckInPage() {
  const user = useAuthStore((s) => s.user)
  const { todayCheckin, isLoading, error, fetchTodayCheckin, submitCheckin, clearError } = useCheckinStore()

  const [step, setStep] = useState<'mood' | 'energy' | 'details' | 'done'>('mood')
  const [mood, setMood] = useState<number>(0)
  const [energyMorning, setEnergyMorning] = useState<number>(0)
  const [sleepHours, setSleepHours] = useState('')
  const [focusToday, setFocusToday] = useState('')
  const [obstacles, setObstacles] = useState('')
  const [gratitude, setGratitude] = useState('')
  const [yesterdayAccomplished, setYesterdayAccomplished] = useState('')

  useEffect(() => {
    if (user) fetchTodayCheckin()
  }, [user, fetchTodayCheckin])

  useEffect(() => {
    if (todayCheckin) setStep('done')
  }, [todayCheckin])

  async function handleSubmit() {
    if (!user) return
    await submitCheckin({
      date: format(new Date(), 'yyyy-MM-dd'),
      mood,
      energyMorning,
      sleepHours: sleepHours ? parseFloat(sleepHours) : 0,
      focusToday,
      obstacles,
      gratitude,
      yesterdayAccomplished,
    })
    setStep('done')
  }

  if (isLoading && step === 'mood') {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
        </div>
      </div>
    )
  }

  if (step === 'done' && todayCheckin) {
    return (
      <div className="animate-fade-in space-y-6">
        <Card padding="lg" className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-success/20">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Check-In Complete!</h1>
          <p className="text-sm text-text-secondary">
            Logged at {new Date(todayCheckin.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            <Card padding="sm" variant="ghost">
              <p className="neo-label text-xs">Mood</p>
              <p className="text-lg font-bold">{moodOptions.find((m) => m.value === todayCheckin.mood)?.label ?? todayCheckin.mood}/5</p>
            </Card>
            <Card padding="sm" variant="ghost">
              <p className="neo-label text-xs">Energy</p>
              <p className="text-lg font-bold">{todayCheckin.energyMorning}/10</p>
            </Card>
            {todayCheckin.sleepHours > 0 && (
              <Card padding="sm" variant="ghost">
                <p className="neo-label text-xs">Sleep</p>
                <p className="text-lg font-bold">{todayCheckin.sleepHours}h</p>
              </Card>
            )}
            {todayCheckin.focusToday && (
              <Card padding="sm" variant="ghost">
                <p className="neo-label text-xs">Focus</p>
                <p className="text-sm font-semibold truncate">{todayCheckin.focusToday}</p>
              </Card>
            )}
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/ai">
              <Button variant="primary">
                <Brain className="h-4 w-4" />
                Chat with Coach
              </Button>
            </Link>
            <Link href="/plan">
              <Button variant="secondary">
                <Target className="h-4 w-4" />
                View Plan
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Check-In</h1>
        <p className="text-sm text-text-secondary">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {error && (
        <Card padding="sm" variant="default" className="border-error bg-error/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-error">{error}</p>
            <button onClick={clearError} className="text-xs text-error hover:underline">Dismiss</button>
          </div>
        </Card>
      )}

      <Card padding="lg" className="space-y-6">
        {step === 'mood' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-bold">How are you feeling?</h2>
            </div>
            <p className="text-sm text-text-secondary">Select your current mood</p>
            <div className="grid grid-cols-5 gap-3">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setMood(option.value); setStep('energy') }}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-sm border-2 p-4 neo-transition',
                    mood === option.value
                      ? 'border-accent bg-accent text-accent-text'
                      : 'border-border bg-surface hover:bg-bg-tertiary',
                  )}
                >
                  <option.icon className={cn('h-8 w-8', mood !== option.value && option.color)} />
                  <span className="text-xs font-bold">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'energy' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-bold">Energy Level</h2>
            </div>
            <p className="text-sm text-text-secondary">How&apos;s your energy this morning?</p>
            <div className="space-y-3">
              <input
                type="range"
                min="1"
                max="10"
                value={energyMorning || 5}
                onChange={(e) => setEnergyMorning(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex items-center justify-between text-xs text-text-tertiary">
                <span>Low (1)</span>
                <span className="text-lg font-bold text-accent">{energyMorning || 5}/10</span>
                <span>High (10)</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('mood')}>Back</Button>
              <Button variant="primary" onClick={() => setStep('details')}>Continue</Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-bold">Morning Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="neo-label mb-1 block">Hours of sleep</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  placeholder="7.5"
                  className="neo-input w-full"
                />
              </div>
              <div>
                <label className="neo-label mb-1 block">What are you focusing on today?</label>
                <textarea
                  value={focusToday}
                  onChange={(e) => setFocusToday(e.target.value)}
                  placeholder="What's the one thing you want to accomplish?"
                  className="neo-input w-full min-h-[80px]"
                  rows={3}
                />
              </div>
              <div>
                <label className="neo-label mb-1 block">Any obstacles or challenges?</label>
                <textarea
                  value={obstacles}
                  onChange={(e) => setObstacles(e.target.value)}
                  placeholder="What might get in your way?"
                  className="neo-input w-full min-h-[60px]"
                  rows={2}
                />
              </div>
              <div>
                <label className="neo-label mb-1 block">Something you&apos;re grateful for</label>
                <textarea
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  placeholder="What's going well?"
                  className="neo-input w-full min-h-[60px]"
                  rows={2}
                />
              </div>
              <div>
                <label className="neo-label mb-1 block">What did you accomplish yesterday?</label>
                <textarea
                  value={yesterdayAccomplished}
                  onChange={(e) => setYesterdayAccomplished(e.target.value)}
                  placeholder="What did you get done?"
                  className="neo-input w-full min-h-[60px]"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('energy')}>Back</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Complete Check-In'}
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
