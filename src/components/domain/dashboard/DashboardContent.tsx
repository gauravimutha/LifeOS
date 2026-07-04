'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCheckinStore } from '@/stores/checkinStore'
import { getGreeting, cn } from '@/lib/utils'
import { Card, Button, Badge, toast } from '@/components/ui'
import {
  Bot,
  ListTodo,
  Brain,
  Sparkles,
  TrendingUp,
  Clock,
  ClipboardCheck,
  X,
  Smile,
  Check,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const PERSONALIZATION_QUESTIONS = [
  {
    id: 'evening_work',
    question: "I noticed your evenings are usually busy. Should I avoid scheduling deep work after 7 PM?",
    key: "user.preferences.avoid_evening_deep_work",
    yesValue: "true",
    noValue: "false"
  },
  {
    id: 'estimation_adjustment',
    question: "I've noticed you consistently complete coding tasks faster than expected. Should I adjust future time estimates?",
    key: "user.preferences.adjust_estimates_faster",
    yesValue: "true",
    noValue: "false"
  },
  {
    id: 'focus_blocks',
    question: "I noticed you focus best in 90-minute blocks. Would you like me to structure your study blocks to match this?",
    key: "user.preferences.preferred_focus_block_minutes",
    yesValue: "90",
    noValue: "60"
  },
  {
    id: 'morning_gym_sync',
    question: "I've detected a pattern: gym sessions in the morning lead to 15% higher task completion. Shall we lock morning gym blocks?",
    key: "user.preferences.lock_morning_gym",
    yesValue: "true",
    noValue: "false"
  }
]

export function DashboardContent() {
  const user = useAuthStore((s) => s.user)
  const { todayCheckin, fetchTodayCheckin } = useCheckinStore()
  const greeting = getGreeting()
  const name = user?.user_metadata?.full_name ?? 'there'

  // Progressive Personalization States
  const [personalizationIndex, setPersonalizationIndex] = useState(0)
  const [personalizationDismissed, setPersonalizationDismissed] = useState(false)
  const [savingMemory, setSavingMemory] = useState(false)

  // Daily Tasks and Accountability States
  const [dailyTasks, setDailyTasks] = useState<any[]>([])
  const [accountabilityAlerts, setAccountabilityAlerts] = useState<any[]>([])

  // Reflection Engine States
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reflectionScore, setReflectionScore] = useState<number | null>(null)
  const [reflectionText, setReflectionText] = useState('')
  const [submittingReflection, setSubmittingReflection] = useState(false)
  const [showReflectionForce, setShowReflectionForce] = useState(false)

  // Future Self & Predictions States
  const [fiveYearVision, setFiveYearVision] = useState('')
  const [savingVision, setSavingVision] = useState(false)

  // Real data states
  const [goals, setGoals] = useState<any[]>([])
  const [todaySchedule, setTodaySchedule] = useState<any[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(true)

  // Pomodoro Focus Timer States
  const [showTimer, setShowTimer] = useState(false)
  const [timerDuration, setTimerDuration] = useState(1500) // Default 25m
  const [timeLeft, setTimeLeft] = useState(1500)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerCompleted, setTimerCompleted] = useState(false)

  useEffect(() => {
    let intervalId: any
    if (timerRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false)
      setTimerCompleted(true)
      toast("Focus session completed! Outstanding focus! 🎉", "success")
    }
    return () => clearInterval(intervalId)
  }, [timerRunning, timeLeft])

  async function fetchDailyTasks() {
    if (!user) return
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/tasks/daily?userId=${user.id}&date=${todayStr}`)
      const json = await res.json()
      if (json.data) setDailyTasks(json.data)
    } catch (err) {
      console.error('Failed to load focus tasks:', err)
    }
  }

  async function fetchAccountabilityAlerts() {
    if (!user) return
    try {
      const res = await fetch(`/api/tasks/deferred?userId=${user.id}`)
      const json = await res.json()
      if (json.data) setAccountabilityAlerts(json.data)
    } catch (err) {
      console.error('Failed to load deferred alerts:', err)
    }
  }

  async function checkTodayReview() {
    if (!user) return
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/reviews/daily?userId=${user.id}&date=${todayStr}`)
      const json = await res.json()
      if (json.data && json.data.id) {
        setReviewSubmitted(true)
      }
    } catch (e) {
      console.error('Failed to check today review:', e)
    }
  }

  async function fetchVision() {
    if (!user) return
    try {
      const res = await fetch(`/api/memory?userId=${user.id}`)
      const json = await res.json()
      if (json.data && json.data.length > 0) {
        const visionMemory = json.data.find((m: any) => m.key === 'user.preferences.five_year_vision')
        if (visionMemory) {
          setFiveYearVision(visionMemory.value?.text || '')
        }
      }
    } catch (e) {
      console.error('Failed to load vision:', e)
    }
  }

  async function fetchGoals() {
    if (!user) return
    try {
      const res = await fetch(`/api/goals?userId=${user.id}`)
      const json = await res.json()
      if (json.data) setGoals(json.data)
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchTodaySchedule() {
    if (!user) return
    setLoadingSchedule(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'daily',
          date: todayStr,
        }),
      })
      const json = await res.json()
      if (json.data && json.data.blocks) {
        setTodaySchedule(json.data.blocks)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSchedule(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTodayCheckin(user.id)
      fetchDailyTasks()
      fetchAccountabilityAlerts()
      checkTodayReview()
      fetchVision()
      fetchGoals()
      fetchTodaySchedule()
    }
  }, [user, fetchTodayCheckin])

  async function handleSimplifyTask(taskId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/simplify`, { method: 'POST' })
      if (res.ok) {
        toast("Task simplified into 15m focus blocks! ⚡", "success")
        fetchDailyTasks()
        fetchAccountabilityAlerts()
      } else {
        toast("Failed to simplify task.", "error")
      }
    } catch (e) {
      console.error(e)
      toast("Failed to simplify task.", "error")
    }
  }

  async function handleDeferTaskNextWeek(taskId: string) {
    try {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const res = await fetch(`/api/tasks/${taskId}/defer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate: nextWeek.toISOString().split('T')[0] })
      })
      if (res.ok) {
        toast("Task deferred to next week. Let's take it slow! 🛋️", "success")
        fetchDailyTasks()
        fetchAccountabilityAlerts()
      } else {
        toast("Failed to defer task.", "error")
      }
    } catch (e) {
      console.error(e)
      toast("Failed to defer task.", "error")
    }
  }

  async function handleDismissAlert(taskId: string) {
    setAccountabilityAlerts((prev) => prev.filter((a) => a.id !== taskId))
    toast("Alert dismissed. Focus on consistent progress! 🌱", "success")
  }

  async function handleSaveReflection() {
    if (!user || reflectionScore === null) return
    setSubmittingReflection(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/reviews/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          date: todayStr,
          completed: reflectionText,
          blocked: '',
          productivity: reflectionScore
        })
      })
      if (res.ok) {
        toast("Reflection saved! AI memories updated. 🧠", "success")
        setReviewSubmitted(true)
        fetchDailyTasks()
      } else {
        toast("Failed to save reflection.", "error")
      }
    } catch (e) {
      console.error(e)
      toast("Failed to save reflection.", "error")
    } finally {
      setSubmittingReflection(false)
    }
  }

  async function handleSaveVision() {
    if (!user) return
    setSavingVision(true)
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          memoryType: 'preference',
          key: 'user.preferences.five_year_vision',
          value: { text: fiveYearVision },
          confidence: 1.0
        })
      })
      if (res.ok) {
        toast("Future vision saved! AI will align coaching to this. 🌟", "success")
      } else {
        toast("Failed to save vision.", "error")
      }
    } catch (e) {
      console.error(e)
      toast("Failed to save vision.", "error")
    } finally {
      setSavingVision(false)
    }
  }

  async function handlePersonalizationResponse(action: 'yes' | 'no' | 'later') {
    if (!user) return
    const currentQ = PERSONALIZATION_QUESTIONS[personalizationIndex]
    
    if (action === 'later') {
      toast("Snoozed personalization question.", "info")
      setPersonalizationIndex((prev) => prev + 1)
      return
    }

    setSavingMemory(true)
    try {
      const memoryValue = action === 'yes' ? currentQ.yesValue : currentQ.noValue
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          memoryType: 'preference',
          key: currentQ.key,
          value: memoryValue,
          confidence: 1.0
        })
      })

      if (res.ok) {
        toast(action === 'yes' ? "AI memory updated. Preference locked! 🔒" : "AI constraint updated. Preference skipped.", "success")
      } else {
        throw new Error('Failed to update')
      }
    } catch (e) {
      console.error(e)
      toast("Failed to update AI personalization memory.", "error")
    } finally {
      setSavingMemory(false)
      setPersonalizationIndex((prev) => prev + 1)
    }
  }

  const hasPersonalizationQuestions = personalizationIndex < PERSONALIZATION_QUESTIONS.length

  const mitTask = dailyTasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return (b.estimatedMinutes ?? 0) - (a.estimatedMinutes ?? 0)
    })[0]

  const totalWorkloadMinutes = dailyTasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0)
  const isWorkloadHigh = totalWorkloadMinutes > 480

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'focus':
        return 'bg-accent'
      case 'meeting':
        return 'bg-info'
      case 'task':
        return 'bg-warning'
      case 'break':
        return 'bg-bg-tertiary'
      default:
        return 'bg-domain-learning'
    }
  }

  // Stats Calculations
  const completedTasksCount = dailyTasks.filter(t => t.status === 'completed').length
  const totalTasksCount = dailyTasks.length

  const avgGoalsProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0

  const currentEnergy = todayCheckin?.energyMorning !== undefined ? `${todayCheckin.energyMorning}/10` : '—'
  const sleepInfo = todayCheckin?.sleepHours ? `${todayCheckin.sleepHours}h sleep` : 'Not logged today'

  // Dynamic balance insights based on actual tasks & check-ins
  const dynamicAIInsight = (() => {
    if (dailyTasks.length === 0) {
      return "Start by generating a daily plan or checking in. This unlocks custom Chief of Staff focus tracks."
    }
    const criticalCount = dailyTasks.filter(t => t.priority >= 4).length
    if (criticalCount > 2) {
      return `You have ${criticalCount} high-priority targets today. LifeOS recommends locking 50-minute deep study blocks to keep your cognitive momentum high.`
    }
    if (todayCheckin && todayCheckin.energyMorning <= 5) {
      return `Your morning energy is logged at ${todayCheckin.energyMorning}/10. We have configured recovery buffers: take short breaks to keep output consistent without fatigue.`
    }
    return "Your plan is highly balanced. Success is built on daily compounding blocks. Start your focus session now to lock in today's momentum!"
  })()

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {name}
          </h1>
          <p className="text-sm text-text-secondary">
            Your dynamic productivity hub for career acceleration and balanced growth.
          </p>
        </div>
        <div className="flex gap-2">
          {!reviewSubmitted && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowReflectionForce((prev) => !prev)} 
              className="border-accent text-text-primary hover:bg-accent hover:text-accent-text"
            >
              <Smile className="h-4 w-4 mr-1.5" />
              Daily Reflection
            </Button>
          )}
          <Link href="/ai">
            <Button size="sm" className="self-start">
              <Bot className="h-4 w-4" />
              AI Briefing
            </Button>
          </Link>
        </div>
      </div>

      {/* TODAY'S ACTIVE FOCUS HUB (TIMER PANEL) */}
      {mitTask && (
        <Card variant="raised" padding="md" className="border-accent relative overflow-hidden bg-surface dark:bg-bg-secondary shadow-neo-md">
          <div className="absolute top-0 right-0 p-3 bg-accent text-accent-text rounded-bl-sm text-[9px] font-extrabold uppercase tracking-widest">
            Today&apos;s Active Focus
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_260px] items-center">
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary">Next Up Target</span>
              <h2 className="text-xl font-bold text-text-primary">{mitTask.title}</h2>
              <p className="text-xs text-text-secondary leading-relaxed max-w-xl">
                {mitTask.priority >= 4 
                  ? "This task is critical for maintaining consistency. Accomplishing it today aligns directly with your active timeline targets."
                  : "Focusing on this block guarantees execution quality and builds compound momentum towards your active goal."}
              </p>
              
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => {
                    setTimeLeft(timerDuration)
                    setTimerRunning(true)
                    setTimerCompleted(false)
                    setShowTimer(true)
                  }}
                  className="bg-accent text-accent-text font-bold flex items-center gap-2 hover:bg-accent-hover"
                >
                  <Play className="h-4 w-4" />
                  Start Focus Session
                </Button>
                {mitTask.goal && (
                  <Badge variant="success" className="text-[10px] py-1 border border-success/35">
                    🎯 Goal: {mitTask.goal.title}
                  </Badge>
                )}
                <span className="text-xs text-text-tertiary font-mono">
                  {mitTask.estimatedMinutes ? `Est: ${mitTask.estimatedMinutes}m` : 'No estimate'}
                </span>
              </div>
            </div>

            {/* In-Line Beautiful Pomodoro Widget */}
            {showTimer && (
              <div className="border-2 border-border p-4 bg-bg rounded-sm space-y-3 relative animate-scale-in">
                <button 
                  onClick={() => setShowTimer(false)}
                  className="absolute top-2 right-2 text-text-secondary hover:text-text-primary"
                  aria-label="Close timer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {timerCompleted ? (
                  <div className="text-center space-y-2 py-2">
                    <Sparkles className="h-8 w-8 text-success mx-auto animate-bounce" />
                    <h4 className="text-xs font-bold uppercase text-success">Time&apos;s Up!</h4>
                    <p className="text-[10px] text-text-secondary leading-tight">Focus session complete. Complete task now?</p>
                    <Button
                      size="sm"
                      className="bg-success text-white font-bold w-full text-[10px] py-1"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/tasks/${mitTask.id}/complete`, { method: 'POST' })
                          if (res.ok) {
                            toast("Task completed! You are crushing your goals! 🚀", "success")
                            fetchDailyTasks()
                            setShowTimer(false)
                            setTimerCompleted(false)
                          }
                        } catch (e) {
                          console.error(e)
                        }
                      }}
                    >
                      Complete Task
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-mono font-bold tracking-wider text-text-primary">
                      {Math.floor(timeLeft / 60)}:{((timeLeft % 60).toString().padStart(2, '0'))}
                    </div>

                    <div className="h-1.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${((timerDuration - timeLeft) / timerDuration) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setTimerRunning(!timerRunning)}
                        className="p-1.5 border-2 border-border rounded-sm hover:bg-bg-secondary"
                        aria-label={timerRunning ? "Pause" : "Play"}
                      >
                        {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => {
                          setTimeLeft(timerDuration)
                          setTimerRunning(false)
                        }}
                        className="p-1.5 border-2 border-border rounded-sm hover:bg-bg-secondary"
                        aria-label="Reset"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex gap-1 justify-center">
                      {[1500, 3000, 5400].map((d) => (
                        <button
                          key={d}
                          onClick={() => {
                            setTimerDuration(d)
                            setTimeLeft(d)
                            setTimerRunning(false)
                          }}
                          className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 border rounded-sm",
                            timerDuration === d ? "bg-accent text-accent-text border-accent" : "border-border hover:bg-bg-secondary text-text-secondary"
                          )}
                        >
                          {d === 1500 ? '25m' : d === 3000 ? '50m' : '90m'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Burnout & Workload Safety Valve */}
      {isWorkloadHigh && (
        <Card variant="highlighted" padding="md" className="border-error bg-error-bg/10 relative animate-fade-in">
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-error/10 rounded-sm border-2 border-error text-error mt-0.5 shrink-0">
              <AlertCircle className="h-5 w-5 animate-pulse" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-error">Burnout Protection Warning</span>
                <p className="text-sm font-semibold mt-1 text-text-primary">
                  You have scheduled {Math.round(totalWorkloadMinutes / 60)} hours of focus tasks today. Overworking is a leading cause of fatigue and inconsistent performance.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/plans/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user?.id, type: 'daily', optimizeType: 'low_energy' })
                      })
                      if (res.ok) {
                        toast("Burnout Protection Active! Non-critical tasks deferred. 🛌", "success")
                        fetchDailyTasks()
                      }
                    } catch (e) {
                      console.error(e)
                    }
                  }}
                  className="bg-error text-white hover:bg-error-hover font-bold px-3 py-1 text-xs"
                >
                  Activate Recovery Mode (Defer Tasks)
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Daily Reflection Engine Card */}
      {((new Date().getHours() >= 17 && !reviewSubmitted) || showReflectionForce) && !reviewSubmitted && (
        <Card variant="ai" padding="md" className="relative animate-fade-in border-accent bg-accent-light/10">
          <button
            onClick={() => setShowReflectionForce(false)}
            className="absolute top-3 right-3 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smile className="h-5 w-5 text-text-primary animate-bounce" />
              <h2 className="text-base font-bold text-text-primary">How did today go?</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: '😊 Great', score: 9 },
                { label: '🙂 Good', score: 7 },
                { label: '😐 Okay', score: 5 },
                { label: '😞 Difficult', score: 3 },
                { label: '😩 Exhausting', score: 2 }
              ].map((opt) => (
                <button
                  key={opt.score}
                  onClick={() => setReflectionScore(opt.score)}
                  className={cn(
                    "px-3 py-1.5 rounded-sm border-2 font-bold text-xs transition-all cursor-pointer",
                    reflectionScore === opt.score
                      ? "border-accent bg-accent text-accent-text"
                      : "border-border bg-surface hover:bg-bg-secondary text-text-secondary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {reflectionScore !== null && (
              <div className="space-y-3 animate-fade-in">
                <div>
                  <label className="text-xs font-bold text-text-secondary mb-1 block">
                    {reflectionScore >= 7
                      ? "Excellent! What was your major win or positive takeaway today?"
                      : "I understand. What was the main blocker or challenge today?"}
                  </label>
                  <textarea
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="Type a brief note here (optional)..."
                    className="w-full text-sm p-3 border-2 border-border rounded-sm bg-surface text-text-primary focus:border-accent outline-none"
                    rows={2}
                  />
                </div>

                <Button
                  size="sm"
                  onClick={handleSaveReflection}
                  disabled={submittingReflection}
                  className="bg-accent text-accent-text font-bold"
                >
                  {submittingReflection ? "Saving Reflection..." : "Save Daily Reflection"}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Progressive AI Personalization Widget */}
      {hasPersonalizationQuestions && !personalizationDismissed && (
        <Card variant="ai" padding="md" className="relative animate-fade-in bg-accent-light/20 border-dashed border-accent">
          <button
            onClick={() => setPersonalizationDismissed(true)}
            className="absolute top-3 right-3 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex gap-3 items-start pr-6">
            <div className="p-2 bg-accent/10 rounded-sm border-2 border-accent text-text-primary mt-0.5">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary">Chief of Staff Personalization</span>
                <p className="text-sm font-semibold mt-1 text-text-primary leading-relaxed">
                  {PERSONALIZATION_QUESTIONS[personalizationIndex].question}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handlePersonalizationResponse('yes')}
                  disabled={savingMemory}
                  className="bg-accent text-accent-text hover:bg-accent-hover font-bold px-4"
                >
                  Yes
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handlePersonalizationResponse('no')}
                  disabled={savingMemory}
                  className="font-bold px-4 border-2"
                >
                  No
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handlePersonalizationResponse('later')}
                  disabled={savingMemory}
                  className="text-text-secondary hover:text-text-primary font-bold"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Positive Accountability Alert */}
      {accountabilityAlerts.length > 0 && (
        <Card variant="highlighted" padding="md" className="border-warning bg-warning-bg/10 relative animate-fade-in">
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-warning/10 rounded-sm border-2 border-warning text-warning mt-0.5">
              <AlertCircle className="h-5 w-5 animate-pulse" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-warning">Positive Accountability</span>
                <p className="text-sm font-semibold mt-1 text-text-primary leading-relaxed">
                  I noticed you&apos;ve postponed <strong className="underline">&quot;{accountabilityAlerts[0].title}&quot;</strong> {accountabilityAlerts[0].metadata?.deferCount || 3} times this week. Is the plan too ambitious, or is something getting in the way? Let&apos;s adjust it together.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleSimplifyTask(accountabilityAlerts[0].id)}
                  className="bg-warning text-white hover:bg-warning-hover font-bold px-3 py-1"
                >
                  Simplify Task (15m Blocks)
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDeferTaskNextWeek(accountabilityAlerts[0].id)}
                  className="font-bold px-3 py-1 border-2 text-xs"
                >
                  Shift to Next Week
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleDismissAlert(accountabilityAlerts[0].id)}
                  className="text-text-secondary hover:text-text-primary font-bold text-xs"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Today's Focus List */}
      <Card variant="highlighted" padding="md">
        <div className="flex items-center gap-2 mb-3">
          <ListTodo className="h-4 w-4 text-text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">Today&apos;s Focus Tasks</h2>
        </div>
        <div className="space-y-2">
          {dailyTasks.length > 0 ? (
            dailyTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-sm border-2 border-border bg-bg p-3 animate-fade-in">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/tasks/${task.id}/complete`, { method: 'POST' })
                      if (res.ok) {
                        toast("Task completed! Excellent progress! 🎉", "success")
                        fetchDailyTasks()
                      }
                    } catch (e) {
                      console.error(e)
                    }
                  }} 
                  className="flex h-5 w-5 items-center justify-center rounded-sm border-2 border-border bg-surface hover:bg-success-bg hover:border-success transition-all cursor-pointer"
                >
                  {task.status === 'completed' && <Check className="h-3 w-3 text-success" />}
                </button>
                <div className="flex-1">
                  <p className={cn("text-sm font-semibold", task.status === 'completed' && "line-through text-text-tertiary")}>{task.title}</p>
                  <p className="text-xs text-text-tertiary">
                    {task.estimatedMinutes ? `${task.estimatedMinutes}m estimate` : 'No estimate'} · {task.source === 'ai_generated' ? 'AI Planned' : 'Manual'}
                  </p>
                </div>
                {task.priority >= 4 && <Badge variant="primary" className="text-[10px]">Priority</Badge>}
              </div>
            ))
          ) : (
            <div className="text-center py-6 bg-bg-secondary border-2 border-dashed border-border rounded-sm">
              <p className="text-xs text-text-secondary font-semibold">No focus tasks scheduled for today.</p>
              <Link href="/plan" className="text-xs font-bold text-text-secondary uppercase hover:underline mt-1.5 inline-block">
                Configure your plan →
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" className="space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <ListTodo className="h-4 w-4" />
            <span className="neo-label">Tasks Today</span>
          </div>
          <p className="text-2xl font-bold">
            {completedTasksCount} <span className="text-sm font-normal text-text-tertiary">/ {totalTasksCount} done</span>
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-sm bg-bg-tertiary">
            <div 
              className="h-full rounded-sm bg-accent neo-transition" 
              style={{ width: `${(completedTasksCount / (totalTasksCount || 1)) * 100}%` }}
            />
          </div>
        </Card>

        <Card padding="md" className="space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <TrendingUp className="h-4 w-4" />
            <span className="neo-label">Goals Progress</span>
          </div>
          <p className="text-2xl font-bold">
            {avgGoalsProgress}<span className="text-sm font-normal text-text-tertiary">%</span>
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-sm bg-bg-tertiary">
            <div 
              className="h-full rounded-sm bg-success neo-transition" 
              style={{ width: `${avgGoalsProgress}%` }}
            />
          </div>
        </Card>

        <Card padding="md" className="space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <Brain className="h-4 w-4" />
            <span className="neo-label">Active Goals</span>
          </div>
          <p className="text-2xl font-bold">
            {goals.filter(g => g.status === 'active').length} <span className="text-sm font-normal text-text-tertiary">active</span>
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-sm bg-bg-tertiary">
            <div 
              className="h-full rounded-sm bg-accent neo-transition" 
              style={{ width: `${(goals.filter(g => g.status === 'active').length / Math.max(goals.length, 1)) * 100}%` }}
            />
          </div>
        </Card>

        <Card padding="md" className="space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar className="h-4 w-4" />
            <span className="neo-label">Energy Level</span>
          </div>
          <p className="text-2xl font-bold text-warning">{currentEnergy}</p>
          <p className="text-xs text-text-tertiary truncate">{sleepInfo}</p>
        </Card>
      </div>

      {/* Future Self & AI Progress Predictions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Progress Predictions */}
        <Card variant="raised" padding="md" className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">AI Progress Predictions</h2>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Based on your task completion velocity, daily routine commitments, and consistency:
          </p>
          <div className="space-y-3 mt-2">
            {goals.slice(0, 3).map((g, idx) => (
              <div key={g.id}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="truncate max-w-[200px]">{g.title}</span>
                  <span className="text-text-primary">{Math.round(g.progress || 0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      idx === 0 && 'bg-accent',
                      idx === 1 && 'bg-info',
                      idx === 2 && 'bg-success'
                    )}
                    style={{ width: `${Math.round(g.progress || 0)}%` }}
                  />
                </div>
              </div>
            ))}
            {goals.length === 0 && (
              <p className="text-xs text-text-tertiary italic">No active goals set up yet.</p>
            )}
          </div>
        </Card>

        {/* Future Self Vision Box */}
        <Card variant="ai" padding="md" className="space-y-4 border-dashed border-accent">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">5-Year Future Self Vision</h2>
          </div>
          
          <textarea
            value={fiveYearVision}
            onChange={(e) => setFiveYearVision(e.target.value)}
            placeholder="Describe your ideal life in 5 years. (e.g. 'I want to be financially independent, leading a healthy lifestyle, and coding premium software...')"
            className="w-full text-xs p-2.5 border-2 border-border rounded-sm bg-surface text-text-primary outline-none focus:border-accent resize-none h-[110px]"
          />
          
          <Button
            size="sm"
            onClick={handleSaveVision}
            disabled={savingVision}
            className="bg-accent text-accent-text font-bold"
          >
            {savingVision ? "Saving Vision..." : "Update Vision Statement"}
          </Button>
        </Card>
      </div>

      {/* Schedule + AI Insight */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-text-secondary" />
              <h2 className="neo-label">Today&apos;s Schedule</h2>
            </div>
            <Link href="/plan" className="text-xs font-semibold text-text-secondary hover:underline">View all</Link>
          </div>
          <div className="space-y-1">
            {loadingSchedule ? (
              <span className="text-xs text-text-tertiary animate-pulse block py-4 text-center">Loading schedule...</span>
            ) : todaySchedule.length > 0 ? (
              todaySchedule.slice(0, 6).map((item, idx) => {
                const timeStr = (() => {
                  try {
                    return format(new Date(item.startTime), 'HH:mm')
                  } catch {
                    return '--:--'
                  }
                })()
                return (
                  <div key={idx} className="flex items-start gap-3 rounded-sm p-2 hover:bg-bg-secondary">
                    <span className="w-12 text-xs font-mono font-bold text-text-secondary mt-0.5">{timeStr}</span>
                    <div className={cn('h-2 w-2 rounded-sm mt-1.5 shrink-0', getBlockColor(item.type))} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold truncate block text-text-primary">{item.activity}</span>
                      {item.reason && (
                        <p className="text-[11px] text-accent font-medium leading-relaxed mt-0.5 italic">
                          💡 {item.reason}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-text-tertiary italic py-4 text-center">No schedule blocks generated yet.</p>
            )}
          </div>
        </Card>

        <Card padding="md" variant="ai" className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-text-primary" />
            <h2 className="neo-label text-text-primary">AI Insight</h2>
          </div>
          <div className="rounded-sm border-2 border-dashed border-accent bg-accent-light p-4 dark:bg-accent/10">
            <p className="text-sm leading-relaxed text-text-primary font-medium">
              {dynamicAIInsight}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/plan">
              <Button size="sm" variant="primary">
                <Sparkles className="h-3 w-3 mr-1" />
                Customize Plan
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Check-in CTA */}
      <Card padding="md" className={cn('space-y-3', todayCheckin ? '' : 'variant-highlighted')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-text-primary" />
            <h2 className="neo-label">{todayCheckin ? 'Today\'s Check-In' : 'Daily Check-In'}</h2>
          </div>
          <Link href="/check-in">
            <Button size="sm" variant={todayCheckin ? 'ghost' : 'primary'}>
              {todayCheckin ? 'Edit' : 'Check In Now'}
              {!todayCheckin && <Sparkles className="h-3 w-3" />}
            </Button>
          </Link>
        </div>
        {todayCheckin ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-sm border-2 border-border bg-surface p-2 text-center">
              <p className="text-[10px] font-bold uppercase text-text-tertiary">Mood</p>
              <p className="text-lg font-bold">{todayCheckin.mood}/5</p>
            </div>
            <div className="rounded-sm border-2 border-border bg-surface p-2 text-center">
              <p className="text-[10px] font-bold uppercase text-text-tertiary">Energy</p>
              <p className="text-lg font-bold">{todayCheckin.energyMorning}/10</p>
            </div>
            <div className="rounded-sm border-2 border-border bg-surface p-2 text-center">
              <p className="text-[10px] font-bold uppercase text-text-tertiary">Sleep</p>
              <p className="text-lg font-bold">{todayCheckin.sleepHours ? `${todayCheckin.sleepHours}h` : '—'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Start your day with a quick check-in to log your mood, energy, and focus.</p>
        )}
      </Card>
    </div>
  )
}
