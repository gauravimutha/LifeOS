import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task } from '@/types/task'

const TASKS_KEY = ['tasks'] as const

async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks')
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

async function fetchDailyTasks(date: string): Promise<Task[]> {
  const res = await fetch(`/api/tasks/daily?date=${date}`)
  if (!res.ok) throw new Error('Failed to fetch daily tasks')
  return res.json()
}

async function createTask(input: { title: string; goalId?: string; scheduledStart?: string }): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

async function completeTask(id: string): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}/complete`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to complete task')
  return res.json()
}

async function deferTask(id: string, newDate: string): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}/defer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newDate }),
  })
  if (!res.ok) throw new Error('Failed to defer task')
  return res.json()
}

export function useTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: fetchTasks,
  })
}

export function useDailyTasks(date: string) {
  return useQuery({
    queryKey: [...TASKS_KEY, 'daily', date],
    queryFn: () => fetchDailyTasks(date),
    enabled: !!date,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY })
    },
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY })
    },
  })
}

export function useDeferTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newDate }: { id: string; newDate: string }) =>
      deferTask(id, newDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY })
    },
  })
}
