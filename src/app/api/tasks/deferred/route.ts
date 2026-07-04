import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } }, { status: 400 })
    }

    // Fetch execution history of skipped actions from the last 14 days
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const skippedHistory = await prisma.executionHistory.findMany({
      where: {
        userId,
        status: 'skipped',
        createdAt: { gte: twoWeeksAgo }
      }
    })

    // Count skips per activity title or roadmapStepId
    const skipCounts: Record<string, { count: number; activity: string; roadmapStepId: string | null }> = {}
    skippedHistory.forEach(h => {
      const key = h.roadmapStepId || h.activity
      if (!skipCounts[key]) {
        skipCounts[key] = { count: 0, activity: h.activity, roadmapStepId: h.roadmapStepId }
      }
      skipCounts[key].count += 1
    })

    // Filter for activities skipped 3 or more times
    const deferredAlerts = Object.values(skipCounts)
      .filter(item => item.count >= 3)
      .map(item => ({
        // Map to task structure for frontend compatibility
        id: item.roadmapStepId || item.activity,
        title: item.activity,
        metadata: { deferCount: item.count }
      }))

    return NextResponse.json({ data: deferredAlerts })
  } catch (error) {
    console.error('Failed to fetch deferred alerts:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch deferred alerts' } }, { status: 500 })
  }
}
