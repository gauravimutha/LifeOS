import { prisma } from '@/lib/prisma'
import { aiClient } from './ai/client'

export const roadmapService = {
  /**
   * Generates a fully populated Roadmap for a given Goal using the AI Gateway.
   * This deterministic + AI wrapper guarantees that tasks are mapped to roadmaps automatically.
   */
  async generateRoadmapForGoal(goalId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const goal = await prisma.goal.findUnique({ where: { id: goalId, userId } })
      if (!goal) return { success: false, error: 'Goal not found' }

      const prompt = `You are LifeOS, an AI Chief of Staff.
Generate a complete execution roadmap for the following goal:
Goal Title: "${goal.title}"
Description: "${goal.description || 'Not provided'}"

Provide a JSON object conforming to this schema:
{
  "title": "Roadmap Title (e.g. Milestone Phase 1: ...)",
  "description": "Short explanation of the roadmap's objective",
  "steps": [
    {
      "title": "Actionable milestone step title",
      "description": "Detailed instructions",
      "order": 1
    }
  ]
}
Return ONLY valid JSON. Create 4-8 highly specific steps that progress this goal in chronological order.`

      const response = await aiClient.gateway(userId, {
        taskType: 'large',
        prompt,
        systemPrompt: 'You are an AI generating structured JSON roadmaps.'
      })

      if (!response) {
        return { success: false, error: 'AI failed to generate a roadmap.' }
      }

      const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)

      if (!parsed.title || !Array.isArray(parsed.steps)) {
        return { success: false, error: 'Invalid AI roadmap structure returned.' }
      }

      // Execute transaction to create Roadmap and RoadmapSteps atomically
      await prisma.$transaction(async (tx) => {
        const roadmap = await tx.roadmap.create({
          data: {
            userId,
            goalId,
            title: parsed.title,
            description: parsed.description || '',
            status: 'active',
            priority: goal.priority
          }
        })

        if (parsed.steps.length > 0) {
          await tx.roadmapStep.createMany({
            data: parsed.steps.map((s: any, idx: number) => ({
              roadmapId: roadmap.id,
              title: s.title,
              description: s.description || '',
              order: s.order || idx + 1,
              isCompleted: false
            }))
          })
        }
      })

      return { success: true }
    } catch (err) {
      console.error('[RoadmapService] Generation failed:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }
}
