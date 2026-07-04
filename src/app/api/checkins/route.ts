import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 90)

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const checkins = await prisma.checkIn.findMany({
      where: { userId: userId as string },
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json({ data: checkins })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch check-ins' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, date, mood, energyMorning, sleepHours, focusToday, obstacles, gratitude, yesterdayAccomplished } = body

    if (!date || mood === undefined || energyMorning === undefined) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'date, mood, and energyMorning are required' } }, { status: 400 })
    }

    if (mood < 1 || mood > 5 || energyMorning < 1 || energyMorning > 10) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'mood must be 1-5, energyMorning must be 1-10' } }, { status: 400 })
    }

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const checkinDate = new Date(date)
    checkinDate.setHours(0, 0, 0, 0)

    const checkin = await prisma.checkIn.upsert({
      where: {
        userId_date: { userId: userId as string, date: checkinDate },
      },
      create: {
        userId: userId as string,
        date: checkinDate,
        mood,
        energyMorning,
        sleepHours: sleepHours ?? null,
        focusToday: focusToday ?? null,
        obstacles: obstacles ?? null,
        gratitude: gratitude ?? null,
        yesterdayAccomplished: yesterdayAccomplished ?? null,
      },
      update: {
        mood,
        energyMorning,
        sleepHours: sleepHours ?? null,
        focusToday: focusToday ?? null,
        obstacles: obstacles ?? null,
        gratitude: gratitude ?? null,
        yesterdayAccomplished: yesterdayAccomplished ?? null,
      },
    })

    return NextResponse.json({ data: checkin })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to save check-in' } }, { status: 500 })
  }
}
