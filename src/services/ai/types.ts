export interface AIChatMessage {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
  tokens?: number
  confidence?: number
}

export interface AICompletionRequest {
  model?: string
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface AIContext {
  identity?: Record<string, unknown>
  preferences?: Record<string, unknown>
  goals?: string
  tasks?: string
  calendar?: string
  health?: string
  memory?: string
}

export interface DailyPlan {
  date: string
  summary: string
  priorities: { title: string; reason: string; estimatedMinutes: number }[]
  schedule: {
    startTime: string
    endTime: string
    activity: string
    type: 'task' | 'habit' | 'break' | 'focus' | 'meeting' | 'personal'
  }[]
  adjustments: { type: string; taskId?: string; reason: string }[]
  insights: string[]
}
