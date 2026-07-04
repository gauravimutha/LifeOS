'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge, toast } from '@/components/ui'
import {
  Plus,
  ListTodo,
  Brain,
  Sparkles,
  Circle,
  CheckCircle2,
  Clock,
  Flag,
  Loader2,
  Trash2,
  Check,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { format } from 'date-fns'

interface DbGoal {
  id: string
  title: string
  status: string
}

interface DbTask {
  id: string
  title: string
  description?: string
  priority: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'cancelled'
  dueDate?: string
  scheduledStart?: string
  estimatedMinutes?: number
  goalId?: string | null
  goal?: {
    id: string
    title: string
  } | null
}

const aiSuggestionsMock = [
  { id: 's1', title: 'Schedule weekly deep focus blocks', context: 'Planning', reason: 'To match your high morning energy' },
  { id: 's2', title: 'Plan physical exercise routine', context: 'Health', reason: 'Based on your wellness goals' },
]

export default function TasksPage() {
  const user = useAuthStore((s) => s.user)
  const [tasks, setTasks] = useState<DbTask[]>([])
  const [goals, setGoals] = useState<DbGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  // Tabs structure
  const [subTab, setSubTab] = useState<'goals' | 'extra'>('goals')
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0])
  const [regenerating, setRegenerating] = useState(false)

  const visibleSuggestions = aiSuggestionsMock.filter(
    (s) => !tasks.some((t) => t.title.toLowerCase() === s.title.toLowerCase())
  )

  useEffect(() => {
    if (user) {
      fetchTasks()
      fetchGoals()
    }
  }, [user])

  async function fetchTasks() {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks?userId=${user?.id}`)
      const json = await res.json()
      if (json.data) {
        setTasks(json.data)
      }
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchGoals() {
    try {
      const res = await fetch(`/api/goals?userId=${user?.id}&status=active`)
      const json = await res.json()
      if (json.data) {
        setGoals(json.data)
      }
    } catch (err) {
      console.error('Failed to load goals:', err)
    }
  }

  async function handleAddTask(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!user || !newTask.trim() || adding) return

    setAdding(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newTask.trim(),
          priority: 3,
          status: 'pending',
          goalId: subTab === 'goals' && selectedGoalId ? selectedGoalId : undefined,
        }),
      })
      const result = await res.json()
      if (result.data) {
        setNewTask('')
        setSelectedGoalId('')
        fetchTasks()
        toast("New task added! ✏️", "success")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  async function handleCompleteTask(id: string) {
    try {
      const res = await fetch(`/api/tasks/${id}/complete`, {
        method: 'POST',
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? json.data : t))
          )
          toast(json.data.status === 'completed' ? "Task marked complete! 🎉" : "Task marked pending.", "success")
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDeleteTask(id: string) {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchTasks()
        toast("Task deleted.", "success")
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleToggleScheduleTask(task: DbTask) {
    const isScheduled = !!task.scheduledStart && task.scheduledStart.startsWith(scheduleDate)
    const newScheduledStart = isScheduled ? null : new Date(`${scheduleDate}T09:00:00`).toISOString()

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledStart: newScheduledStart,
        }),
      })

      if (res.ok) {
        toast(isScheduled ? "Task removed from plan schedule." : "Task scheduled for day plan!", "success")
        fetchTasks()
      }
    } catch (e) {
      console.error(e)
      toast("Failed to update task schedule.", "error")
    }
  }

  async function handleGenerateFinalSchedule() {
    if (!user) return
    setRegenerating(true)
    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'daily',
          date: scheduleDate,
        }),
      })
      if (res.ok) {
        toast(`Final daily schedule generated for ${scheduleDate}! 🚀`, "success")
      } else {
        toast("Failed to build schedule.", "error")
      }
    } catch (e) {
      console.error(e)
      toast("Failed to build schedule.", "error")
    } finally {
      setRegenerating(false)
    }
  }

  // Filtering based on current active tab
  const filteredTasks = tasks.filter((t) => {
    // Tab filter
    if (subTab === 'goals' && !t.goalId) return false
    if (subTab === 'extra' && t.goalId) return false

    // Status filter
    if (filter === 'pending') return t.status !== 'completed'
    if (filter === 'completed') return t.status === 'completed'
    return true
  })

  const pendingCount = filteredTasks.filter((t) => t.status !== 'completed').length
  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length

  // Group tasks by Goal
  const groups: Record<string, { title: string; tasks: DbTask[] }> = {}
  if (subTab === 'extra') {
    groups['extra'] = { title: '📌 Inbox / Extra Tasks (General)', tasks: [] }
  }

  filteredTasks.forEach((task) => {
    const key = task.goal ? task.goal.id : 'extra'
    const title = task.goal ? `🎯 Goal: ${task.goal.title}` : '📌 Inbox / Extra Tasks (General)'
    if (!groups[key]) {
      groups[key] = { title, tasks: [] }
    }
    groups[key].tasks.push(task)
  })

  const sortedGroups = Object.entries(groups).sort(([keyA, valA], [keyB, valB]) => {
    if (keyA === 'extra') return -1
    if (keyB === 'extra') return 1
    return valA.title.localeCompare(valB.title)
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-text-secondary">
            {completedCount} completed · {pendingCount} pending
          </p>
        </div>
        <div className="flex rounded-sm border-2 border-border bg-bg-secondary p-0.5 flex-shrink-0 w-fit self-start sm:self-auto">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-xs font-bold capitalize neo-transition whitespace-nowrap',
                filter === f ? 'bg-accent text-accent-text' : 'bg-transparent text-text-secondary'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b-2 border-border">
        <button
          onClick={() => setSubTab('goals')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold uppercase border-b-4 -mb-[2px] transition-all",
            subTab === 'goals' ? "border-accent text-accent" : "border-transparent text-text-secondary hover:text-text-primary"
          )}
        >
          <Brain className="h-4 w-4" />
          Goal-Aligned Tasks
        </button>
        <button
          onClick={() => setSubTab('extra')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold uppercase border-b-4 -mb-[2px] transition-all",
            subTab === 'extra' ? "border-accent text-accent" : "border-transparent text-text-secondary hover:text-text-primary"
          )}
        >
          <Layers className="h-4 w-4" />
          Extra / External Tasks
        </button>
      </div>

      {/* Interactive Planner Dashboard for Extra Tasks */}
      {subTab === 'extra' && (
        <Card variant="highlighted" padding="md" className="border-accent bg-accent-light/10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Schedule & Finalize Daily Plan
              </span>
              <p className="text-xs text-text-secondary">
                Select a target day and link your general/extra tasks to it, then rebuild your final day plan.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <input 
                type="date" 
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="neo-input text-xs h-9 py-1 px-2.5"
              />
              <Button 
                size="sm"
                onClick={handleGenerateFinalSchedule}
                disabled={regenerating}
                className="h-9 flex items-center gap-1.5"
              >
                {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate Final Schedule
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Add */}
      <form onSubmit={handleAddTask}>
        <Card padding="md">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Plus className="h-5 w-5 text-text-tertiary flex-shrink-0" />
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder={subTab === 'goals' ? "Add a new goal-aligned task..." : "Add a new extra task..."}
                className="flex-1 bg-transparent text-sm font-medium placeholder:text-text-tertiary focus:outline-none h-9"
                disabled={adding}
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {subTab === 'goals' && (
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="h-9 text-xs font-semibold px-3 rounded-sm border-2 border-border bg-bg-secondary cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={adding}
                  required
                >
                  <option value="">🎯 Select associated Goal...</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      🎯 {g.title}
                    </option>
                  ))}
                </select>
              )}
              <Button size="sm" type="submit" disabled={!newTask.trim() || adding || (subTab === 'goals' && !selectedGoalId)} className="h-9">
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </div>
        </Card>
      </form>

      {/* AI Suggested Tasks */}
      {visibleSuggestions.length > 0 && subTab === 'goals' && (
        <Card variant="ai" padding="md" className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-accent" />
            <h2 className="neo-label text-accent">AI Suggested Actions</h2>
            <Sparkles className="h-3 w-3 text-accent animate-pulse" />
          </div>
          <div className="space-y-2">
            {visibleSuggestions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-sm border-2 border-dashed border-accent bg-accent-light p-3 dark:bg-accent/10 animate-fade-in">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-text-tertiary">{s.context} · {s.reason}</p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={acceptingId !== null}
                  onClick={async () => {
                    if (!user || acceptingId !== null) return
                    setAcceptingId(s.id)
                    try {
                      const res = await fetch('/api/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: user.id,
                          title: s.title,
                          priority: 3,
                          status: 'pending',
                        }),
                      })
                      if (res.ok) {
                        await fetchTasks()
                      }
                    } catch (err) {
                      console.error('Failed to accept task:', err)
                    } finally {
                      setAcceptingId(null)
                    }
                  }}
                  className="h-7 px-2 text-xs"
                >
                  {acceptingId === s.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-3 w-3" />
                      Accept
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Task List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-12 text-center">
            <span className="text-sm text-text-tertiary animate-pulse">Loading tasks...</span>
          </div>
        ) : filteredTasks.length > 0 ? (
          sortedGroups.map(([groupKey, group]) => {
            if (group.tasks.length === 0) return null
            return (
              <div key={groupKey} className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary pl-1">
                  {group.title}
                </h3>
                <Card padding="sm" className="divide-y-2 divide-border">
                  {group.tasks.map((task) => {
                    const isScheduledForTargetDay = !!task.scheduledStart && task.scheduledStart.startsWith(scheduleDate)
                    return (
                      <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 hover:bg-bg-secondary neo-transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            className="flex-shrink-0 cursor-pointer"
                            onClick={() => handleCompleteTask(task.id)}
                            aria-label={task.status === 'completed' ? 'Mark task pending' : 'Mark task complete'}
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <Circle className="h-5 w-5 text-text-tertiary hover:text-accent" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p className={cn('text-sm font-semibold truncate', task.status === 'completed' && 'text-text-tertiary line-through')}>
                              {task.title}
                            </p>
                            
                            {/* Visual hierarchy mapping: Goal and Plan badges */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {task.goal && (
                                <Badge variant="success" className="text-[9px] py-0 px-1 border border-success/35">
                                  🎯 Goal: {task.goal.title}
                                </Badge>
                              )}
                              <Badge variant="default" className="text-[9px] py-0 px-1 font-semibold flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5" />
                                {task.scheduledStart 
                                  ? `Plan: ${format(new Date(task.scheduledStart), 'MMM d, yyyy')}`
                                  : (task.dueDate ? `Due: ${format(new Date(task.dueDate), 'MMM d, yyyy')}` : 'Plan: Unscheduled')
                                }
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-between sm:justify-end flex-shrink-0">
                          {/* Add to day plan toggle for extra tasks */}
                          {subTab === 'extra' && (
                            <button
                              onClick={() => handleToggleScheduleTask(task)}
                              className={cn(
                                "flex items-center gap-1 text-[10px] font-bold px-2 py-1 border-2 rounded-sm neo-transition cursor-pointer",
                                isScheduledForTargetDay 
                                  ? "bg-success border-success text-white" 
                                  : "border-border hover:bg-bg-secondary text-text-secondary"
                              )}
                            >
                              {isScheduledForTargetDay ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  Scheduled
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3" />
                                  Add to Plan
                                </>
                              )}
                            </button>
                          )}

                          <div className="flex items-center gap-2">
                            {task.priority >= 4 && <Flag className="h-3.5 w-3.5 text-error" />}
                            {task.estimatedMinutes && (
                              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                                <Clock className="h-3 w-3" />
                                {task.estimatedMinutes}m
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-text-tertiary hover:text-error neo-transition p-1"
                              aria-label="Delete task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </Card>
              </div>
            )
          })
        ) : (
          <Card padding="lg" className="text-center py-12">
            <ListTodo className="mb-4 h-12 w-12 text-text-tertiary mx-auto" />
            <h2 className="text-lg font-semibold">No tasks found</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Configure your goals or add a task to get started.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
