'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input } from '@/components/ui'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  Clock,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { format } from 'date-fns'

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  startTime: string
  endTime: string
  eventType?: string
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  return days
}

export default function CalendarPage() {
  const user = useAuthStore((s) => s.user)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate())
  
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [startTimeStr, setStartTimeStr] = useState('09:00')
  const [endTimeStr, setEndTimeStr] = useState('10:00')
  const [eventType, setEventType] = useState('meeting')
  const [saving, setSaving] = useState(false)

  const days = getMonthGrid(year, month)
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (user) {
      fetchEvents()
    }
  }, [user, year, month])

  async function fetchEvents() {
    setLoading(true)
    try {
      const fromDate = new Date(year, month, 1).toISOString()
      const toDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
      const res = await fetch(`/api/calendar?userId=${user?.id}&fromDate=${fromDate}&toDate=${toDate}`)
      const json = await res.json()
      if (json.data) {
        setEvents(json.data)
      }
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !title.trim() || !selectedDay) return

    setSaving(true)
    try {
      const [startH, startM] = startTimeStr.split(':').map(Number)
      const [endH, endM] = endTimeStr.split(':').map(Number)

      const start = new Date(year, month, selectedDay, startH, startM)
      const end = new Date(year, month, selectedDay, endH, endM)

      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: title.trim(),
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          eventType,
        }),
      })

      if (res.ok) {
        setTitle('')
        setShowAddForm(false)
        fetchEvents()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Group events by day of month
  const eventsByDay: Record<string, CalendarEvent[]> = {}
  events.forEach((evt) => {
    try {
      const day = new Date(evt.startTime).getDate()
      if (!eventsByDay[day]) eventsByDay[day] = []
      eventsByDay[day].push(evt)
    } catch (err) {
      console.error(err)
    }
  })

  const selectedEvents = selectedDay ? eventsByDay[selectedDay] ?? [] : []

  const formatEventTime = (isoString: string) => {
    try {
      return format(new Date(isoString), 'HH:mm')
    } catch {
      return '--:--'
    }
  }

  const getEventColor = (type?: string) => {
    switch (type) {
      case 'focus':
        return 'bg-accent border-accent'
      case 'meeting':
        return 'bg-info border-info'
      case 'health':
        return 'bg-domain-health border-domain-health'
      case 'social':
        return 'bg-domain-relationships border-domain-relationships'
      default:
        return 'bg-warning border-warning'
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-text-secondary">
            Sync, allocate, and schedule focus sessions
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Event
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar Grid */}
        <Card padding="md" className="space-y-4">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (month === 0) { setYear((y) => y - 1); setMonth(11) }
                else setMonth((m) => m - 1)
              }}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-border bg-surface hover:bg-bg-tertiary neo-transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-bold">{monthName}</h2>
            <button
              onClick={() => {
                if (month === 11) { setYear((y) => y + 1); setMonth(0) }
                else setMonth((m) => m + 1)
              }}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-border bg-surface hover:bg-bg-tertiary neo-transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => (
              <p key={d} className="py-1 text-center text-[10px] font-bold uppercase text-text-tertiary">{d}</p>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <span className="text-xs text-text-tertiary animate-pulse">Loading schedule...</span>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => (
                <button
                  key={i}
                  onClick={() => day && setSelectedDay(day)}
                  disabled={!day}
                  className={cn(
                    'relative flex aspect-square items-center justify-center rounded-sm border-2 text-sm font-semibold neo-transition',
                    day === selectedDay
                      ? 'border-accent bg-accent text-accent-text'
                      : day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
                        ? 'border-accent/50 bg-accent-light text-accent dark:bg-accent/10'
                        : day
                          ? 'border-border bg-surface hover:bg-bg-tertiary'
                          : 'border-transparent bg-transparent',
                  )}
                >
                  {day}
                  {day && eventsByDay[day] && eventsByDay[day].length > 1 && (
                    <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[8px] font-bold text-white border border-border">
                      {eventsByDay[day].length}
                    </div>
                  )}
                  {day && eventsByDay[day] && eventsByDay[day].length === 1 && (
                    <div className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Day Detail & Add Form */}
        <div className="space-y-4">
          {/* Quick Add Form */}
          {showAddForm && selectedDay && (
            <Card padding="md" className="space-y-3 border-accent">
              <h3 className="text-sm font-bold flex items-center gap-1 text-accent">
                <Sparkles className="h-4 w-4" />
                Add Event for Day {selectedDay}
              </h3>
              <form onSubmit={handleAddEvent} className="space-y-3">
                <Input
                  label="Event Title"
                  placeholder="e.g., Focus block, design review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Start"
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    required
                  />
                  <Input
                    label="End"
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="neo-label block mb-1 text-xs">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="neo-border rounded-sm w-full px-2 py-1.5 bg-surface text-xs font-bold focus:outline-none"
                  >
                    <option value="focus">Focus block</option>
                    <option value="meeting">Meeting</option>
                    <option value="health">Health & Fitness</option>
                    <option value="social">Social / Personal</option>
                    <option value="work">Work task</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Selected day details */}
          <Card padding="md" className="space-y-3">
            <h3 className="neo-label">
              {selectedDay
                ? new Date(year, month, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a day'}
            </h3>

            {selectedEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedEvents.map((evt, i) => (
                  <div key={i} className="space-y-1 rounded-sm border-2 border-border bg-bg p-3 hover:bg-bg-secondary neo-transition">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2.5 w-2.5 rounded-sm', getEventColor(evt.eventType))} />
                      <span className="text-sm font-bold">{evt.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-4 text-text-tertiary">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs font-mono">
                        {formatEventTime(evt.startTime)} - {formatEventTime(evt.endTime)}
                      </span>
                    </div>
                  </div>
                ))}

                {selectedEvents.length > 1 && (
                  <div className="flex items-center gap-1.5 rounded-sm border-2 border-warning bg-warning-bg p-2 text-xs font-semibold text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Possible overlap detected ({selectedEvents.length} events today)
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="mb-2 h-8 w-8 text-text-tertiary" />
                <p className="text-sm text-text-tertiary">No events today</p>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => setShowAddForm(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Event
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
