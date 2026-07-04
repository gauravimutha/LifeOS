import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, type, periodKey } = body

    if (!userId || !type || !periodKey) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId, type, and periodKey are required' } }, { status: 400 })
    }

    const history = await prisma.executionHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const completedActions = history.filter(t => t.status === 'completed')
    const skippedActions = history.filter(t => t.status === 'skipped')

    const review = {
      type,
      periodKey,
      summary: `Review for ${periodKey}: ${completedActions.length} actions completed, ${skippedActions.length} skipped`,
      stats: {
        tasksCompleted: completedActions.length,
        tasksPending: skippedActions.length,
        totalTasks: history.length,
        completionRate: history.length > 0 ? Math.round((completedActions.length / history.length) * 100) : 0,
      },
      strengths: ['Consistent daily action execution'],
      improvements: ['Reduce skipped action rate'],
      focusForNext: 'Focus on setting realistic planning limits and improving focus blocks',
    }

    return NextResponse.json({ data: review })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate review' } }, { status: 500 })
  }
}
