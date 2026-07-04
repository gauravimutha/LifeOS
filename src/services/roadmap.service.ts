import { prisma } from '@/lib/prisma'
import { aiClient } from './ai/client'
import { safeParseJson } from '@/lib/json'

export const roadmapService = {
  /**
   * Generates a fully populated Roadmap for a given Goal using the AI Gateway.
   * This deterministic + AI wrapper guarantees that tasks are mapped to roadmaps automatically.
   */
  async generateRoadmapForGoal(goalId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const goal = await prisma.goal.findUnique({ where: { id: goalId, userId } })
      if (!goal) return { success: false, error: 'Goal not found' }

      const prompt = `You are LifeOS, a world-class AI Chief of Staff, mentor, and strategist.
Generate a comprehensive execution roadmap to maximize the probability of achieving this user goal:
Goal Title: "${goal.title}"
Description: "${goal.description || 'Not provided'}"

Provide a JSON object conforming to this exact schema:
{
  "title": "Roadmap Title (e.g. Strategic Plan for GATE Preparation)",
  "description": "Short explanation of the roadmap's overall strategy",
  "predictedCompletionDate": "YYYY-MM-DD (estimate realistic target date based on effort)",
  "confidenceScore": 85, // number 0-100 indicating probability of successful goal completion
  "totalWeeks": 12, // overall estimated weeks of work
  "weeklyWorkload": "8-10 hours/week", // recommended weekly workload description
  "steps": [
    {
      "title": "Actionable milestone step title",
      "description": "Detailed instructions on what needs to be done",
      "phaseName": "Phase Name (e.g. Phase 1: Foundation, Phase 2: Core Work, Phase 3: Review)",
      "learningObjectives": ["objective 1", "objective 2"],
      "estimatedDuration": "Duration description (e.g. 2 hours, 10 hours)",
      "estimatedDifficulty": "Easy / Medium / Hard",
      "order": 1
    }
  ]
}
Return ONLY valid JSON. Create 4-8 highly specific steps that progress this goal in chronological order grouped under logical phases.
CRITICAL FORMATTING RULES:
- The entire response MUST be valid JSON conforming to the schema.
- DO NOT use literal newlines inside JSON string properties (use \n instead).
- Escape all double quotes inside string values with a backslash (e.g., \"DSA\").
- Never output truncated JSON.`

      const response = await aiClient.gateway(userId, {
        taskType: 'large',
        prompt,
        systemPrompt: 'You are an AI generating structured JSON roadmaps.'
      })

      if (!response) {
        return { success: false, error: 'AI failed to generate a roadmap.' }
      }

      const parsed = safeParseJson(response)

      if (!parsed || !parsed.title || !Array.isArray(parsed.steps)) {
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
            priority: goal.priority,
            metadata: {
              predictedCompletionDate: parsed.predictedCompletionDate || null,
              confidenceScore: parsed.confidenceScore || 75,
              totalWeeks: parsed.totalWeeks || 4,
              weeklyWorkload: parsed.weeklyWorkload || '5 hours/week'
            }
          }
        })

        if (parsed.steps.length > 0) {
          await tx.roadmapStep.createMany({
            data: parsed.steps.map((s: any, idx: number) => ({
              roadmapId: roadmap.id,
              title: s.title,
              description: s.description || '',
              order: s.order || idx + 1,
              isCompleted: false,
              metadata: {
                phaseName: s.phaseName || 'Phase 1: Foundation',
                learningObjectives: s.learningObjectives || [],
                estimatedDuration: s.estimatedDuration || '2 hours',
                estimatedDifficulty: s.estimatedDifficulty || 'Medium'
              }
            }))
          })
        }
      }, {
        timeout: 15000
      })

      return { success: true }
    } catch (err) {
      console.error('[RoadmapService] Generation failed:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }
}
