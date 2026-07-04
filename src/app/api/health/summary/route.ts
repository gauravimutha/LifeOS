import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } }, { status: 400 })
    }

    const records = await prisma.healthData.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    })

    if (records.length === 0) {
      return NextResponse.json({ data: null })
    }

    const summary = {
      avgSleepHours: records.reduce((s, r) => s + (r.sleepHours ?? 0), 0) / records.filter(r => r.sleepHours !== null).length || 0,
      avgSleepQuality: records.reduce((s, r) => s + (r.sleepQuality ?? 0), 0) / records.filter(r => r.sleepQuality !== null).length || 0,
      avgEnergyLevel: records.reduce((s, r) => s + (r.energyLevel ?? 0), 0) / records.filter(r => r.energyLevel !== null).length || 0,
      avgMoodScore: records.reduce((s, r) => s + (r.moodScore ?? 0), 0) / records.filter(r => r.moodScore !== null).length || 0,
      avgStressLevel: records.reduce((s, r) => s + (r.stressLevel ?? 0), 0) / records.filter(r => r.stressLevel !== null).length || 0,
      avgSteps: Math.round(records.reduce((s, r) => s + (r.steps ?? 0), 0) / records.filter(r => r.steps !== null).length) || 0,
      totalExerciseMinutes: records.reduce((s, r) => s + (r.exerciseMinutes ?? 0), 0),
      recordCount: records.length,
      period: '30d',
    }

    return NextResponse.json({ data: summary })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch health summary' } }, { status: 500 })
  }
}
