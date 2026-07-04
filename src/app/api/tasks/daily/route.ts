import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { planningService } from '@/services/planning.service'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    if (!userId) {
      return NextResponse.json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } }, { status: 400 })
    }

    const todayStr = date || new Date().toISOString().split('T')[0]
    const targetDate = new Date(todayStr)
    targetDate.setHours(0, 0, 0, 0)

    // Find existing plan, or generate it
    let plan = await prisma.dailyPlan.findFirst({
      where: { userId, date: targetDate },
      include: { actions: true }
    })

    let actions = plan?.actions || []

    if (!plan) {
      try {
        const generated = await planningService.generateDailyPlan(userId, todayStr)
        actions = await prisma.dailyAction.findMany({
          where: { dailyPlanId: generated.id }
        })
      } catch (err) {
        console.warn('Failed to generate daily plan in API, using local builder:', err)
      }
    }

    // Map DailyAction to legacy Task structure for frontend compatibility
    const mappedTasks = actions.map(act => ({
      id: act.id,
      title: act.activity,
      description: act.reason,
      status: act.status === 'completed' ? 'completed' : act.status === 'skipped' ? 'skipped' : 'pending',
      priority: 3,
      scheduledStart: act.startTime.toISOString(),
      scheduledEnd: act.endTime.toISOString(),
      metadata: { reason: act.reason },
      type: act.type
    }))

    return NextResponse.json({ data: mappedTasks })
  } catch (error) {
    console.error('Failed to get daily tasks:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch daily actions' } }, { status: 500 })
  }
}
