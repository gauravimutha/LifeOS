import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await _req.json()
    const { userId, date, value, note } = body

    if (!userId || !date) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId and date are required' } }, { status: 400 })
    }

    const habit = await prisma.habit.findUnique({ where: { id } })
    if (!habit || habit.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Habit not found' } }, { status: 404 })
    }

    const log = await prisma.habitLog.upsert({
      where: { habitId_userId_date: { habitId: id, userId, date: new Date(date) } },
      update: { value: value ?? null, note: note ?? null },
      create: { habitId: id, userId, date: new Date(date), value: value ?? null, note: note ?? null },
    })

    // Offload streak calculations and Habit model updates to a background task
    const habitBestStreakBefore = habit.bestStreak

    Promise.resolve().then(async () => {
      try {
        const logs = await prisma.habitLog.findMany({
          where: { habitId: id },
          orderBy: { date: 'desc' },
        })

        const sorted = logs.sort((a, b) => a.date.getTime() - b.date.getTime())
        let streak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        for (let i = sorted.length - 1; i >= 0; i--) {
          const logDate = new Date(sorted[i].date)
          logDate.setHours(0, 0, 0, 0)
          const expected = new Date(today)
          expected.setDate(expected.getDate() - (sorted.length - 1 - i))
          expected.setHours(0, 0, 0, 0)
          if (logDate.getTime() !== expected.getTime()) break
          streak++
        }

        const bestStreak = Math.max(habitBestStreakBefore, streak)
        const totalCount = logs.length

        await prisma.habit.update({
          where: { id },
          data: { streak, bestStreak, totalCount },
        })
      } catch (backgroundErr) {
        console.error('[Background Worker] Failed to update habit streaks:', backgroundErr)
      }
    })

    return NextResponse.json({ data: log }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to log habit' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    if (!userId || !date) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId and date are required' } }, { status: 400 })
    }

    const habit = await prisma.habit.findUnique({ where: { id } })
    if (!habit || habit.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Habit not found' } }, { status: 404 })
    }

    try {
      await prisma.habitLog.delete({
        where: {
          habitId_userId_date: {
            habitId: id,
            userId,
            date: new Date(date)
          }
        }
      })
    } catch (err) {
      // If it doesn't exist, we can ignore
    }

    const habitBestStreakBefore = habit.bestStreak

    Promise.resolve().then(async () => {
      try {
        const logs = await prisma.habitLog.findMany({
          where: { habitId: id },
          orderBy: { date: 'desc' },
        })

        const sorted = logs.sort((a, b) => a.date.getTime() - b.date.getTime())
        let streak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        for (let i = sorted.length - 1; i >= 0; i--) {
          const logDate = new Date(sorted[i].date)
          logDate.setHours(0, 0, 0, 0)
          const expected = new Date(today)
          expected.setDate(expected.getDate() - (sorted.length - 1 - i))
          expected.setHours(0, 0, 0, 0)
          if (logDate.getTime() !== expected.getTime()) break
          streak++
        }

        const totalCount = logs.length

        await prisma.habit.update({
          where: { id },
          data: { streak, bestStreak: Math.max(habitBestStreakBefore, streak), totalCount },
        })
      } catch (backgroundErr) {
        console.error('[Background Worker] Failed to update habit streaks on delete:', backgroundErr)
      }
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete habit log' } }, { status: 500 })
  }
}
