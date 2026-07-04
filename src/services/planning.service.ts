import { db } from '@/lib/db'
import { aiClient } from './ai/client'
import { safeParseJson } from '@/lib/json'
import { executeAIFeature, AIFeatureDefinition } from './ai/fallback'

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
    const { schedulingService } = await import('./scheduling.service')
    return schedulingService.generateDeterministicSchedule(userId, dateStr)
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
  },

  generateSafeDefaultPlan(userId: string, dateStr: string): any {
    const baseDate = new Date(dateStr)
    const createTime = (hours: number, minutes = 0) => {
      const d = new Date(baseDate)
      d.setHours(hours, minutes, 0, 0)
      return d.toISOString()
    }
    return {
      summary: 'Advanced AI personalization is temporarily offline. Loading default configurations.',
      actions: [
        {
          startTime: createTime(9, 0),
          endTime: createTime(17, 0),
          activity: 'Daily Focus & Core Priorities',
          type: 'task',
          reason: 'Safe default action scheduled because AI is temporarily unavailable.',
          roadmapStepId: null
        }
      ]
    }
  }
}
