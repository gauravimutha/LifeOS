export interface DailyReview {
  date: string
  completed: string
  blocked: string
  productivity: number
  createdAt: string
}

export interface PeriodReviewStats {
  tasksCompleted: number
  tasksCreated: number
  avgMood: number | null
  avgEnergy: number | null
  avgSleep: number | null
  avgProductivity: number | null
  goalsAdvanced: number
  streaks: { current: number; longest: number }
}

export interface PeriodReview {
  id: string
  type: 'weekly' | 'monthly'
  periodKey: string
  startDate: string
  endDate: string
  stats: PeriodReviewStats
  aiSummary: string
  highlights: string[]
  challenges: string[]
  focusForNext: string
  createdAt: string
}
