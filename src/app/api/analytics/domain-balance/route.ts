import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } }, { status: 400 })
    }

    const goals = await prisma.goal.findMany({ where: { userId, deletedAt: null } })

    const domainMap: Record<string, { count: number; progressTotal: number }> = {}
    for (const goal of goals) {
      const category = (goal.metadata as Record<string, unknown>)?.category as string ?? 'uncategorized'
      if (!domainMap[category]) domainMap[category] = { count: 0, progressTotal: 0 }
      domainMap[category].count++
      domainMap[category].progressTotal += goal.progress
    }

    const domainBalance = Object.entries(domainMap).map(([domain, data]) => ({
      domain,
      score: data.count > 0 ? Math.round(data.progressTotal / data.count) : 0,
      count: data.count,
    }))

    return NextResponse.json({ data: domainBalance })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch domain balance' } }, { status: 500 })
  }
}
