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

    const records = await prisma.healthData.findMany({
      where: where as any,
      orderBy: { date: 'asc' },
    })

    const trends = {
      sleep: records.map(r => ({ date: r.date.toISOString().split('T')[0], value: r.sleepHours })),
      energy: records.map(r => ({ date: r.date.toISOString().split('T')[0], value: r.energyLevel })),
      mood: records.map(r => ({ date: r.date.toISOString().split('T')[0], value: r.moodScore })),
      stress: records.map(r => ({ date: r.date.toISOString().split('T')[0], value: r.stressLevel })),
    }

    return NextResponse.json({ data: trends })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch health trends' } }, { status: 500 })
  }
}
