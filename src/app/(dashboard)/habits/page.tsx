'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge } from '@/components/ui'
import { Repeat, Plus, Check, Flame, CalendarDays, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

interface DbHabit {
  id: string
  title: string
  description?: string
  frequency: string
  streak: number
  bestStreak: number
  totalCount: number
  status: string
  completedToday: boolean
}

export default function HabitsPage() {
  const user = useAuthStore((s) => s.user)
  const [habits, setHabits] = useState<DbHabit[]>([])
  const [loading, setLoading] = useState(true)
  const [newHabit, setNewHabit] = useState('')
  const [adding, setAdding] = useState(false)
  const [view, setView] = useState<'checklist' | 'cards'>('checklist')

  useEffect(() => {
    if (user) {
      fetchHabits()
    }
  }, [user])

  async function fetchHabits() {
    setLoading(true)
    try {
      const res = await fetch(`/api/habits?userId=${user?.id}`)
      const json = await res.json()
      if (json.data) {
        setHabits(json.data)
      }
    } catch (err) {
      console.error('Failed to load habits:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddHabit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!user || !newHabit.trim() || adding) return

    setAdding(true)
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newHabit.trim(),
          habitType: 'boolean',
          frequency: 'daily',
        }),
      })
      const result = await res.json()
      if (result.data) {
        setNewHabit('')
        fetchHabits()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  async function handleLogHabit(id: string) {
    if (!user) return
    const habit = habits.find((h) => h.id === id)
    if (!habit) return

    const todayStr = new Date().toISOString().split('T')[0]
    const isCompleted = habit.completedToday

    try {
      if (isCompleted) {
        // DELETE habit log (uncomplete)
        const res = await fetch(`/api/habits/${id}/log?userId=${user.id}&date=${todayStr}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          setHabits((prev) =>
            prev.map((h) =>
              h.id === id
                ? {
                    ...h,
                    completedToday: false,
                    streak: Math.max(0, h.streak - 1),
                    totalCount: Math.max(0, h.totalCount - 1),
                  }
                : h
            )
          )
        }
      } else {
        // POST habit log (complete)
        const res = await fetch(`/api/habits/${id}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            date: todayStr,
            value: 1,
          }),
        })
        if (res.ok) {
          setHabits((prev) =>
            prev.map((h) =>
              h.id === id
                ? {
                    ...h,
                    completedToday: true,
                    streak: h.streak + 1,
                    totalCount: h.totalCount + 1,
                  }
                : h
            )
          )
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Habits</h1>
          <p className="text-sm text-text-secondary">
            Build and track consistency across life categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-sm border-2 border-border bg-bg-secondary p-0.5">
            {(['checklist', 'cards'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold uppercase neo-transition',
                  view === v ? 'bg-accent text-accent-text' : 'bg-transparent text-text-secondary',
                )}
              >
                {v === 'checklist' ? 'Today' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <form onSubmit={handleAddHabit}>
        <Card padding="md">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-text-tertiary" />
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="Track a new habit..."
              className="flex-1 bg-transparent text-sm font-medium placeholder:text-text-tertiary focus:outline-none"
              disabled={adding}
            />
            <Button size="sm" type="submit" disabled={!newHabit.trim() || adding}>
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Track'}
            </Button>
          </div>
        </Card>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center">
          <span className="text-sm text-text-tertiary animate-pulse">Loading habits vault...</span>
        </div>
      )}

      {/* Checklist View */}
      {!loading && view === 'checklist' && (
        <Card padding="sm" className="divide-y-2 divide-border">
          {habits.length > 0 ? (
            habits.map((habit) => (
              <div key={habit.id} className="flex items-center gap-3 p-3 hover:bg-bg-secondary neo-transition">
                <button
                  onClick={() => handleLogHabit(habit.id)}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-sm border-2 neo-transition",
                    habit.completedToday
                      ? "border-success bg-success/15"
                      : "border-border bg-surface hover:border-success"
                  )}
                  aria-label={habit.completedToday ? "Unlog habit completion" : "Log habit completion"}
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 text-success neo-transition",
                      habit.completedToday ? "opacity-100" : "opacity-0 hover:opacity-100"
                    )}
                  />
                </button>
                <div className="flex-1">
                  <p className={cn("text-sm font-semibold", habit.completedToday && "text-text-secondary line-through")}>{habit.title}</p>
                  <p className="text-xs text-text-tertiary">Frequency: {habit.frequency}</p>
                </div>
                {habit.streak > 0 && (
                  <div className="flex items-center gap-1 rounded-sm border-2 border-warning bg-warning-bg px-2 py-1 text-xs font-bold text-warning">
                    <Flame className="h-3 w-3" />
                    {habit.streak} day streak
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-text-tertiary">
              No habits set up yet. Let's create one above!
            </div>
          )}
        </Card>
      )}

      {/* Cards View */}
      {!loading && view === 'cards' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => (
            <Card key={habit.id} padding="md" className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="primary" className="text-[10px] capitalize">
                  {habit.frequency}
                </Badge>
                <div className="flex items-center gap-1 rounded-sm border-2 border-warning bg-warning-bg px-2 py-0.5 text-xs font-bold text-warning">
                  <Flame className="h-3 w-3" />
                  {habit.streak} days
                </div>
              </div>
              <h3 className="text-sm font-bold">{habit.title}</h3>
              <p className="text-xs text-text-tertiary">Best Streak: {habit.bestStreak} days</p>
              <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <CalendarDays className="h-3 w-3" />
                <span>Total repetitions logged: {habit.totalCount}</span>
              </div>
              <Button
                size="sm"
                variant={habit.completedToday ? "outline" : "secondary"}
                onClick={() => handleLogHabit(habit.id)}
                className={cn(
                  "w-full",
                  habit.completedToday && "bg-success/10 border-success text-success hover:bg-success/15"
                )}
              >
                {habit.completedToday ? "Logged ✓" : "Log Progress"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
