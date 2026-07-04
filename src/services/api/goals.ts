import { apiClient } from './client'
import type { GoalLevel, GoalStatus } from '@/types'

interface GoalApiResponse {
  id: string
  title: string
  description?: string
  level: GoalLevel
  status: GoalStatus
  progress: number
  parentGoalId?: string
  targetDate?: string
  domain?: string
  priority: number
  createdAt: string
  updatedAt: string
}

export const goalsApi = {
  list: (params?: { level?: GoalLevel; status?: GoalStatus }) =>
    apiClient.get<GoalApiResponse[]>(`/goals?${new URLSearchParams(params as Record<string, string>)}`),

  getById: (id: string) =>
    apiClient.get<GoalApiResponse>(`/goals/${id}`),

  create: (data: Partial<GoalApiResponse>) =>
    apiClient.post<GoalApiResponse>('/goals', data),

  update: (id: string, data: Partial<GoalApiResponse>) =>
    apiClient.patch<GoalApiResponse>(`/goals/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/goals/${id}`),
}
