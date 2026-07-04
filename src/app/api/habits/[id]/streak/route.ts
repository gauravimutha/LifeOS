import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const habit = await prisma.habit.findUnique({ where: { id } })
    if (!habit || habit.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Habit not found' } }, { status: 404 })
    }
    return NextResponse.json({ data: { current: habit.streak, best: habit.bestStreak, total: habit.totalCount } })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch streak' } }, { status: 500 })
  }
}
