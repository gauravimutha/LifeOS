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

    const historyWhere: Record<string, unknown> = { userId }
    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {}
      if (fromDate) dateFilter.gte = new Date(fromDate)
      if (toDate) dateFilter.lte = new Date(toDate)
      historyWhere.date = dateFilter
    }

    const history = await prisma.executionHistory.findMany({ where: historyWhere as any, orderBy: { date: 'asc' } })

    const dailyCounts: Record<string, { created: number; completed: number }> = {}
    for (const log of history) {
      const logDate = log.date.toISOString().split('T')[0]
      if (!dailyCounts[logDate]) dailyCounts[logDate] = { created: 0, completed: 0 }
      dailyCounts[logDate].created++
      if (log.status === 'completed') {
        dailyCounts[logDate].completed++
      }
    }

    const trends = Object.entries(dailyCounts).map(([date, counts]) => ({
      date,
      tasksCreated: counts.created,
      tasksCompleted: counts.completed,
    }))

    return NextResponse.json({ data: trends })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trends' } }, { status: 500 })
  }
}
