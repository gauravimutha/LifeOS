import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, startTime, endTime } = body

    if (!userId || !startTime || !endTime) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId, startTime, and endTime are required' } }, { status: 400 })
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    const conflicts = await prisma.calendarEvent.findMany({
      where: {
        userId,
        deletedAt: null,
        startTime: { lt: end },
        endTime: { gt: start },
      } as any,
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json({ data: conflicts })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to check conflicts' } }, { status: 500 })
  }
}
