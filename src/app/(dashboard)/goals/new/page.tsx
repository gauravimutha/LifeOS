'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { GoalForm } from '@/components/domain/goals/GoalForm'
import { useAuthStore } from '@/stores/authStore'
import { useGoalStore } from '@/stores/goalStore'
import type { CreateGoalInput } from '@/types/goal'

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

function NewGoalContent() {
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const addGoal = useGoalStore((s) => s.addGoal)
  const parentGoalId = searchParams.get('parent') ?? undefined

  async function handleSubmit(input: CreateGoalInput) {
    if (!user) return { goal: null, error: 'Not authenticated' }

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          userId: user.id,
        }),
      })
      const json = await res.json()
      if (json.data) {
        const serialized = serializeGoalClient(json.data)
        addGoal(serialized)
        return { goal: serialized, analysis: serialized.metadata?.aiAnalysis ?? null, error: null }
      } else {
        return { goal: null, error: json.error?.message || 'Failed to create goal' }
      }
    } catch (err) {
      return { goal: null, error: 'Failed to create goal' }
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <GoalForm onSubmit={handleSubmit} parentGoalId={parentGoalId} />
    </div>
  )
}

export default function NewGoalPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto"><div className="h-96 animate-pulse bg-bg-tertiary rounded-sm" /></div>}>
      <NewGoalContent />
    </Suspense>
  )
}
