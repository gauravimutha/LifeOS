# Data Schema

All data is stored in the browser's localStorage via Zustand's persist middleware. There is no server-side database.

## Task

```typescript
interface Task {
  id: string
  title: string
  description: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'pending' | 'completed'
  category: TaskCategory
  deadline: string | null          // ISO date
  estimatedDuration: number        // minutes
  goalId: string | null            // links to Goal.id
  createdAt: string                // ISO timestamp
  completedAt: string | null       // ISO timestamp
}
```

## Goal

```typescript
interface GoalMilestone {
  title: string
  completed: boolean
}

interface Goal {
  id: string
  title: string
  description: string
  whyItMatters: string
  parentId: string | null
  level: 'vision' | 'long-term' | 'yearly' | 'quarterly' | 'monthly' | 'weekly'
  priority: 'low' | 'medium' | 'high' | 'critical'
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard'
  estimatedDuration: string
  category: GoalCategory
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  targetDate: string | null
  progress: number                  // 0-100
  successMetrics: string
  milestones: GoalMilestone[]
  dependencies: string[]
  skillsRequired: string[]
  resources: string[]
  roadmap: string[]
  weeklyCommitment: number          // hours per week
  createdAt: string
  completedAt: string | null
}
```

## DailyReview

```typescript
interface DailyReview {
  date: string                      // "YYYY-MM-DD"
  completed: string
  blocked: string
  productivity: number              // 1-10
  createdAt: string
}
```

## PeriodReview

```typescript
interface PeriodReviewStats {
  tasksCompleted: number
  tasksCreated: number
  avgMood: number | null
  avgEnergy: number | null
  avgSleep: number | null
  avgProductivity: number | null
  goalsAdvanced: number
  streaks: { current: number; longest: number }
}

interface PeriodReview {
  id: string
  type: 'weekly' | 'monthly'
  periodKey: string                 // "2026-W27" or "2026-07"
  startDate: string
  endDate: string
  stats: PeriodReviewStats
  aiSummary: string
  highlights: string[]
  challenges: string[]
  focusForNext: string
  createdAt: string
}
```

## DailyCheckin

```typescript
interface DailyCheckin {
  date: string                      // "YYYY-MM-DD"
  mood: number                      // 1-10
  energyMorning: number             // 1-10
  sleepHours: number
  focusToday: string
  obstacles: string
  gratitude: string
  yesterdayAccomplished: string
  completedAt: string
}
```

## RoutineBlock

```typescript
interface RoutineBlock {
  id: string
  dayOfWeek: number                // 0=Sunday
  startTime: string                // "HH:MM"
  endTime: string                  // "HH:MM"
  label: string
  category: RoutineCategory
  isProtected: boolean
}
```

## Store Keys & Versions

| Store | localStorage Key | Current Version |
|-------|-----------------|-----------------|
| Tasks | `arihant-os-tasks` | 1 |
| Goals | `arihant-os-goals` | 2 |
| Reviews | `arihant-os-reviews` | 2 |
| Routine | `arihant-os-routine` | 1 |
| Check-in | `arihant-os-checkin` | 1 |
