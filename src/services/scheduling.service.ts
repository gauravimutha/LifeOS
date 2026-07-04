import { db } from '@/lib/db'

export interface DailyActionInput {
  startTime: string
  endTime: string
  activity: string
  type: 'task' | 'routine' | 'meeting' | 'break' | 'fitness' | 'personal' | 'recovery'
  reason: string
  roadmapStepId?: string | null
}

export const schedulingService = {
  async generateDeterministicSchedule(userId: string, dateStr: string): Promise<{
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
  }> {
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setDate(dayEnd.getDate() + 1)

    // 1. Gather all database records
    const [user, activeGoals, calendarEvents, routines, lastExecutionHistory, preferences] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.goal.findMany({
        where: { userId, status: 'active', deletedAt: null },
        include: { roadmaps: { where: { status: 'active', deletedAt: null }, include: { steps: true } } }
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
        take: 15
      }),
      db.user.findUnique({ where: { id: userId } }).then(u => (u?.preferences as Record<string, any>) || {})
    ])

    if (!user) {
      throw new Error('User not found')
    }

    const sleepHour = preferences.sleepHour !== undefined ? Number(preferences.sleepHour) : 23
    const wakeHour = preferences.wakeHour !== undefined ? Number(preferences.wakeHour) : 7
    const focusedHours = preferences.focusedHours || 'standard hours' // 'standard hours', 'early bird', 'night owl'

    // Helper: Create absolute dates for target day
    const createTime = (hours: number, minutes = 0) => {
      const d = new Date(targetDate)
      d.setHours(hours, minutes, 0, 0)
      return d
    }

    // 2. Define Day Time Windows
    const wakeTime = createTime(wakeHour, 0)
    const sleepTime = createTime(sleepHour, 0)

    // Schedule actions array
    const actions: DailyActionInput[] = []

    // A. Add sleep blocks
    actions.push({
      startTime: createTime(0, 0).toISOString(),
      endTime: wakeTime.toISOString(),
      activity: '💤 Sleep & Rest',
      type: 'recovery',
      reason: 'Essential physical recovery and memory consolidation.'
    })
    actions.push({
      startTime: sleepTime.toISOString(),
      endTime: createTime(23, 59).toISOString(),
      activity: '💤 Sleep & Rest',
      type: 'recovery',
      reason: 'Supports cognitive repair and prepares body for tomorrow.'
    })

    // B. Add fixed calendar commitments
    calendarEvents.forEach(evt => {
      actions.push({
        startTime: evt.startTime.toISOString(),
        endTime: evt.endTime.toISOString(),
        activity: `📅 ${evt.title}`,
        type: 'meeting',
        reason: 'Synchronized from external calendar commitments.'
      })
    })

    // C. Add Morning/Evening routines if defined
    const morningRoutine = routines.find(r => r.routineType === 'morning')
    const eveningRoutine = routines.find(r => r.routineType === 'evening')

    if (morningRoutine && morningRoutine.steps.length > 0) {
      const rDuration = morningRoutine.steps.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0) || 30
      const rStart = new Date(wakeTime)
      const rEnd = new Date(wakeTime.getTime() + rDuration * 60000)
      
      actions.push({
        startTime: rStart.toISOString(),
        endTime: rEnd.toISOString(),
        activity: `🌅 Routine: ${morningRoutine.title}`,
        type: 'routine',
        reason: 'Start the day with focused, mindful habits to gain momentum.'
      })
    }

    if (eveningRoutine && eveningRoutine.steps.length > 0) {
      const rDuration = eveningRoutine.steps.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0) || 30
      const rStart = new Date(sleepTime.getTime() - rDuration * 60000)
      const rEnd = new Date(sleepTime)

      actions.push({
        startTime: rStart.toISOString(),
        endTime: rEnd.toISOString(),
        activity: `🌃 Routine: ${eveningRoutine.title}`,
        type: 'routine',
        reason: 'Wind down and prepare body for high-quality sleep.'
      })
    }

    // Helper to find non-overlapping slots during active hours
    const getAvailableSlots = (start: Date, end: Date, existingActions: DailyActionInput[]): Array<{ start: Date; end: Date }> => {
      const sorted = [...existingActions]
        .map(a => ({ start: new Date(a.startTime), end: new Date(a.endTime) }))
        .sort((a, b) => a.start.getTime() - b.start.getTime())

      const slots: Array<{ start: Date; end: Date }> = []
      let current = new Date(start)

      for (const act of sorted) {
        if (act.start > current) {
          if (act.start.getTime() - current.getTime() >= 15 * 60000) {
            slots.push({ start: new Date(current), end: new Date(act.start) })
          }
        }
        if (act.end > current) {
          current = new Date(act.end)
        }
      }

      if (end > current && end.getTime() - current.getTime() >= 15 * 60000) {
        slots.push({ start: new Date(current), end: new Date(end) })
      }

      return slots
    }

    // D. Select top priority roadmap tasks to schedule in available focus hours
    const pendingSteps: Array<{
      stepId: string
      stepTitle: string
      roadmapTitle: string
      goalTitle: string
      priority: number
      deadline?: Date | null
    }> = []

    for (const goal of activeGoals) {
      for (const roadmap of goal.roadmaps) {
        const nextSteps = roadmap.steps
          .filter(s => !s.isCompleted)
          .sort((a, b) => a.order - b.order)
        if (nextSteps.length > 0) {
          pendingSteps.push({
            stepId: nextSteps[0].id,
            stepTitle: nextSteps[0].title,
            roadmapTitle: roadmap.title,
            goalTitle: goal.title,
            priority: goal.priority,
            deadline: goal.targetDate
          })
        }
      }
    }

    // Sort steps: First by deadline, then by goal priority
    pendingSteps.sort((a, b) => {
      if (a.deadline && b.deadline) {
        return a.deadline.getTime() - b.deadline.getTime()
      }
      if (a.deadline) return -1
      if (b.deadline) return 1
      return b.priority - a.priority
    })

    // Schedule Deep Work Focus Blocks for the top tasks
    let stepIndex = 0
    let scheduledWorkMinutes = 0
    const maxWorkMinutes = 300 // Max 5 hours of total deep work tasks scheduled per day

    let focusStartHour = 9
    let focusEndHour = 17

    if (focusedHours === 'early bird') {
      focusStartHour = 8
      focusEndHour = 15
    } else if (focusedHours === 'night owl') {
      focusStartHour = 13
      focusEndHour = 21
    }

    const activeFocusStart = createTime(focusStartHour, 0)
    const activeFocusEnd = createTime(focusEndHour, 0)

    while (stepIndex < pendingSteps.length && scheduledWorkMinutes < maxWorkMinutes) {
      const step = pendingSteps[stepIndex]
      const available = getAvailableSlots(activeFocusStart, activeFocusEnd, actions)

      const suitableSlot = available.find(s => (s.end.getTime() - s.start.getTime()) >= 60 * 60000)

      if (suitableSlot) {
        const duration = Math.min(120, Math.round((suitableSlot.end.getTime() - suitableSlot.start.getTime()) / 60000))
        const taskEnd = new Date(suitableSlot.start.getTime() + duration * 60000)

        actions.push({
          startTime: suitableSlot.start.toISOString(),
          endTime: taskEnd.toISOString(),
          activity: `🎯 Focus: ${step.stepTitle}`,
          type: 'task',
          reason: `High priority step for "${step.goalTitle}". Scheduled during optimal focused hours.`,
          roadmapStepId: step.stepId
        })

        scheduledWorkMinutes += duration

        if (taskEnd.getTime() + 15 * 60000 <= suitableSlot.end.getTime()) {
          actions.push({
            startTime: taskEnd.toISOString(),
            endTime: new Date(taskEnd.getTime() + 15 * 60000).toISOString(),
            activity: '☕ Refresh & Recharge',
            type: 'break',
            reason: 'Brief recovery buffer to prevent fatigue accumulation.'
          })
        }
      } else {
        break
      }
      stepIndex++
    }

    // E. Balance with Health & Fitness
    const finalSlots = getAvailableSlots(wakeTime, sleepTime, actions)
    
    const fitnessSlot = finalSlots.find(s => {
      const startHour = s.start.getHours()
      return startHour >= 16 && startHour <= 19 && (s.end.getTime() - s.start.getTime()) >= 45 * 60000
    })
    if (fitnessSlot) {
      const fitStart = new Date(fitnessSlot.start)
      const fitEnd = new Date(fitStart.getTime() + 45 * 60000)
      actions.push({
        startTime: fitStart.toISOString(),
        endTime: fitEnd.toISOString(),
        activity: '🏋️ Workout & Active Health',
        type: 'fitness',
        reason: 'Physical movement boosts mood, cognitive resilience, and balances focus fatigue.'
      })
    }

    // Sort final actions by start time
    actions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    // F. Persist today's schedule in the database
    const existingPlan = await db.dailyPlan.findUnique({
      where: { userId_date: { userId, date: targetDate } }
    })
    const planId = existingPlan ? existingPlan.id : crypto.randomUUID()

    const summaryStr = scheduledWorkMinutes > 0 
      ? `Balanced focus plan with ${Math.round(scheduledWorkMinutes / 60)}h of deep tasks, routines, and rest buffers.`
      : 'Light day with focus on routines, meetings, and recovery.'

    const [upsertedPlan, _deletedActions, ...createdActions] = await db.$transaction([
      db.dailyPlan.upsert({
        where: { userId_date: { userId, date: targetDate } },
        update: { summary: summaryStr },
        create: {
          id: planId,
          userId,
          date: targetDate,
          summary: summaryStr
        }
      }),
      db.dailyAction.deleteMany({
        where: { dailyPlanId: planId }
      }),
      ...actions.map(act => 
        db.dailyAction.create({
          data: {
            dailyPlanId: planId,
            userId,
            roadmapStepId: act.roadmapStepId || null,
            startTime: new Date(act.startTime),
            endTime: new Date(act.endTime),
            activity: act.activity,
            type: act.type,
            reason: act.reason,
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
      actions: (createdActions as any[]).map(a => ({
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
  }
}
