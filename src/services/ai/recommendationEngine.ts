import type { Goal, GoalAIAnalysis } from '@/types/goal'
import { aiClient } from './client'

const RECOMMENDATION_SYSTEM_PROMPT = `You are LifeOS, an AI Chief of Staff for goal management and optimization.

Your role: Analyze a user's goal alongside their existing goals and provide actionable recommendations.
Be practical, specific, and honest. Focus on what will actually move the needle.`

export const recommendationEngine = {
  async getRecommendations(
    goal: Goal,
    existingGoals: Goal[],
  ): Promise<{ recommendations: string[]; error: string | null }> {
    try {
      const prompt = `Analyze this goal in context of existing goals and provide 3-5 actionable recommendations:

Current Goal: ${goal.title} (${goal.level}, ${goal.status})

Existing Goals:
${existingGoals.map((g) => `- ${g.title} (${g.level}, ${g.status}, ${g.progress}%)`).join('\n')}

Return a JSON array of recommendation strings, each being a specific actionable insight.
Format: ["recommendation 1", "recommendation 2", ...]`

      const response = await aiClient.gateway(goal.userId, {
        taskType: 'medium',
        prompt,
        systemPrompt: RECOMMENDATION_SYSTEM_PROMPT
      })
      if (!response) return { recommendations: [], error: 'No response from AI' }

      const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      const recommendations = Array.isArray(parsed) ? parsed : Array.isArray(JSON.parse(parsed)) ? JSON.parse(parsed) : []

      return { recommendations, error: null }
    } catch (err) {
      return { recommendations: [], error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  async detectConflicts(
    goal: Goal,
    existingGoals: Goal[],
  ): Promise<{ conflicts: string[]; error: string | null }> {
    const conflicts: string[] = []

    const sameCategoryActive = existingGoals.filter(
      (g) => g.metadata?.category === goal.metadata?.category && g.status === 'active' && g.id !== goal.id,
    )
    if (sameCategoryActive.length > 2) {
      conflicts.push(
        `You have ${sameCategoryActive.length} other active goals in the "${goal.metadata?.category}" domain. Consider consolidating or reprioritizing.`,
      )
    }

    const highPriorityActive = existingGoals.filter(
      (g) => g.priority >= 4 && g.status === 'active' && g.id !== goal.id,
    )
    if (goal.metadata?.priority === 'critical' && highPriorityActive.length >= 3) {
      conflicts.push(
        `You already have ${highPriorityActive.length} critical-priority active goals. Adding another may spread focus too thin.`,
      )
    }

    if (goal.metadata?.weeklyCommitment && goal.metadata.weeklyCommitment > 0) {
      const totalWeekly = existingGoals
        .filter((g) => g.status === 'active' && g.id !== goal.id)
        .reduce((sum, g) => sum + (g.metadata?.weeklyCommitment ?? 0), 0)
      if (totalWeekly + goal.metadata.weeklyCommitment > 60) {
        conflicts.push(
          `Your active goals require ~${totalWeekly + goal.metadata.weeklyCommitment}h/week. This may exceed your available bandwidth.`,
        )
      }
    }

    return { conflicts, error: null }
  },

  async suggestDependencies(
    goal: Goal,
    existingGoals: Goal[],
  ): Promise<string[]> {
    if (!goal.metadata?.dependencies || goal.metadata.dependencies.length === 0) {
      return []
    }

    const dependencies = goal.metadata.dependencies as string[]
    const suggestions: string[] = []

    for (const dep of dependencies) {
      const matching = existingGoals.find(
        (g) =>
          g.title.toLowerCase().includes(dep.toLowerCase()) ||
          dep.toLowerCase().includes(g.title.toLowerCase()),
      )
      if (matching) {
        suggestions.push(dep)
      }
    }

    return suggestions
  },

  async suggestMilestones(
    goal: Goal,
    aiAnalysis: GoalAIAnalysis | null | undefined,
  ): Promise<{ title: string; description?: string }[]> {
    if (aiAnalysis?.milestones && aiAnalysis.milestones.length > 0) {
      return aiAnalysis.milestones.map((m) => ({
        title: m.title,
        description: m.description,
      }))
    }

    if (goal.targetDate) {
      const startDate = goal.startDate ? new Date(goal.startDate) : new Date()
      const targetDate = new Date(goal.targetDate)
      const diffMonths = Math.max(1, Math.round((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
      const milestones = []
      for (let i = 1; i <= Math.min(diffMonths, 6); i++) {
        milestones.push({
          title: `Milestone ${i}: ${Math.round((i / diffMonths) * 100)}% progress`,
          description: `Achieve ${Math.round((i / diffMonths) * 100)}% of your goal`,
        })
      }
      return milestones
    }

    return [
      { title: 'Research & Planning', description: 'Initial research and create a detailed plan' },
      { title: 'First Milestone', description: 'Achieve first major milestone' },
      { title: 'Halfway Point', description: 'Reach 50% completion' },
      { title: 'Final Stretch', description: 'Last phase before completion' },
    ]
  },
}
