import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, date } = body

    if (!userId || !date) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId and date are required' } }, { status: 400 })
    }

    const targetDate = new Date(date)
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

        const pendingSteps = await prisma.roadmapStep.findMany({
      where: {
        roadmap: { userId },
        isCompleted: false
      },
      orderBy: { order: 'asc' }
    })

    const activeHabits = await prisma.habit.findMany({
      where: { userId, deletedAt: null, status: 'active' },
    })

    const plan = {
      date,
      summary: `Plan for ${date} with ${pendingSteps.length} goal milestones and ${activeHabits.length} habits`,
      priorities: pendingSteps.slice(0, 3).map(s => ({
        taskId: s.id,
        title: s.title,
        priority: 3,
        estimatedMinutes: 60,
      })),
      habitsToTrack: activeHabits.map(h => ({ habitId: h.id, title: h.title })),
      totalTasks: pendingSteps.length,
      totalEstimatedMinutes: pendingSteps.length * 60,
    }

    return NextResponse.json({ data: plan })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate plan' } }, { status: 500 })
  }
}
