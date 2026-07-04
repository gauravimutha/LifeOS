'use client'

import { useState, useEffect } from 'react'
import { Card, Button } from '@/components/ui'
import { Target, Plus, Eye } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { GoalTree } from '@/components/domain/goals/GoalTree'
import { VisionCard } from '@/components/domain/goals/VisionCard'
import { useGoalStore } from '@/stores/goalStore'
import { useAuthStore } from '@/stores/authStore'
import { buildGoalTree, computeStats } from '@/engine'
import type { GoalStatus } from '@/types/goal'

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

export default function GoalsPage() {
  const user = useAuthStore((s) => s.user)
  const {
    goalTree, setGoalTree,
    stats, setStats,
    goals, setGoals,
    isLoading, setLoading,
    error, setError,
  } = useGoalStore()

  const [view, setView] = useState<'tree' | 'visions'>('tree')

  useEffect(() => {
    if (user) {
      loadGoals()
    }
  }, [user])

  async function loadGoals() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/goals?userId=${user.id}`)
      const json = await res.json()
      if (json.data) {
        const serialized = json.data.map(serializeGoalClient)
        setGoals(serialized)
        setGoalTree(buildGoalTree(serialized))
        setStats(computeStats(serialized))
      } else {
        setError('Failed to load goals')
      }
    } catch {
      setError('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: string, newStatus: GoalStatus) {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus.toUpperCase() }),
      })
      if (res.ok) {
        loadGoals()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const visions = goals.filter((g) => g.level === 'vision' && g.status !== 'cancelled' && g.status !== 'archived')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-sm text-text-secondary">
            Your goal hierarchy from vision to weekly actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView(view === 'tree' ? 'visions' : 'tree')}
          >
            {view === 'tree' ? <Eye className="h-4 w-4" /> : <Target className="h-4 w-4" />}
            {view === 'tree' ? 'Visions' : 'Hierarchy'}
          </Button>
          <Link href="/goals/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Active" value={stats.active} variant="primary" />
          <StatCard label="Completed" value={stats.completed} variant="success" />
          <StatCard label="Paused" value={stats.paused} variant="warning" />
          <StatCard label="Overdue" value={stats.overdueCount} variant={stats.overdueCount > 0 ? 'error' : 'default'} />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card padding="lg">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card variant="highlighted" padding="md">
          <p className="text-error font-semibold">{error}</p>
          <Button variant="ghost" size="sm" onClick={loadGoals} className="mt-2">
            Retry
          </Button>
        </Card>
      )}

      {/* Vision View */}
      {!isLoading && view === 'visions' && (
        <div className="space-y-4">
          {visions.length === 0 ? (
            <Card padding="lg">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Eye className="mb-3 h-10 w-10 text-text-tertiary" />
                <h2 className="text-lg font-semibold mb-1">No visions yet</h2>
                <p className="text-sm text-text-secondary mb-4">
                  Start by creating a vision for your life
                </p>
                <Link href="/goals/new">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Create Vision
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visions.map((vision) => {
                const longTermGoals = goals.filter(
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
      )}

      {/* Tree View */}
      {!isLoading && view === 'tree' && (
        <div>
          {goalTree.length === 0 ? (
            <Card padding="lg">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="mb-4 h-12 w-12 text-text-tertiary" />
                <h2 className="text-lg font-semibold mb-1">No goals yet</h2>
                <p className="text-sm text-text-secondary mb-4">
                  Set your first goal and LifeOS will help you break it down.
                </p>
                <Link href="/goals/new">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Create Your First Goal
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <GoalTree
              nodes={goalTree}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, variant }: { label: string; value: number; variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' }) {
  const colors = {
    default: 'text-text-primary',
    primary: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
  }

  return (
    <Card padding="sm" className="text-center">
      <p className={cn('text-xl font-bold', colors[variant ?? 'default'])}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">{label}</p>
    </Card>
  )
}
