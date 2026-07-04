import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    if (!userId) {
      return NextResponse.json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId, deletedAt: null }
    if (fromDate || toDate) {
      const startFilter: Record<string, Date> = {}
      if (fromDate) startFilter.gte = new Date(fromDate)
      if (toDate) startFilter.lte = new Date(toDate)
      where.startTime = startFilter
    }

    const events = await prisma.calendarEvent.findMany({
      where: where as any,
      orderBy: { startTime: 'asc' },
    })
    return NextResponse.json({ data: events })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch calendar events' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, title, description, location, startTime, endTime, isAllDay, eventType } = body

    if (!userId || !title || !startTime || !endTime) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId, title, startTime, and endTime are required' } }, { status: 400 })
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title,
        description: description ?? null,
        location: location ?? null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isAllDay: isAllDay ?? false,
        eventType: eventType ?? null,
      },
    })
    return NextResponse.json({ data: event }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create event' } }, { status: 500 })
  }
}
