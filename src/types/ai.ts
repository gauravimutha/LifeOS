export interface AIRequest {
  tasks: string
  currentTime: string
  availableHours: number
  energyLevel: number
}

export interface AIResponse {
  suggestion: string
  reasoning: string
  estimatedCompletion: string
  suggestedBreak: string
}
