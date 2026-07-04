import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } }, { status: 400 })
    }

    const routines = await prisma.routine.findMany({
      where: { userId, deletedAt: null },
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: routines })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch routines' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, title, description, routineType, timeOfDay, durationMinutes, isFlexible } = body

    if (!userId || !title || !routineType) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId, title, and routineType are required' } }, { status: 400 })
    }

    const routine = await prisma.routine.create({
      data: {
        userId,
        title,
        description: description ?? null,
        routineType,
        timeOfDay: timeOfDay ?? null,
        durationMinutes: durationMinutes ?? null,
        isFlexible: isFlexible ?? true,
      },
    })
    return NextResponse.json({ data: routine }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create routine' } }, { status: 500 })
  }
}
