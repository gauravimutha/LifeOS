import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Habit {
  id: string
  title: string
  description?: string
  streak: number
  longestStreak: number
  completedToday: boolean
  weeklyProgress: number[]
  createdAt: string
}

const HABITS_KEY = ['habits'] as const

async function fetchHabits(): Promise<Habit[]> {
  const res = await fetch('/api/habits')
  if (!res.ok) throw new Error('Failed to fetch habits')
  return res.json()
}

async function logHabit(id: string, date: string): Promise<void> {
  const res = await fetch(`/api/habits/${id}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date }),
  })
  if (!res.ok) throw new Error('Failed to log habit')
}

async function fetchStreak(id: string): Promise<{ current: number; longest: number }> {
  const res = await fetch(`/api/habits/${id}/streak`)
  if (!res.ok) throw new Error('Failed to fetch streak')
  return res.json()
}

export function useHabits() {
  return useQuery({
    queryKey: HABITS_KEY,
    queryFn: fetchHabits,
  })
}

export function useLogHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => logHabit(id, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}

export function useStreak(id: string) {
  return useQuery({
    queryKey: [...HABITS_KEY, id, 'streak'],
    queryFn: () => fetchStreak(id),
    enabled: !!id,
  })
}
