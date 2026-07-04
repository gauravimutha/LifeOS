import { db } from '@/lib/db'
import { aiClient } from './ai/client'

export interface DailyPlanWithActions {
  id: string
  userId: string
  date: string
  summary: string
  actions: Array<{
    id: string
    startTime: string
    endTime: string
    activity: string
    type: string
    reason: string
    status: string
    roadmapStepId?: string | null
  }>
}

export const planningService = {
  /**
   * Generates a completely new Daily Plan for today or a specific date.
   * Analyzes all user context (goals, roadmaps, steps, routine, calendar, history, health, memory).
   */
  async generateDailyPlan(userId: string, dateStr: string): Promise<DailyPlanWithActions> {
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setDate(dayEnd.getDate() + 1)

    // 1. Gather all context deterministically (PostgreSQL query optimizations)
    const [user, activeGoals, calendarEvents, routines, lastExecutionHistory, healthData, aiMemories] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.goal.findMany({
        where: { userId, status: 'active', deletedAt: null },
        include: { roadmaps: { include: { steps: true } } }
      }),
      db.calendarEvent.findMany({
        where: { userId, startTime: { gte: targetDate, lt: dayEnd }, deletedAt: null },
        orderBy: { startTime: 'asc' }
      }),
      db.routine.findMany({
        where: { userId, status: 'active' },
        include: { steps: { orderBy: { order: 'asc' } } }
      }),
      db.executionHistory.findMany({
        where: { userId, date: { gte: new Date(targetDate.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { date: 'desc' },
        take: 30
      }),
      db.healthData.findUnique({
        where: { userId_date: { userId, date: targetDate } }
      }),
      db.aIMemory.findMany({
        where: { userId, isActive: true },
        take: 10
      })
    ])

    if (!user) {
      throw new Error('User not found')
    }

    // 2. Deterministic sorting of Roadmap Steps (Priority Calculation)
    // Gather all pending steps from active goals/roadmaps
    const pendingSteps: Array<{ stepId: string; roadmapTitle: string; stepTitle: string; goalTitle: string; priority: number }> = []
    for (const goal of activeGoals) {
      for (const roadmap of goal.roadmaps) {
        const steps = roadmap.steps.filter((s: any) => !s.isCompleted).sort((a: any, b: any) => a.order - b.order)
        if (steps.length > 0) {
          // Take the next incomplete step
          pendingSteps.push({
            stepId: steps[0].id,
            roadmapTitle: roadmap.title,
            stepTitle: steps[0].title,
            goalTitle: goal.title,
            priority: goal.priority
          })
        }
      }
    }
    // Sort steps by goal priority descending
    pendingSteps.sort((a, b) => b.priority - a.priority)

    // Build the available time windows from calendar events
    // Sleep schedule from preference or default (23:00 - 07:00)
    const preferences = (user.preferences as Record<string, any>) || {}
    const sleepHour = preferences.sleepHour || 23
    const wakeHour = preferences.wakeHour || 7

    // Construct the context string for the LLM
    const contextPrompt = {
      date: dateStr,
      sleepWindow: `${sleepHour}:00 to ${wakeHour}:00`,
      routine: routines.map((r: any) => ({
        title: r.title,
        timeOfDay: r.routineType,
        steps: r.steps.map((s: any) => `${s.title} (${s.durationMinutes}m)`)
      })),
      fixedCommitments: calendarEvents.map((e: any) => ({
        title: e.title,
        start: e.startTime.toISOString(),
        end: e.endTime.toISOString()
      })),
      prioritizedRoadmapSteps: pendingSteps,
      recentExecutionHistory: lastExecutionHistory.map((h: any) => ({
        activity: h.activity,
        status: h.status,
        date: h.date.toISOString().split('T')[0]
      })),
      healthState: healthData ? {
        sleepHours: healthData.sleepHours,
        energyLevel: healthData.energyLevel,
        stressLevel: healthData.stressLevel
      } : { energyLevel: 3, stressLevel: 2 },
      memories: aiMemories.map((m: any) => `- ${m.key}: ${JSON.stringify(m.value)}`),
      preferences: {
        lifeStage: preferences.lifeStage || 'general',
        focusedHours: preferences.focusedHours || 'standard hours',
        aiRole: preferences.aiRole || 'Chief of Staff'
      }
    }

    const systemPrompt = `You are LifeOS, the ultimate AI Chief of Staff.
Your goal is to construct a premium, balanced, and realistic Daily Plan consisting of Daily Actions for the user.

CRITICAL ARCHITECTURE PRINCIPLE:
Do NOT optimize for completing the maximum number of tasks. Instead, optimize for helping the user make the best possible, highest-quality use of their day in service of their long-term goals while maintaining a healthy, sustainable life balance.

You must analyze the user's routines, fixed commitments (calendar), prioritized goal steps, health status, and history.

Rules:
1. Do not schedule work during sleep hours or fixed commitments.
2. Schedule deep work blocks corresponding to the top prioritized roadmap steps.
3. Every scheduled action must contain a clear, professional justification explaining: "Why today?", "Why now?", "Why this duration?", "Why this priority?"
4. Incorporate breaks, recovery, fitness, and family routines based on routine commitments and energy levels.
5. Return ONLY a JSON object matching this schema:
{
  "summary": "High level strategic summary of today's plan (1-2 sentences)",
  "actions": [
    {
      "startTime": "ISO date string (e.g. 2026-07-04T09:00:00.000Z)",
      "endTime": "ISO date string (e.g. 2026-07-04T10:30:00.000Z)",
      "activity": "Activity name",
      "type": "one of: task, routine, meeting, break, fitness, personal, recovery",
      "reason": "Explicit justification answering why this was scheduled now/today/duration",
      "roadmapStepId": "associated step ID from prioritizedRoadmapSteps if applicable (nullable)"
    }
  ]
}`

    let response: string | null = null
    const apiKey = process.env.OPENROUTER_API_KEY || ''
    const isApiKeyPlaceholder = apiKey.includes('your-key-here') || apiKey === ''

    if (!isApiKeyPlaceholder) {
      try {
        response = await aiClient.gateway(userId, {
          taskType: 'medium',
          prompt: JSON.stringify(contextPrompt),
          systemPrompt
        })
      } catch (err) {
        console.warn('[PlanningService] AI Gateway call failed, falling back:', err)
      }
    }

    let parsedPlan: any = null
    if (response) {
      try {
        const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        parsedPlan = JSON.parse(cleaned)
      } catch (err) {
        console.warn('[PlanningService] Failed to parse AI plan JSON:', err)
      }
    }

    // High fidelity local fallback if AI response is missing
    if (!parsedPlan || !Array.isArray(parsedPlan.actions)) {
      parsedPlan = this.generateLocalFallbackPlan(userId, dateStr, contextPrompt)
    }

    // Find existing DailyPlan to get its ID, or generate a new UUID
    const existingPlan = await db.dailyPlan.findUnique({
      where: { userId_date: { userId, date: targetDate } }
    })
    const planId = existingPlan ? existingPlan.id : crypto.randomUUID()

    // Persist the generated plan to the database atomically in a single batch transaction to avoid timeouts
    const [upsertedPlan, _deletedActions, ...createdActions] = await db.$transaction([
      db.dailyPlan.upsert({
        where: { userId_date: { userId, date: targetDate } },
        update: { summary: parsedPlan.summary || 'A structured plan for your day.' },
        create: {
          id: planId,
          userId,
          date: targetDate,
          summary: parsedPlan.summary || 'A structured plan for your day.'
        }
      }),
      db.dailyAction.deleteMany({
        where: { dailyPlanId: planId }
      }),
      ...parsedPlan.actions.map((act: any) =>
        db.dailyAction.create({
          data: {
            dailyPlanId: planId,
            userId,
            roadmapStepId: act.roadmapStepId || null,
            startTime: new Date(act.startTime),
            endTime: new Date(act.endTime),
            activity: act.activity,
            type: act.type || 'task',
            reason: act.reason || 'Scheduled context optimization.',
            status: 'pending'
          }
        })
      )
    ])

    return {
      id: upsertedPlan.id,
      userId: upsertedPlan.userId,
      date: dateStr,
      summary: upsertedPlan.summary || '',
      actions: (createdActions as any[]).map((a) => ({
        id: a.id,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        activity: a.activity,
        type: a.type,
        reason: a.reason,
        status: a.status,
        roadmapStepId: a.roadmapStepId
      }))
    }
  },

  /**
   * Generates a weekly plan projection by compiling daily plans.
   */
  async generateWeeklyPlan(userId: string, weekStartStr: string) {
    const start = new Date(weekStartStr)
    const dailyPlans: Array<{ date: string; actionsCount: number; summary: string }> = []

    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      try {
        const plan = await this.generateDailyPlan(userId, dateStr)
        dailyPlans.push({
          date: dateStr,
          actionsCount: plan.actions.length,
          summary: plan.summary
        })
      } catch (err) {
        console.warn(`Failed to generate daily plan for date ${dateStr}:`, err)
      }
    }

    return {
      id: `weekly-${weekStartStr}`,
      userId,
      weekStart: weekStartStr,
      dailyPlans,
      summary: `Weekly planning established with ${dailyPlans.length} active daily schedules.`
    }
  },

  /**
   * Adapts the plan dynamically on triggered events (rescheduling affected blocks only).
   */
  async adaptPlan(userId: string, triggerEvent: { type: string; data?: Record<string, any> }) {
    const todayStr = new Date().toISOString().split('T')[0]
    const targetDate = new Date(todayStr)
    targetDate.setHours(0, 0, 0, 0)

    const currentPlan = await db.dailyPlan.findFirst({
      where: { userId, date: targetDate },
      include: { actions: true }
    })

    if (!currentPlan) {
      return this.generateDailyPlan(userId, todayStr)
    }

    // Adaptive reasoning: e.g. user misses an action or calendar updates
    // In a fully dynamic system, we can rerun the planner with trigger context.
    // For cost optimization, if it's a minor change like complete task early, we handle it deterministically.
    if (triggerEvent.type === 'action_completed_early') {
      const actionId = triggerEvent.data?.actionId as string
      if (actionId) {
        await db.dailyAction.update({
          where: { id: actionId },
          data: { status: 'completed' }
        })
      }
    }

    // If calendar changes or user requests full replan, we regenerate
    if (triggerEvent.type === 'calendar_updated' || triggerEvent.type === 'user_replan_requested') {
      return this.generateDailyPlan(userId, todayStr)
    }

    // Reload and return updated plan
    const updatedActions = await db.dailyAction.findMany({
      where: { dailyPlanId: currentPlan.id },
      orderBy: { startTime: 'asc' }
    })

    return {
      id: currentPlan.id,
      userId,
      date: todayStr,
      summary: currentPlan.summary || '',
      actions: updatedActions.map((a: any) => ({
        id: a.id,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        activity: a.activity,
        type: a.type,
        reason: a.reason,
        status: a.status,
        roadmapStepId: a.roadmapStepId
      }))
    }
  },

  /**
   * Finalizes the End of Day review by saving all actions to Execution History.
   */
  async submitDayReview(
    userId: string,
    dateStr: string,
    reviewData: {
      mood?: number
      energy?: number
      notes?: string
      interruptions?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const targetDate = new Date(dateStr)
      targetDate.setHours(0, 0, 0, 0)

      const plan = await db.dailyPlan.findFirst({
        where: { userId, date: targetDate },
        include: { actions: true }
      })

      if (!plan) return { success: false, error: 'Daily plan not found for this date.' }

      // Save all daily actions to permanent ExecutionHistory atomically
      await db.$transaction(async (tx) => {
        // Create execution history entries
        if (plan.actions.length > 0) {
          await tx.executionHistory.createMany({
            data: plan.actions.map((act: any) => {
              const diffMs = act.endTime.getTime() - act.startTime.getTime()
              const minutes = Math.round(diffMs / 60000)

              return {
                userId,
                date: targetDate,
                activity: act.activity,
                type: act.type,
                roadmapStepId: act.roadmapStepId,
                reason: act.reason,
                status: act.status, // completed, skipped, or pending (treated as skipped if reviewed)
                actualMinutes: act.status === 'completed' ? minutes : 0,
                mood: reviewData.mood || null,
                energy: reviewData.energy || null,
                notes: reviewData.notes || '',
                interruptions: reviewData.interruptions || ''
              }
            })
          })

          // Mark Roadmap Steps completed if their associated action was completed
          const completedActions = plan.actions.filter((a: any) => a.status === 'completed' && a.roadmapStepId)
          for (const action of completedActions) {
            await tx.roadmapStep.update({
              where: { id: action.roadmapStepId! },
              data: {
                isCompleted: true,
                completedAt: new Date()
              }
            })
          }
        }

        // Clean up temporary actions and the plan shell to optimize PostgreSQL storage
        await tx.dailyAction.deleteMany({ where: { dailyPlanId: plan.id } })
        await tx.dailyPlan.delete({ where: { id: plan.id } })
      }, {
        timeout: 15000
      })

      // Trigger the Learning Engine asynchronously
      const { learningEngine } = await import('./learning.service')
      learningEngine.digestDay(userId, targetDate).catch((e: any) => {
        console.error('[PlanningService] Learning engine failure:', e)
      })

      return { success: true }
    } catch (err) {
      console.error('[PlanningService] EOD Review failed:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  /**
   * High fidelity fallback plan generator.
   */
  generateLocalFallbackPlan(userId: string, dateStr: string, context: any): any {
    const actions: any[] = []
    const baseDate = new Date(dateStr)

    const createTime = (hours: number, minutes: number) => {
      const d = new Date(baseDate)
      d.setHours(hours, minutes, 0, 0)
      return d.toISOString()
    }

    // 1. Morning Routine
    actions.push({
      startTime: createTime(7, 0),
      endTime: createTime(8, 0),
      activity: '🌅 Morning Routine',
      type: 'routine',
      reason: 'Establishes healthy physical momentum and focus alignment first thing in the morning.'
    })

    // 2. Fixed Commitments (Calendar sync)
    context.fixedCommitments.forEach((e: any) => {
      actions.push({
        startTime: e.start,
        endTime: e.end,
        activity: e.title,
        type: 'meeting',
        reason: 'Syncs with fixed commitments and external calendar sync blocks.'
      })
    })

    // 3. Goal deep work blocks
    if (context.prioritizedRoadmapSteps.length > 0) {
      const step = context.prioritizedRoadmapSteps[0]
      actions.push({
        startTime: createTime(9, 30),
        endTime: createTime(12, 30),
        activity: `${step.roadmapTitle}: ${step.stepTitle}`,
        type: 'task',
        reason: `Targeting top prioritized roadmap step for "${step.goalTitle}". Scheduled during peak morning cognitive energy.`,
        roadmapStepId: step.stepId
      })
    } else {
      actions.push({
        startTime: createTime(9, 30),
        endTime: createTime(11, 30),
        activity: '🎯 Strategy Alignment & Deep Focus',
        type: 'task',
        reason: 'No pending roadmap steps found. Focus block scheduled for personal alignment and strategic study.'
      })
    }

    // 4. Fitness
    actions.push({
      startTime: createTime(17, 30),
      endTime: createTime(18, 30),
      activity: '🏋️ Workout & Recovery',
      type: 'fitness',
      reason: 'Physical conditioning supports active cognitive resilience and reduces burnout risks.'
    })

    // 5. Evening Wind Down
    actions.push({
      startTime: createTime(20, 0),
      endTime: createTime(21, 30),
      activity: '🍽️ Family Dinner & Wind Down',
      type: 'recovery',
      reason: 'Supports mental recovery, stress reduction, and healthy personal relationships.'
    })

    // Sort actions by start time
    actions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    return {
      summary: 'Focused layout with balanced morning deep work, fitness recovery, and calendar integrations.',
      actions
    }
  }
}
