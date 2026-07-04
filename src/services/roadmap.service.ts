import { prisma } from '@/lib/prisma'
import { aiClient } from './ai/client'
import { safeParseJson } from '@/lib/json'
import { executeAIFeature, AIFeatureDefinition } from './ai/fallback'

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

      const roadmapFeature: AIFeatureDefinition<any, []> = {
        name: 'Roadmap Generator',
        executeAI: async () => {
          const response = await aiClient.gateway(userId, {
            taskType: 'large',
            prompt,
            systemPrompt: 'You are an AI generating structured JSON roadmaps.'
          })
          const parsed = safeParseJson(response)
          if (!parsed || !parsed.title || !Array.isArray(parsed.steps)) {
            throw new Error('Invalid AI roadmap structure returned by LLM.')
          }
          return parsed
        },
        executeIntelligentFallback: async () => {
          return this.generateLocalRoadmapFallback(goal.title, goal.description || '')
        },
        executeSafeDefault: () => {
          return this.generateSafeDefaultRoadmap(goal.title)
        }
      }

      const fallbackResponse = await executeAIFeature(roadmapFeature)
      const parsed = fallbackResponse.data

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
  },

  async generateLocalRoadmapFallback(title: string, description: string): Promise<any> {
    const titleLower = title.toLowerCase()
    
    // Heuristic 1: Study & Exam Preparation
    if (titleLower.match(/gate|exam|study|prep|test|upsc|cat|gre|gmat/)) {
      return {
        title: `Strategic Study Plan for ${title}`,
        description: `Deterministic learning path optimized for ${description || title}`,
        predictedCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confidenceScore: 80,
        totalWeeks: 12,
        weeklyWorkload: '10-15 hours/week',
        steps: [
          {
            title: 'Subject-wise Core Topic Review',
            description: 'Read primary study material, standard textbooks, and watch lecture slides.',
            phaseName: 'Phase 1: Foundation',
            learningObjectives: ['Complete syllabus review', 'Log study schedule'],
            estimatedDuration: '4 weeks',
            estimatedDifficulty: 'Medium',
            order: 1
          },
          {
            title: 'Formulas & Short Notes Assembly',
            description: 'Write quick-reference summaries and formula sheets for high-weightage topics.',
            phaseName: 'Phase 1: Foundation',
            learningObjectives: ['Prepare summary cheat sheet'],
            estimatedDuration: '2 weeks',
            estimatedDifficulty: 'Easy',
            order: 2
          },
          {
            title: 'Solve Previous Years Questions (PYQs)',
            description: 'Practice high-frequency competitive questions in timed intervals to build speed.',
            phaseName: 'Phase 2: Core Work',
            learningObjectives: ['Solve 10 years of PYQs', 'Review weak areas'],
            estimatedDuration: '4 weeks',
            estimatedDifficulty: 'Hard',
            order: 3
          },
          {
            title: 'Full-Length Timed Mock Exam',
            description: 'Replicate exam conditions using full length papers, analyze negative marking.',
            phaseName: 'Phase 3: Review',
            learningObjectives: ['Take 3 mock exams', 'Score > 80% target'],
            estimatedDuration: '2 weeks',
            estimatedDifficulty: 'Hard',
            order: 4
          }
        ]
      }
    }
    
    // Heuristic 2: Fitness, Health & Muscle Gain
    if (titleLower.match(/fit|gym|health|lose|gain|muscle|diet|weight/)) {
      return {
        title: `Healthy Routine Builder: ${title}`,
        description: `Balanced diet and physical training progression customized for ${description || title}`,
        predictedCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confidenceScore: 85,
        totalWeeks: 8,
        weeklyWorkload: '4-6 hours/week',
        steps: [
          {
            title: 'Nutrition & Diet Alignment',
            description: 'Identify target macro ratio and perform kitchen inventory cleanup.',
            phaseName: 'Phase 1: Foundation',
            learningObjectives: ['Set caloric budget', 'Prep protein source guidelines'],
            estimatedDuration: '2 weeks',
            estimatedDifficulty: 'Easy',
            order: 1
          },
          {
            title: 'Begin Progressive Overload Training',
            description: 'Establish standard split training (Push/Pull/Legs) focused on compound movements.',
            phaseName: 'Phase 2: Core Work',
            learningObjectives: ['Log 3-4 gym workouts/week', 'Track heavy weights lift'],
            estimatedDuration: '4 weeks',
            estimatedDifficulty: 'Medium',
            order: 2
          },
          {
            title: 'Consistency & Sleep Tracking',
            description: 'Target 8 hours of sleep per night to maximize muscle synthesis and recovery.',
            phaseName: 'Phase 3: Review',
            learningObjectives: ['Verify recovery state', 'Measure progressive lift targets'],
            estimatedDuration: '2 weeks',
            estimatedDifficulty: 'Easy',
            order: 3
          }
        ]
      }
    }

    // Default: General Goal Achievement Template
    return {
      title: `Action Plan: ${title}`,
      description: `Structured milestone milestones in service of ${description || title}`,
      predictedCompletionDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      confidenceScore: 75,
      totalWeeks: 6,
      weeklyWorkload: '5 hours/week',
      steps: [
        {
          title: 'Initial Assessment & Scope Alignment',
          description: 'Clearly define boundaries, list constraints, and map resource requirements.',
          phaseName: 'Phase 1: Setup',
          learningObjectives: ['Draft scoping outline', 'Identify dependencies'],
          estimatedDuration: '1 week',
          estimatedDifficulty: 'Easy',
          order: 1
        },
        {
          title: 'Core Implementation Tasks',
          description: 'Protect daily focused deep work blocks to check off primary milestones.',
          phaseName: 'Phase 2: Execution',
          learningObjectives: ['Accomplish weekly project sprints'],
          estimatedDuration: '4 weeks',
          estimatedDifficulty: 'Hard',
          order: 2
        },
        {
          title: 'Validation & Strategic Tuning',
          description: 'Measure results against success metrics and adjust strategy for long-term consistency.',
          phaseName: 'Phase 3: Refinement',
          learningObjectives: ['Conduct post-execution check-in', 'Adjust roadmap for future target dates'],
          estimatedDuration: '1 week',
          estimatedDifficulty: 'Medium',
          order: 3
        }
      ]
    }
  },

  generateSafeDefaultRoadmap(title: string): any {
    return {
      title: `Plan for ${title}`,
      description: 'AI roadmap generation is temporarily offline. Loading default configurations.',
      predictedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      confidenceScore: 70,
      totalWeeks: 4,
      weeklyWorkload: '3 hours/week',
      steps: [
        {
          title: 'Core Setup Tasks',
          description: 'Default placeholder milestone to avoid blocking your planning schedule.',
          phaseName: 'Phase 1: Setup',
          learningObjectives: ['Complete setup steps'],
          estimatedDuration: '4 weeks',
          estimatedDifficulty: 'Medium',
          order: 1
        }
      ]
    }
  }
}
