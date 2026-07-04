import { db } from '@/lib/db'

export interface GoalHealthMetrics {
  progress: number
  expectedProgress: number
  progressStatus: 'ahead' | 'on_track' | 'behind'
  timeRemainingDays: number
  workRemainingHours: number
  timeStatus: 'adequate' | 'tight' | 'overdue'
  recentConsistency: number // 0-100%
  overdueTasksCount: number
  healthScore: number // 0-100 overall
  healthLabel: 'Excellent' | 'Good' | 'Fair' | 'Critical'
}

export const goalHealthEngine = {
  async calculateGoalHealth(goalId: string): Promise<GoalHealthMetrics> {
    const goal = await db.goal.findUnique({
      where: { id: goalId },
      include: {
        roadmaps: {
          where: { deletedAt: null },
          include: { steps: true }
        }
      }
    })

    if (!goal || goal.deletedAt) {
      throw new Error('Goal not found')
    }

    const now = new Date()
    const createdAt = goal.createdAt
    const targetDate = goal.targetDate

    // 1. Progress vs Expected Progress
    const progress = goal.progress || 0
    let expectedProgress = 0
    if (targetDate) {
      const totalTime = targetDate.getTime() - createdAt.getTime()
      const elapsed = now.getTime() - createdAt.getTime()
      if (totalTime > 0) {
        expectedProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalTime) * 100)))
      }
    }

    let progressStatus: 'ahead' | 'on_track' | 'behind' = 'on_track'
    if (progress > expectedProgress + 10) {
      progressStatus = 'ahead'
    } else if (progress < expectedProgress - 15) {
      progressStatus = 'behind'
    }

    // 2. Time Remaining vs Work Remaining
    let timeRemainingDays = 90 // Default if no target date
    if (targetDate) {
      const diffMs = targetDate.getTime() - now.getTime()
      timeRemainingDays = Math.round(diffMs / (24 * 60 * 60 * 1000))
    }

    let workRemainingHours = 0
    let overdueTasksCount = 0

    goal.roadmaps.forEach(r => {
      const incomplete = r.steps.filter(s => !s.isCompleted)
      incomplete.forEach(s => {
        // Parse metadata duration, e.g. "2 hours" or default to 2
        const metaDuration = (s.metadata as Record<string, any>)?.estimatedDuration
        let hours = 2
        if (metaDuration && typeof metaDuration === 'string') {
          const match = metaDuration.match(/(\d+)\s*(hour|hr|wk|week|day)/i)
          if (match) {
            const val = parseInt(match[1])
            if (metaDuration.includes('week')) hours = val * 15
            else if (metaDuration.includes('day')) hours = val * 4
            else hours = val
          }
        }
        workRemainingHours += hours
      })

      // Overdue calculation
      if (targetDate && targetDate < now) {
        overdueTasksCount += incomplete.length
      } else {
        const totalSteps = r.steps.length
        if (totalSteps > 0 && targetDate) {
          const timeElapsedRatio = (now.getTime() - createdAt.getTime()) / (targetDate.getTime() - createdAt.getTime())
          const expectedCompletedStepsCount = Math.min(totalSteps, Math.floor(timeElapsedRatio * totalSteps))
          const actualCompletedCount = r.steps.filter(s => s.isCompleted).length
          if (actualCompletedCount < expectedCompletedStepsCount) {
            overdueTasksCount += Math.min(incomplete.length, expectedCompletedStepsCount - actualCompletedCount)
          }
        }
      }
    })

    let timeStatus: 'adequate' | 'tight' | 'overdue' = 'adequate'
    if (timeRemainingDays < 0) {
      timeStatus = 'overdue'
    } else {
      const estimatedDaysNeeded = workRemainingHours / 3 // Assume 3 hours/day allocated
      if (timeRemainingDays < estimatedDaysNeeded) {
        timeStatus = 'tight'
      }
    }

    // 3. Recent Consistency (last 7 days completion history for this goal)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const stepIds: string[] = []
    goal.roadmaps.forEach(r => r.steps.forEach(s => stepIds.push(s.id)))

    const history = await db.executionHistory.findMany({
      where: {
        userId: goal.userId,
        roadmapStepId: { in: stepIds },
        date: { gte: sevenDaysAgo }
      }
    })

    const totalScheduled = history.length
    const completed = history.filter(h => h.status === 'completed').length
    const recentConsistency = totalScheduled > 0 ? Math.round((completed / totalScheduled) * 100) : 100

    // 4. Overall Health Score (0-100)
    let score = 100
    if (progressStatus === 'behind') score -= 20
    if (progressStatus === 'ahead') score += 5
    if (timeStatus === 'tight') score -= 15
    if (timeStatus === 'overdue') score -= 35
    score -= overdueTasksCount * 5
    score = score * 0.6 + recentConsistency * 0.4
    const healthScore = Math.min(100, Math.max(0, Math.round(score)))

    let healthLabel: 'Excellent' | 'Good' | 'Fair' | 'Critical' = 'Good'
    if (healthScore >= 85) healthLabel = 'Excellent'
    else if (healthScore >= 70) healthLabel = 'Good'
    else if (healthScore >= 50) healthLabel = 'Fair'
    else healthLabel = 'Critical'

    return {
      progress,
      expectedProgress,
      progressStatus,
      timeRemainingDays,
      workRemainingHours,
      timeStatus,
      recentConsistency,
      overdueTasksCount,
      healthScore,
      healthLabel
    }
  }
}
