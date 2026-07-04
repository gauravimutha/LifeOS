import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface HealthData {
  id: string
  date: string
  sleepHours: number
  energyLevel: number
  moodLevel: number
  stressLevel?: number
  exerciseMinutes?: number
  waterCups?: number
  notes?: string
}

interface HealthSummary {
  avgSleep: number
  avgEnergy: number
  avgMood: number
  currentStreak: number
  logsThisWeek: number
}

const HEALTH_KEY = ['health'] as const

async function fetchHealthData(): Promise<HealthData[]> {
  const res = await fetch('/api/health')
  if (!res.ok) throw new Error('Failed to fetch health data')
  return res.json()
}

async function fetchHealthSummary(): Promise<HealthSummary> {
  const res = await fetch('/api/health/summary')
  if (!res.ok) throw new Error('Failed to fetch health summary')
  return res.json()
}

export function useHealthData() {
  return useQuery({
    queryKey: HEALTH_KEY,
    queryFn: fetchHealthData,
  })
}

export function useHealthSummary() {
  return useQuery({
    queryKey: [...HEALTH_KEY, 'summary'],
    queryFn: fetchHealthSummary,
  })
}

export function useLogHealth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<HealthData, 'id'>) => {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to log health data')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HEALTH_KEY })
    },
  })
}
