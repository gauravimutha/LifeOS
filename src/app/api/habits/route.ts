import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const todayStr = new Date().toISOString().split('T')[0]
    const todayStart = new Date(todayStr)

    const habits = await prisma.habit.findMany({
      where: { userId: userId as string, deletedAt: null },
      include: {
        logs: {
          where: {
            date: todayStart
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = habits.map((h) => {
      const { logs, ...rest } = h
      return {
        ...rest,
        completedToday: logs.length > 0,
      }
    })

    return NextResponse.json({ data: formatted })
  } catch (error) {
    console.error('Failed to fetch habits:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch habits' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, title, description, habitType, frequency, goalId } = body

    if (!title || !habitType) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'title and habitType are required' } }, { status: 400 })
    }

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const habit = await prisma.habit.create({
      data: {
        userId,
        title,
        description: description ?? null,
        goalId: goalId ?? null,
        habitType,
        frequency: frequency ?? 'daily',
      },
    })
    return NextResponse.json({ data: habit }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create habit' } }, { status: 500 })
  }
}
