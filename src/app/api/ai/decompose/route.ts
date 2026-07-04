import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, goalId, goalTitle, goalDescription } = body

    if (!userId || (!goalId && !goalTitle)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId and goalId or goalTitle are required' } }, { status: 400 })
    }

    let title = goalTitle
    let description = goalDescription ?? ''

    if (goalId) {
      const goal = await prisma.goal.findUnique({ where: { id: goalId } })
      if (!goal || goal.deletedAt) {
        return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } }, { status: 404 })
      }
      title = goal.title
      description = goal.description ?? ''
    }

    const subGoalSuggestions = [
      { title: `Research & Plan - ${title}`, description: `Initial research and planning phase for ${title}`, level: 'monthly' as const },
      { title: `Execute Phase 1 - ${title}`, description: `First execution phase for ${title}`, level: 'weekly' as const },
      { title: `Review & Iterate - ${title}`, description: `Review progress and iterate on ${title}`, level: 'weekly' as const },
    ]

    return NextResponse.json({ data: { originalGoal: { title, description }, suggestedSubGoals: subGoalSuggestions } })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to decompose goal' } }, { status: 500 })
  }
}
