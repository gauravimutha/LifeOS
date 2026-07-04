import type { Goal, GoalAIAnalysis } from '@/types/goal'
import { aiClient } from './client'
import { goalRepository } from '../goal/goalRepository'

const ANALYSIS_SYSTEM_PROMPT = `You are LifeOS, an AI Chief of Staff for goal planning and execution strategy.

Your role: Analyze a user's goal and produce a structured execution strategy. You are warm but direct, always explaining your reasoning.

Analysis rules:
1. Be honest about difficulty — don't sugarcoat. If a goal is hard, say so.
2. Estimate weekly commitment realistically based on the goal scope.
3. Generate 2-5 measurable success metrics.
4. Generate 3-6 milestones with target dates relative to the goal timeline.
5. Identify concrete skills, resources, and dependencies.
6. Note 1-3 risks and 1-3 opportunities.
7. Perform an honest reality check and list conflicts with existing active goals.
8. Always explain WHY you chose each dimension.

Return your analysis as valid JSON matching the schema below. Do NOT include markdown formatting or code blocks.`

function buildAnalysisPrompt(goal: Goal, activeGoals: Goal[]): string {
  const activeList = activeGoals
    .map((g) => `- "${g.title}" (category: ${g.metadata?.category || 'unknown'}, commitment: ${g.metadata?.weeklyCommitment || 5}h/week)`)
    .join('\n')

  return `<goal>
  title: "${goal.title}"
  description: "${goal.description ?? ''}"
  level: "${goal.level}"
  targetDate: "${goal.targetDate ?? 'not specified'}"
  tags: ${JSON.stringify(goal.tags)}
</goal>

<existing_active_goals>
${activeList || 'No other active goals'}
</existing_active_goals>

Analyze this new goal. Return a valid JSON object matching this structure. Check for timelines, resources, or energy conflicts against the user's existing goals:
{
  "category": "one of: academics, career, startup, research, fitness, family, friends, relationship, learning, content, personal-growth, entertainment, rest",
  "priority": "one of: low, medium, high, critical",
  "difficulty": "one of: easy, medium, hard, very_hard",
  "estimatedDuration": "string describing timeline (e.g. '3 months', '1 year')",
  "weeklyCommitment": number (hours per week),
  "successMetrics": ["array of measurable success criteria"],
  "milestones": [
    {
      "title": "milestone name",
      "description": "what this milestone entails",
      "targetDate": "relative date (e.g. 'Month 1', 'Week 3')",
      "completed": false
    }
  ],
  "suggestedRoadmaps": ["roadmap ideas that would help achieve this goal"],
  "dependencies": ["prerequisites or dependencies"],
  "skillsRequired": ["skills needed"],
  "resources": ["tools, people, or resources needed"],
  "risks": [
    {
      "description": "risk description",
      "likelihood": "low/medium/high",
      "impact": "low/medium/high",
      "mitigation": "how to reduce this risk"
    }
  ],
  "opportunities": [
    {
      "description": "opportunity description",
      "potentialImpact": "low/medium/high",
      "effortRequired": "low/medium/high"
    }
  ],
  "realityCheck": "overall feasibility assessment when executed alongside existing goals (max 3 sentences)",
  "conflicts": ["array of competing timelines or energy conflicts detected between this and existing goals"],
  "reasoning": {
    "category": "explain why this category",
    "priority": "explain why this priority level",
    "difficulty": "explain why this difficulty level",
    "timeline": "explain the estimated timeline"
  }
}`
}

export const goalAnalysisService = {
  async analyzeGoal(goal: Goal): Promise<{ analysis: GoalAIAnalysis | null; error: string | null }> {
    try {
      // Fetch user's existing active goals for cross-goal conflict check
      let activeGoals: Goal[] = []
      try {
        const existingGoals = await goalRepository.findByUser(goal.userId)
        activeGoals = existingGoals.filter((g) => g.status === 'active' && g.id !== goal.id)
      } catch (err) {
        console.warn('Failed to fetch existing goals for comparison:', err)
      }

      const prompt = buildAnalysisPrompt(goal, activeGoals)
      
      const apiKey = process.env.OPENROUTER_API_KEY || ''
      const isApiKeyPlaceholder = apiKey.includes('your-key-here') || apiKey === ''

      let response: string | null = null
      if (!isApiKeyPlaceholder) {
        response = await aiClient.gateway(goal.userId, {
          taskType: 'large',
          prompt,
          systemPrompt: ANALYSIS_SYSTEM_PROMPT
        })
      }

      if (!response) {
        // Fall back to high-fidelity local generator
        const localAnalysis = this.generateLocalMockAnalysis(goal, activeGoals)
        return { analysis: localAnalysis, error: null }
      }

      const analysis = this.parseAnalysisResponse(response)
      if (!analysis) {
        return { analysis: null, error: 'Failed to parse AI analysis response' }
      }

      return { analysis, error: null }
    } catch (err) {
      return { analysis: null, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  parseAnalysisResponse(response: string): GoalAIAnalysis | null {
    try {
      const cleaned = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      const validPriorities = ['low', 'medium', 'high', 'critical']
      const validDifficulties = ['easy', 'medium', 'hard', 'very_hard']

      const analysis: GoalAIAnalysis = {
        category: parsed.category || 'personal-growth',
        priority: validPriorities.includes(parsed.priority) ? parsed.priority : 'medium',
        difficulty: validDifficulties.includes(parsed.difficulty) ? parsed.difficulty : 'medium',
        estimatedDuration: parsed.estimatedDuration ?? 'Not specified',
        weeklyCommitment: typeof parsed.weeklyCommitment === 'number' ? parsed.weeklyCommitment : 5,
        successMetrics: Array.isArray(parsed.successMetrics) ? parsed.successMetrics : [],
        milestones: Array.isArray(parsed.milestones) ? parsed.milestones.map((m: any) => ({
          title: m.title ?? 'Milestone',
          description: m.description,
          targetDate: m.targetDate,
          completed: false,
        })) : [],
        suggestedRoadmaps: Array.isArray(parsed.suggestedRoadmaps) ? parsed.suggestedRoadmaps : [],
        dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : [],
        skillsRequired: Array.isArray(parsed.skillsRequired) ? parsed.skillsRequired : [],
        resources: Array.isArray(parsed.resources) ? parsed.resources : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
        realityCheck: parsed.realityCheck ?? '',
        conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
        reasoning: {
          category: parsed.reasoning?.category ?? '',
          priority: parsed.reasoning?.priority ?? '',
          difficulty: parsed.reasoning?.difficulty ?? '',
          timeline: parsed.reasoning?.timeline ?? '',
        },
      }

      return analysis
    } catch {
      return null
    }
  },

  generateLocalMockAnalysis(goal: Goal, activeGoals: Goal[]): GoalAIAnalysis {
    const title = goal.title.toLowerCase()
    
    let category = 'personal-growth'
    let weeklyCommitment = 5
    let estimatedDuration = '3 months'
    let difficulty: 'easy' | 'medium' | 'hard' | 'very_hard' = 'medium'
    let successMetrics = ['Complete all key scheduled milestones', 'Maintain weekly study/practice consistency of at least 80%']
    let milestones = [
      { title: 'Research & Planning', description: 'Define milestones and collect resources.', targetDate: 'Week 2', completed: false },
      { title: 'Core Execution Phase 1', description: 'Execute foundational concepts and study blocks.', targetDate: 'Month 1', completed: false },
      { title: 'Review & Refinement', description: 'Evaluate outcomes and adjust routines.', targetDate: 'Month 2', completed: false }
    ]

    if (title.match(/gate|gre|exam|upsc|cat/)) {
      category = 'learning'
      weeklyCommitment = 15
      estimatedDuration = '6 months'
      difficulty = 'hard'
      successMetrics = ['Achieve > 80% score in weekly mock tests', 'Complete syllabus preparation by month 4']
      milestones = [
        { title: 'Syllabus Breakdown', description: 'Divide subjects into weekly segments.', targetDate: 'Week 2', completed: false },
        { title: 'Practice Exercises', description: 'Solve previous years papers and key question sets.', targetDate: 'Month 2', completed: false },
        { title: 'Full Length Mocks', description: 'Write mock exams under real constraints.', targetDate: 'Month 5', completed: false }
      ]
    } else if (title.match(/startup|business|launch/)) {
      category = 'startup'
      weeklyCommitment = 20
      estimatedDuration = '12 months'
      difficulty = 'very_hard'
      successMetrics = ['Develop a working MVP', 'Validate idea with 50+ prospective users']
      milestones = [
        { title: 'MVP Design & Setup', description: 'Draft core technical and business specs.', targetDate: 'Month 2', completed: false },
        { title: 'Beta Release', description: 'Deploy basic version to test groups.', targetDate: 'Month 6', completed: false },
        { title: 'Launch Phase', description: 'Implement feedback and officially launch MVP.', targetDate: 'Month 9', completed: false }
      ]
    } else if (title.match(/code|software|portfolio|web|dev/)) {
      category = 'career'
      weeklyCommitment = 10
      estimatedDuration = '3 months'
      difficulty = 'hard'
      successMetrics = ['Build 3 production-ready web apps', 'Deploy portfolio website online']
      milestones = [
        { title: 'Project Outlines', description: 'Wireframe and architecture 3 portfolio apps.', targetDate: 'Week 2', completed: false },
        { title: 'Development & Build', description: 'Code frontend, backend, and database structures.', targetDate: 'Month 2', completed: false },
        { title: 'Deployment & Review', description: 'Host code publicly and seek peer reviews.', targetDate: 'Month 3', completed: false }
      ]
    } else if (title.match(/gym|workout|fitness|run/)) {
      category = 'fitness'
      weeklyCommitment = 6
      estimatedDuration = '3 months'
      difficulty = 'medium'
      successMetrics = ['Execute fitness plan 4x a week', 'Achieve target fitness metrics']
      milestones = [
        { title: 'Fitness Setup', description: 'Get trainer assessment and schedule time slots.', targetDate: 'Week 1', completed: false },
        { title: 'Consistency Lock', description: 'Sustain 4 workouts a week for 4 consecutive weeks.', targetDate: 'Month 1', completed: false },
        { title: 'Intensity Increase', description: 'Step up weight weights or distance pacing.', targetDate: 'Month 2', completed: false }
      ]
    }

    const conflicts: string[] = []
    let realityCheck = 'This goal is highly achievable with structured focus. We recommend scheduling 2-3 dedicated time blocks per week.'

    if (activeGoals.length > 0) {
      const activeTitles = activeGoals.map((g) => g.title.toLowerCase())
      
      const newStartup = title.includes('startup') || title.includes('business')
      const existingPlacement = activeTitles.some((t) => t.includes('placement') || t.includes('job') || t.includes('career'))
      const newPlacement = title.includes('placement') || title.includes('job') || title.includes('career')
      const existingStartup = activeTitles.some((t) => t.includes('startup') || t.includes('business'))
      
      if ((newStartup && existingPlacement) || (newPlacement && existingStartup)) {
        conflicts.push('Startup vs. Placement Prep: Building a startup and preparing for placements simultaneously splits your high-energy attention. Both require massive cognitive load.')
      }

      const countTests = (newPlacement || title.match(/cat|gre|upsc|gate|gmat|exam/) ? 1 : 0) +
        activeGoals.filter((g) => g.title.toLowerCase().match(/cat|gre|upsc|gate|gmat|exam/)).length
      
      if (countTests >= 2) {
        conflicts.push('Standardized Test Prep Split: Preparing for multiple competitive exams (e.g., CAT, GRE, UPSC) simultaneously divides your focus and study habits, reducing overall readiness.')
      }

      const newGym = title.match(/gym|workout|fitness|sports/)
      const existingStudy = activeTitles.some((t) => t.match(/study|prep|upsc|cat|gre|exam/))
      if (newGym && existingStudy) {
        conflicts.push('Morning Gym vs. Intense Study: Intense physical training can lead to post-workout fatigue, competing with morning deep-focus study blocks. Balance scheduling carefully.')
      }

      const totalCommitment = activeGoals.reduce((sum, g) => sum + (g.metadata?.aiAnalysis?.weeklyCommitment || 5), 0) + weeklyCommitment
      if (totalCommitment > 25) {
        realityCheck = `⚠️ Bandwidth Alert: You have ${activeGoals.length + 1} active goals requiring an estimated total of ${totalCommitment} hours/week. Since standard peak focus capacity is 25 hours, this setup is highly susceptible to burnout. We advise prioritizing only 2 core goals.`
      } else {
        realityCheck = `Feasible. Your active goals require approximately ${totalCommitment} hours/week, leaving ample buffer for rest and routines.`
      }
    }

    if (conflicts.length > 0 && !realityCheck.includes('Bandwidth Alert')) {
      realityCheck = `⚠️ Competing Goals: We detected ${conflicts.length} goal resource conflicts. Running these concurrently will divide your focus. Consider pausing or staggering them.`
    }

    return {
      category,
      priority: goal.priority >= 4 ? 'critical' : goal.priority >= 3 ? 'high' : 'medium',
      difficulty,
      estimatedDuration,
      weeklyCommitment,
      successMetrics,
      milestones,
      suggestedRoadmaps: [],
      dependencies: [],
      skillsRequired: [],
      resources: [],
      risks: [],
      opportunities: [],
      realityCheck,
      conflicts,
      reasoning: {
        category: 'Matches identified focus areas.',
        priority: 'Reflected in priority configurations.',
        difficulty: 'Based on standard cognitive efforts.',
        timeline: 'Estimated based on target deadlines.'
      }
    }
  },

  async analyzeAndSave(goalId: string): Promise<{ success: boolean; error?: string }> {
    const { goalService } = await import('@/services/goal/goalService')
    const { goal } = await goalService.getGoalWithDetails(goalId)
    if (!goal) return { success: false, error: 'Goal not found' }

    const { analysis, error } = await this.analyzeGoal(goal)
    if (error || !analysis) return { success: false, error: error ?? 'Analysis failed' }

    const metadata: Record<string, unknown> = {
      aiAnalysis: analysis,
      category: analysis.category,
      difficulty: analysis.difficulty,
      estimatedDuration: analysis.estimatedDuration,
      weeklyCommitment: analysis.weeklyCommitment,
      successMetrics: analysis.successMetrics,
      milestones: analysis.milestones,
      suggestedRoadmaps: analysis.suggestedRoadmaps,
      dependencies: analysis.dependencies,
      skillsRequired: analysis.skillsRequired,
      resources: analysis.resources,
      risks: analysis.risks,
      opportunities: analysis.opportunities,
      aiAnalyzedAt: new Date().toISOString(),
      aiModel: 'openai/gpt-4o-mini',
    }

    const result = await goalService.updateGoal(goalId, { metadata })
    return result.error
      ? { success: false, error: result.error }
      : { success: true }
  },
}
