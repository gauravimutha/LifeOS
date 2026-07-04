import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } }, { status: 400 })
    }

    const [goals, history, habits, journalEntries] = await Promise.all([
      prisma.goal.findMany({ where: { userId, deletedAt: null }, select: { status: true } }),
      prisma.executionHistory.findMany({ where: { userId }, select: { status: true } }),
      prisma.habit.findMany({ where: { userId, deletedAt: null }, select: { status: true } }),
      prisma.journalEntry.findMany({ where: { userId, deletedAt: null }, select: { id: true } }),
    ])

    const activeGoals = goals.filter(g => g.status === 'active').length
    const completedGoals = goals.filter(g => g.status === 'completed').length
    const completedTasks = history.filter(t => t.status === 'completed').length
    const activeHabits = habits.filter(h => h.status === 'active').length

    const lifeScore = Math.round(
      (activeGoals / Math.max(goals.length, 1)) * 25 +
      (completedTasks / Math.max(history.length, 1)) * 25 +
      (activeHabits / Math.max(habits.length, 1)) * 25 +
      (journalEntries.length > 0 ? 25 : 0)
    )

    const domainBalance = [
      { domain: 'health', score: 0, count: 0 },
      { domain: 'career', score: 0, count: 0 },
      { domain: 'learning', score: 0, count: 0 },
      { domain: 'relationships', score: 0, count: 0 },
    ]

    return NextResponse.json({
      data: {
        lifeScore: Math.min(100, lifeScore),
        domainBalance,
        stats: {
          totalGoals: goals.length,
          activeGoals,
          completedGoals,
          totalTasks: history.length,
          completedTasks,
          pendingTasks: history.filter(t => t.status === 'skipped').length,
          activeHabits,
          journalEntries: journalEntries.length,
        },
      },
    })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard' } }, { status: 500 })
  }
}
