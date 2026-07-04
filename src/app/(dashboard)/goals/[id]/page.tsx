'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui'
import { GoalDetail } from '@/components/domain/goals/GoalDetail'
import { useGoalStore } from '@/stores/goalStore'
import { useAuthStore } from '@/stores/authStore'
import type { Goal, GoalAIAnalysis, GoalStatus } from '@/types/goal'

const PRISMA_TO_LEVEL = {
  vision: 'vision',
  long_term: 'long-term',
  yearly: 'yearly',
  quarterly: 'quarterly',
  monthly: 'monthly',
  weekly: 'weekly',
} as const

function serializeGoalClient(g: any): any {
  return {
    ...g,
    level: PRISMA_TO_LEVEL[g.level as keyof typeof PRISMA_TO_LEVEL] ?? 'long-term',
    status: g.status.toLowerCase(),
  }
}

export default function GoalDetailPage() {
  const params = useParams()
  const id = params.id as string
  const user = useAuthStore((s) => s.user)
  const updateGoal = useGoalStore((s) => s.updateGoal)

  const [goal, setGoal] = useState<Goal | null>(null)
  const [analysis, setAnalysis] = useState<GoalAIAnalysis | null>(null)
  const [children, setChildren] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && id) {
      loadGoal()
    }
  }, [user, id])

  async function loadGoal() {
    if (!id || !user) return
    setLoading(true)
    setError(null)

    try {
      const [goalRes, allGoalsRes] = await Promise.all([
        fetch(`/api/goals/${id}`),
        fetch(`/api/goals?userId=${user.id}`),
      ])
      const goalJson = await goalRes.json()
      const allGoalsJson = await allGoalsRes.json()

      if (!goalJson.data) {
        setError('Goal not found')
        return
      }

      const serializedGoal = serializeGoalClient(goalJson.data)
      const serializedAllGoals = (allGoalsJson.data || []).map(serializeGoalClient)

      setGoal(serializedGoal)
      setChildren(serializedAllGoals.filter((g: any) => g.parentGoalId === id))
      setAnalysis(serializedGoal.metadata?.aiAnalysis ?? null)
    } catch {
      setError('Failed to load goal')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(goalId: string, newStatus: GoalStatus) {
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus.toUpperCase() }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          const serialized = serializeGoalClient(json.data)
          setGoal(serialized)
          updateGoal(goalId, serialized)
          loadGoal()
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </Card>
    )
  }

  if (error || !goal) {
    return (
      <Card padding="lg" variant="highlighted">
        <p className="text-error font-semibold">{error ?? 'Goal not found'}</p>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <GoalDetail
        goal={goal}
        analysis={analysis}
        children={children}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
