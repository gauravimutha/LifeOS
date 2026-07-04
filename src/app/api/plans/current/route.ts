import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

        const plan = await prisma.dailyPlan.findFirst({
      where: { userId, date: today },
      include: { actions: true }
    })
    const actions = plan?.actions || []

    const mappedTasks = actions.map(act => ({
      id: act.id,
      title: act.activity,
      status: act.status === 'completed' ? 'completed' : act.status === 'skipped' ? 'skipped' : 'pending',
      scheduledStart: act.startTime.toISOString(),
      scheduledEnd: act.endTime.toISOString(),
      reason: act.reason,
      type: act.type
    }))

    const habits = await prisma.habit.findMany({
      where: { userId, deletedAt: null, status: 'active' },
    })

    const routines = await prisma.routine.findMany({
      where: { userId, deletedAt: null, status: 'active' },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({
      data: {
        date: today.toISOString().split('T')[0],
        tasks: mappedTasks,
        habits,
        routines,
        totalItems: mappedTasks.length + habits.length + routines.length,
      },
    })
  } catch (error) {
    console.error('Failed to get current plan:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch current plan' } }, { status: 500 })
  }
}
