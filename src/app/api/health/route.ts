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

    const where: Record<string, unknown> = { userId }
    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {}
      if (fromDate) dateFilter.gte = new Date(fromDate)
      if (toDate) dateFilter.lte = new Date(toDate)
      where.date = dateFilter
    }

    const data = await prisma.healthData.findMany({ where: where as any, orderBy: { date: 'desc' } })
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch health data' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, date, sleepHours, sleepQuality, energyLevel, moodScore, stressLevel, steps, exerciseMinutes } = body

    if (!userId || !date) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId and date are required' } }, { status: 400 })
    }

    const data = await prisma.healthData.upsert({
      where: { userId_date: { userId, date: new Date(date) } },
      update: {
        sleepHours: sleepHours ?? null,
        sleepQuality: sleepQuality ?? null,
        energyLevel: energyLevel ?? null,
        moodScore: moodScore ?? null,
        stressLevel: stressLevel ?? null,
        steps: steps ?? null,
        exerciseMinutes: exerciseMinutes ?? null,
      },
      create: {
        userId,
        date: new Date(date),
        sleepHours: sleepHours ?? null,
        sleepQuality: sleepQuality ?? null,
        energyLevel: energyLevel ?? null,
        moodScore: moodScore ?? null,
        stressLevel: stressLevel ?? null,
        steps: steps ?? null,
        exerciseMinutes: exerciseMinutes ?? null,
      },
    })
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to log health data' } }, { status: 500 })
  }
}
