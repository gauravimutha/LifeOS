import { useQuery } from '@tanstack/react-query'
import { usePlanStore, type TimeBlock } from '@/stores/plan.store'

async function fetchDailyPlan(date: string): Promise<{ timeBlocks: TimeBlock[] }> {
  const res = await fetch(`/api/plan/daily?date=${date}`)
  if (!res.ok) throw new Error('Failed to fetch daily plan')
  return res.json()
}

async function fetchWeeklyPlan(startDate: string): Promise<Record<string, TimeBlock[]>> {
  const res = await fetch(`/api/plan/weekly?startDate=${startDate}`)
  if (!res.ok) throw new Error('Failed to fetch weekly plan')
  return res.json()
}

export function useDailyPlan(date?: string) {
  const storeDate = usePlanStore((s) => s.currentDate)
  const effectiveDate = date ?? storeDate
  const setDailyPlan = usePlanStore((s) => s.setDailyPlan)

  return useQuery({
    queryKey: ['plan', 'daily', effectiveDate],
    queryFn: async () => {
      const data = await fetchDailyPlan(effectiveDate)
      setDailyPlan({ date: effectiveDate, timeBlocks: data.timeBlocks })
      return data
    },
    enabled: !!effectiveDate,
  })
}

export function useWeeklyPlan(startDate?: string) {
  const setWeeklyPlan = usePlanStore((s) => s.setWeeklyPlan)

  return useQuery({
    queryKey: ['plan', 'weekly', startDate],
    queryFn: async () => {
      const data = await fetchWeeklyPlan(startDate ?? '')
      Object.entries(data).forEach(([date, blocks]) => {
        setWeeklyPlan(date, blocks)
      })
      return data
    },
    enabled: !!startDate,
  })
}
