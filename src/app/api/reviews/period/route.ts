import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const periodKey = searchParams.get('periodKey')

    if (!userId || !type || !periodKey) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId, type, and periodKey are required' } }, { status: 400 })
    }

    const review = await prisma.periodReview.findUnique({
      where: { userId_type_periodKey: { userId, type, periodKey } },
    })

    return NextResponse.json({ data: review })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch period review' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, type, periodKey } = body

    if (!userId || !type || !periodKey) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId, type, and periodKey are required' } }, { status: 400 })
    }

    const today = new Date()
    let startDate: Date
    let endDate: Date

    if (type === 'weekly') {
      const dayOfWeek = today.getDay()
      startDate = new Date(today)
      startDate.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    const history = await prisma.executionHistory.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    })

    const checkins = await prisma.checkIn.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    })

    const habits = await prisma.habitLog.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    })

    const goals = await prisma.goal.findMany({
      where: { userId, deletedAt: null },
    })

    const completedActions = history.filter((t: any) => t.status === 'completed')
    const skippedActions = history.filter((t: any) => t.status === 'skipped')
    const goalsAdvanced = goals.filter((g) => g.status === 'completed' || g.progress > 50).length

    const avgMood = checkins.length > 0
      ? Math.round(checkins.reduce((sum, c) => sum + c.mood, 0) / checkins.length * 10) / 10
      : null
    const avgEnergy = checkins.length > 0
      ? Math.round(checkins.reduce((sum, c) => sum + c.energyMorning, 0) / checkins.length * 10) / 10
      : null
    const avgSleep = checkins.length > 0
      ? checkins.reduce((sum, c) => sum + (c.sleepHours ?? 0), 0) / checkins.filter((c) => c.sleepHours !== null).length
      : null
    const avgProductivity = completedActions.length > 0
      ? Math.round((completedActions.length / Math.max(history.length, 1)) * 10 * 10) / 10
      : null

    const stats = {
      tasksCompleted: completedActions.length,
      tasksCreated: history.length,
      avgMood,
      avgEnergy,
      avgSleep: avgSleep !== null && !isNaN(avgSleep) ? Math.round(avgSleep * 10) / 10 : null,
      avgProductivity,
      goalsAdvanced,
      streaks: { current: habits.length, longest: habits.length },
    }

    const highlights: string[] = []
    const challenges: string[] = []

    if (completedActions.length > 3) {
      highlights.push(`Completed ${completedActions.length} actions this ${type}`)
    }
    if (avgMood && avgMood > 3) {
      highlights.push(`Maintained positive mood (${avgMood.toFixed(1)}/5)`)
    }
    if (goalsAdvanced > 2) {
      highlights.push(`Made progress on ${goalsAdvanced} goals`)
    }
    if (skippedActions.length > completedActions.length && skippedActions.length > 5) {
      challenges.push(`${skippedActions.length} actions skipped — consider reducing focus load`)
    }
    if (avgSleep && avgSleep < 6) {
      challenges.push('Average sleep below 6 hours — prioritize rest')
    }
    if (highlights.length === 0) highlights.push('Steady progress this period')

    const aiSummary = `Period review for ${periodKey}: ${completedActions.length} actions completed out of ${history.length} scheduled. ${avgMood ? `Average mood: ${avgMood.toFixed(1)}/5. ` : ''}${goalsAdvanced} goals showing progress.`

    const review = await prisma.periodReview.upsert({
      where: { userId_type_periodKey: { userId, type, periodKey } },
      create: {
        userId,
        type,
        periodKey,
        startDate,
        endDate,
        stats,
        aiSummary,
        highlights,
        challenges,
        focusForNext: skippedActions.length > 0
          ? `Focus on reducing skipped actions (${skippedActions.length} logged this period)`
          : 'Set new goals for the next period',
      },
      update: {
        stats,
        aiSummary,
        highlights,
        challenges,
        focusForNext: skippedActions.length > 0
          ? `Focus on reducing skipped actions (${skippedActions.length} logged this period)`
          : 'Set new goals for the next period',
      },
    })

    return NextResponse.json({ data: review })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate period review' } }, { status: 500 })
  }
}
