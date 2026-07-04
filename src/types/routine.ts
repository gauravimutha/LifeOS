export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const DEFAULT_ROUTINE_CATEGORIES = [
  'Work',
  'Personal',
  'Health',
  'Learning',
  'Sleep',
  'Commute',
  'Other',
]

export type RoutineCategory = string

export interface RoutineBlock {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  label: string
  category: RoutineCategory
  isProtected: boolean
}

export const DEFAULT_LIFE_MODES = [
  { id: 'normal', label: 'Normal', icon: 'Sun' },
  { id: 'focus', label: 'Focus', icon: 'GraduationCap' },
  { id: 'startup', label: 'Startup', icon: 'Rocket' },
  { id: 'vacation', label: 'Vacation', icon: 'Umbrella' },
  { id: 'recovery', label: 'Recovery', icon: 'Heart' },
]

export type LifeModeId = string
