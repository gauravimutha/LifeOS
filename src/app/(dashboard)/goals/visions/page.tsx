'use client'

import { useState, useEffect } from 'react'
import { Card, Button } from '@/components/ui'
import { Eye, Plus } from 'lucide-react'
import Link from 'next/link'
import { VisionCard } from '@/components/domain/goals/VisionCard'
import { useAuthStore } from '@/stores/authStore'
import type { Goal } from '@/types/goal'

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

export default function VisionsPage() {
  const user = useAuthStore((s) => s.user)
  const [visions, setVisions] = useState<Goal[]>([])
  const [allGoals, setAllGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadVisions()
    }
  }, [user])

  async function loadVisions() {
    if (!user) return
    try {
      const res = await fetch(`/api/goals?userId=${user.id}`)
      const json = await res.json()
      if (json.data) {
        const serialized = json.data.map(serializeGoalClient)
        setAllGoals(serialized)
        setVisions(serialized.filter((g: any) => g.level === 'vision' && g.status !== 'archived'))
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visions</h1>
          <p className="text-sm text-text-secondary">
            Your life visions — the highest level of your goal hierarchy
          </p>
        </div>
        <Link href="/goals/new?level=vision">
          <Button>
            <Plus className="h-4 w-4" />
            New Vision
          </Button>
        </Link>
      </div>

      {loading ? (
        <Card padding="lg">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        </Card>
      ) : visions.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Eye className="mb-4 h-12 w-12 text-text-tertiary" />
            <h2 className="text-lg font-semibold mb-1">No visions yet</h2>
            <p className="text-sm text-text-secondary mb-4">
              A vision defines your long-term direction. Start here.
            </p>
            <Link href="/goals/new?level=vision">
              <Button>
                <Plus className="h-4 w-4" />
                Create Your Vision
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visions.map((vision) => {
            const longTermGoals = allGoals.filter(
              (g) => g.parentGoalId === vision.id && g.level === 'long-term'
            )
            return (
              <VisionCard
                key={vision.id}
                vision={vision}
                longTermGoals={longTermGoals}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
