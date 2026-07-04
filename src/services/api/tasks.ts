import { apiClient } from './client'
import type { TaskStatus, TaskSource } from '@/types'

interface TaskApiResponse {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: number
  goalId?: string
  projectId?: string
  estimatedMinutes?: number
  dueDate?: string
  scheduledStart?: string
  scheduledEnd?: string
  source: TaskSource
  energyRequired?: number
  createdAt: string
  updatedAt: string
}

export const tasksApi = {
  list: (params?: { status?: TaskStatus; goalId?: string; date?: string }) =>
    apiClient.get<TaskApiResponse[]>(`/tasks?${new URLSearchParams(params as Record<string, string>)}`),

  getById: (id: string) =>
    apiClient.get<TaskApiResponse>(`/tasks/${id}`),

  create: (data: Partial<TaskApiResponse>) =>
    apiClient.post<TaskApiResponse>('/tasks', data),

  update: (id: string, data: Partial<TaskApiResponse>) =>
    apiClient.patch<TaskApiResponse>(`/tasks/${id}`, data),

  complete: (id: string) =>
    apiClient.post<TaskApiResponse>(`/tasks/${id}/complete`),

  defer: (id: string, newDate: string) =>
    apiClient.post<TaskApiResponse>(`/tasks/${id}/defer`, { newDate }),

  delete: (id: string) =>
    apiClient.delete(`/tasks/${id}`),
}
