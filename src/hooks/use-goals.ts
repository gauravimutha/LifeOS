import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Goal, CreateGoalInput, GoalTreeNode, GoalStats } from '@/types/goal'

const GOALS_KEY = ['goals'] as const

async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch('/api/goals')
  if (!res.ok) throw new Error('Failed to fetch goals')
  return res.json()
}

async function fetchGoal(id: string): Promise<Goal> {
  const res = await fetch(`/api/goals/${id}`)
  if (!res.ok) throw new Error('Failed to fetch goal')
  return res.json()
}

async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const res = await fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to create goal')
  return res.json()
}

async function updateGoal(id: string, input: Partial<CreateGoalInput>): Promise<Goal> {
  const res = await fetch(`/api/goals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to update goal')
  return res.json()
}

async function deleteGoal(id: string): Promise<void> {
  const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete goal')
}

async function fetchGoalTree(): Promise<GoalTreeNode[]> {
  const res = await fetch('/api/goals/tree')
  if (!res.ok) throw new Error('Failed to fetch goal tree')
  return res.json()
}

export function useGoals() {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: fetchGoals,
  })
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: [...GOALS_KEY, id],
    queryFn: () => fetchGoal(id),
    enabled: !!id,
  })
}

export function useGoalTree() {
  return useQuery({
    queryKey: [...GOALS_KEY, 'tree'],
    queryFn: fetchGoalTree,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_KEY })
    },
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<CreateGoalInput>) =>
      updateGoal(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_KEY })
    },
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_KEY })
    },
  })
}

export function useGoalStats() {
  return useQuery({
    queryKey: [...GOALS_KEY, 'stats'],
    queryFn: async (): Promise<GoalStats> => {
      const res = await fetch('/api/goals/stats')
      if (!res.ok) throw new Error('Failed to fetch goal stats')
      return res.json()
    },
  })
}
