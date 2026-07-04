export const DEFAULT_TASK_CATEGORIES = [
  'Work',
  'Personal',
  'Health',
  'Learning',
  'Admin',
]

export type TaskCategory = string

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export type TaskPriority = (typeof PRIORITIES)[number]

export const STATUSES = ['pending', 'in-progress', 'completed'] as const

export type TaskStatus = (typeof STATUSES)[number]

export interface Task {
  id: string
  title: string
  description: string
  goalId: string | null
  category: TaskCategory
  priority: TaskPriority
  deadline: string | null
  estimatedDuration: number
  status: TaskStatus
  notes: string
  createdAt: string
  completedAt: string | null
}
